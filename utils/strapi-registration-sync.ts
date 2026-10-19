// deno run --allow-env --env-file=.env.local --allow-net utils/strapi-registration-sync.ts

// Extracts the availability of the goodies, rooms & tickets from the registration system and uploads those into strapi.

// note: must not run in github actions or on an unsecured server since you are logging into the highly sensitive reg db.

import assert from 'node:assert'
// deno-lint-ignore no-import-prefix
import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts'

const { PLATYPLUS_ADMIN_USERNAME, PLATYPLUS_ADMIN_PASSWORD, STRAPI_URI, PLATYPLUS_STRAPI_TOKEN } = Deno.env.toObject()

assert(PLATYPLUS_ADMIN_USERNAME)
assert(PLATYPLUS_ADMIN_PASSWORD)
assert(STRAPI_URI)
assert(PLATYPLUS_STRAPI_TOKEN)

let cookies = ''
let csrf = ''

function cookiejar(response: Response) {
  cookies = response.headers
    .getSetCookie()
    .map((cookie: string) => cookie.split(';')[0])
    .join('; ')
  csrf = /fluufff_registration_csrf_fluufff_registration_=(\w+)/.exec(cookies)![1]
}

// grab the csrf token from the login page
cookiejar(await fetch('https://registration.fluufff.org/profile/login'))

// authenticate session cookie with credentials
await fetch('https://registration.fluufff.org/profile/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Cookie: cookies
  },
  body: new URLSearchParams({
    csrf_fluufff_registration_: csrf,
    email: PLATYPLUS_ADMIN_USERNAME,
    password: PLATYPLUS_ADMIN_PASSWORD,
    keep: 'N',
    send: ''
  })
})

// retrieve the bookings page
const response = await fetch('https://registration.fluufff.org/admin/bookings', {
  method: 'GET',
  headers: {
    Cookie: cookies
  }
})

const document = new DOMParser().parseFromString(await response.text(), 'text/html')
const table: HTMLTableElement = document.querySelector('table')!
const rows: HTMLCollection = table!.children[1].children

let type = '' // "goodie"|"room"|"ticket"

function get_min_max(string: string) {
  // "100/200" -> {min: 100, max: 200}
  const cur_max = string.split('/')
  return {
    min: parseInt(cur_max[0]),
    max: parseInt(cur_max[1])
  }
}

const output = Array.from(rows).map((row) => {
  const name = row.children[0].textContent.trim()

  // detect headers throughout the table
  if (row.children.length == 1) {
    type = name.toLowerCase()
    return
  }

  const places = parseInt(row.children[1].textContent)
  const usage_column = type == 'room' ? 4 : 2 // use the "open" column for rooms, "total" for the others
  const min_max = get_min_max(row.children[usage_column].textContent)
  const available = (min_max.max - min_max.min) / places

  return { type, name, available }
})

const filtered = output.filter((row) => {
  if (!row) return false

  if (row.name.includes('Staff')) return false
  if (row.name.includes('T-Shirt')) return false
  if (row.name.includes('DISCOUNTED')) return false
  if (row.name.endsWith('Early Arrival')) return false
  if (row.name.endsWith('Late Departure')) return false

  if (row.type == 'ticket') return false

  return true
})

// console.log(output)
console.log(filtered)

const reg_bookings = await fetch(`${STRAPI_URI}reg-bookings`, {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${PLATYPLUS_STRAPI_TOKEN}`,
    'Content-Type': 'application/json'
  }
})

;(await reg_bookings.json()).data.forEach(async (reg_booking: { documentId: string }) => {
  await fetch(`${STRAPI_URI}reg-bookings/${reg_booking.documentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${PLATYPLUS_STRAPI_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })
})

for (const reg_booking of filtered) {
  const response5 = await fetch(`${STRAPI_URI}reg-bookings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PLATYPLUS_STRAPI_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: reg_booking
    })
  })
  console.log(await response5.text())
}
