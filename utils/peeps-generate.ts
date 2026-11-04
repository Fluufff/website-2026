// deno run --allow-env --env-file=.env.local --allow-read --allow-net --allow-write utils/peeps-generate.ts

// Writes a new peeps.json based on the contents of the "Staff & Volunteers" spreadsheet.

// 1) make sure that the 3 oauth related environmental values are set properly
// 2) grab the speadsheet id from the url (after `/d/`) and set that value too

// some things to note:
// - people appear in the order of the spreadsheet (based on their first eligible role)
// (e.g. if someone is deputy of accounting and head of feedback then they might not show next to feedback deputies)

import assert from 'node:assert'

interface Volunteer {
  id: string
  name: string
  department: string
  role: string
}

interface Peep {
  id: string
  name: string
  titles: string[]
}

const { PEEPS_CLIENT_ID, PEEPS_CLIENT_SECRET, PEEPS_REFRESH_TOKEN, PEEPS_SPREADSHEET_ID } = Deno.env.toObject()

assert(PEEPS_CLIENT_ID)
assert(PEEPS_CLIENT_SECRET)
assert(PEEPS_REFRESH_TOKEN)
assert(PEEPS_SPREADSHEET_ID)

const pathname = './src/data/hr/peeps.json'

const orphaned_peeps = new Set()
JSON.parse(Deno.readTextFileSync(pathname)).forEach((peep: Peep) => orphaned_peeps.add(peep.id))

// get access token from refresh token
const access_token_response = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  body: new URLSearchParams({
    client_id: PEEPS_CLIENT_ID,
    client_secret: PEEPS_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: PEEPS_REFRESH_TOKEN
  })
})
const access_token_json = await access_token_response.json()
const access_token = access_token_json['access_token']

// retrieve the volunteers list
const spreadsheet_response = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${PEEPS_SPREADSHEET_ID}?` +
    new URLSearchParams({
      includeGridData: 'true',
      fields: 'sheets.data.rowData.values(formattedValue,chipRuns)'
    }),
  {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  }
)
const spreadsheet_json = await spreadsheet_response.json()
const spreadsheet_rows = spreadsheet_json['sheets'][0]['data'][0]['rowData']

// this script operates under the assumption that the first sheet contains these columns
const spreadsheet_header_row = spreadsheet_rows.shift()
const spreadsheet_header = spreadsheet_header_row['values'].map((row: Record<string, string>) => row['formattedValue'])
assert.equal(spreadsheet_header.join(', '), 'Team member, Department, Role, Notes')

let all_volunteers: Volunteer[] = []
/* eslint-disable @typescript-eslint/no-explicit-any */
// deno-lint-ignore no-explicit-any
spreadsheet_rows.forEach((spreadsheet_row: any) => {
  if (spreadsheet_row['values'][0]['formattedValue']) {
    all_volunteers.push({
      id: spreadsheet_row['values'][0]['chipRuns'][0]['chip']['personProperties']['email'].split('@')[0],
      name: spreadsheet_row['values'][0]['formattedValue'],
      department: spreadsheet_row['values'][1]['formattedValue'],
      role: spreadsheet_row['values'][2]?.['formattedValue'] ?? ''
    })
  }
})
/* eslint-enable @typescript-eslint/no-explicit-any */

// pretend the chairman is set in the spreadsheet as well
all_volunteers.unshift({
  id: 'jawbreaker',
  name: 'Jawbreaker',
  department: 'Board',
  role: 'Chairman'
})

// console.log(all_volunteers)
all_volunteers = all_volunteers.filter((volunteer) => {
  return ['Head', 'Deputy'].includes(volunteer.role) || volunteer.department == 'Board'
})
// console.log(all_volunteers)

function get_department(string: string) {
  string = string.replace('Reg', 'Registration')
  string = string.replace('IT & Web', 'IT')
  return string
}

function get_title(volunteer: Volunteer) {
  if (volunteer.department == 'Board') return volunteer.role

  return `${volunteer.role} of ${get_department(volunteer.department)}`
}

function get_name(volunteer: Volunteer) {
  // // has a google nickname inside 2 parentheses
  // const match = /\((.*)\)/.exec(volunteer.name)
  // if (match) {
  //   return match[1]
  // }

  // check if the name without spaces matches the username
  const glued_together = volunteer.name.replaceAll(' ', '')
  if (glued_together.toLowerCase() == volunteer.id) {
    return glued_together
  }

  // drop words deemed lesser
  if (volunteer.name.includes(' ')) {
    const words = volunteer.name.split(' ')
    const shortened_name = words
      .filter((word) => {
        return !(word.toLowerCase() == word || word.toUpperCase() == word || word.includes("'"))
      })
      .join(' ')
    if (volunteer.name != shortened_name) {
      return shortened_name
    }
  }

  return volunteer.name
}

const peeps: Peep[] = []

all_volunteers.forEach((volunteer) => {
  const peep = peeps.find((peep) => peep.id == volunteer.id)
  const title = get_title(volunteer)

  if (!peep) {
    return peeps.push({
      id: volunteer.id,
      name: get_name(volunteer),
      titles: [title]
    })
  }

  if (!peep.titles.includes(title)) {
    peep.titles.push(title)
  }
})

const json = JSON.stringify(peeps, null, 2)
console.log(json)
Deno.writeTextFileSync(pathname, `${json}\n`)

// if a peep was removed we remove their image as well,
// files not (yet) belonging to a peep do not get deleted.
peeps.forEach((peep: Peep) => orphaned_peeps.delete(peep.id))
for (const file of Deno.readDirSync('./src/assets/images/peeps')) {
  // if (!peeps.find(peep => peep.id == file.name.split('.')[0])) {
  if (orphaned_peeps.has(file.name.split('.')[0])) {
    Deno.removeSync(`./src/assets/images/peeps/${file.name}`)
  }
}
