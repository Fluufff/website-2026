// deno run --allow-env --env-file=.env.local --allow-net --allow-read --allow-write utils/figma-deprecated-style-finder.ts

// An automated attempt at helping to pinpoint all the locations on a figma canvas where certain styles are still being used.

// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any */

const { FIGMA_TOKEN } = Deno.env.toObject()
const FIGMA_FILE_ID = 'Dl4I0OJqlpDyBwtHWv8D43'

// const cache_pathname = `tmp/figma.json`

// async function fetch_json() {
const response = await fetch(`https://api.figma.com/v1/files/${FIGMA_FILE_ID}`, {
  method: 'GET',
  headers: {
    'X-Figma-Token': FIGMA_TOKEN,
    'Content-Type': 'application/json'
  }
})
const json = await response.json()
//   Deno.writeTextFileSync(cache_pathname, JSON.stringify(json, null, 2))
// }

// try {
//   const stats = await Deno.lstat(cache_pathname);
// } catch (err) {
//   if (!(err instanceof Deno.errors.NotFound)) {
//     throw err;
//   }
//   await fetch_json()
// }

// const json = JSON.parse(Deno.readTextFileSync(cache_pathname))

const style_names = new Map() // { "66:9230": "Flüüfff 25/Neutrals/100" }
const style_codes = new Set() // [ "66:9230" ]

for (const [style_id, style] of Object.entries(json['styles']) as [string, any]) {
  if (style['styleType'] != 'FILL') continue
  if (!style['name'].startsWith('Fl')) continue // Fl uufff/üüfff
  if (!style['name'].includes('fff 25/')) continue

  style_codes.add(style_id)
  style_names.set(style_id, style['name'])
}

function check_children(path: string, node: any) {
  if (node.children) {
    node.children.forEach((child: any) => check_children(`${path}[${child.name}]`, child))
  }

  if (['~spacer'].includes(node.name)) return

  for (const [key, value] of Object.entries(node.styles ?? {})) {
    if (style_codes.has(value)) {
      let line = `${style_names.get(value).padEnd(24, ' ')} ${key.padEnd(7, ' ')} ${path}`

      if (node.characters) {
        line += `"${node.characters.replaceAll('\n', '\\n')}"`
      }

      console.log(line)
    }
  }
}

const canvas = json['document']['children'].filter((child: any) => child.name == 'Designs - Fluufff 26')[0]
check_children('', canvas)
// const frames = canvas.children.filter((child: any) => child.children);
// Deno.writeTextFileSync('tmp/figma-frames.json', JSON.stringify(frames, null, 2))
