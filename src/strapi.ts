import { loadEnv } from 'vite'
import qs from 'qs'
import process from 'node:process'

export interface Strapi {
  // deno-lint-ignore no-explicit-any
  fetchItems(itemName: string, options?: object): Promise<any[]> // eslint-disable-line @typescript-eslint/no-explicit-any
}

// strapi v5 uses string ids, numeric is deprecated
function use_documentid_as_id(object: { id?: string; documentId?: string }) {
  if (Array.isArray(object)) {
    object.forEach(use_documentid_as_id)
  } else if (object !== null && typeof object == 'object') {
    for (const [key, value] of Object.entries(object)) {
      if (key == 'documentId') {
        object.id = object.documentId
        delete object.documentId
      } else {
        use_documentid_as_id(value as { id?: string; documentId?: string }) // i lied
      }
    }
  }
}

export function loadStrapi(): Strapi {
  const env = process.env.NODE_ENV || 'development'
  const isDevelopment = env === 'development' || process.env.MODE === 'typecheck'
  const useImmutableCachingMode = process.argv.includes('-i') || process.argv.includes('--immutable')

  const { STRAPI_URI, STRAPI_TOKEN } = loadEnv(env, process.cwd(), '')

  if (!STRAPI_URI || !STRAPI_TOKEN) {
    if (isDevelopment) {
      console.info(
        'Cannot connect to CMS due to missing STRAPI_URI or STRAPI_TOKEN environment variables. Using empty data for CMS instead. Some pages may look a bit empty.'
      )

      return dummyStrapi()
    }

    if (!isDevelopment) throw new Error('Missing STRAPI_URI or STRAPI_TOKEN environment variables')
  }

  const fetched_strapi_items = new Set()

  return {
    fetchItems: async (itemName: string, options?: object) => {
      try {
        Deno.mkdirSync('.strapi', { recursive: true })
        const cache_pathname = `.strapi/${itemName}.json`

        if (useImmutableCachingMode) {
          try {
            return JSON.parse(Deno.readTextFileSync(cache_pathname))
          } catch (err) {
            if (!(err instanceof Deno.errors.NotFound)) {
              throw err
            }
          }
        }

        const data = await fetchFromStrapi(STRAPI_URI!, STRAPI_TOKEN!, itemName, options)
        use_documentid_as_id(data)

        if (fetched_strapi_items.has(itemName)) {
          throw `${itemName} was already fetched before! (possibily with different options, but just the name goes in the cache file currently)`
        } else {
          fetched_strapi_items.add(itemName)
        }

        Deno.writeTextFileSync(cache_pathname, JSON.stringify(data, null, 2) + '\n')
        return data
      } catch (e) {
        if (process.env.CI) {
          throw [itemName, e]
        }
        const msg = e instanceof Error ? e.message : e
        console.warn(`Error while trying to fetch ${itemName}:`, msg)
        return []
      }
    }
  }
}

function dummyStrapi(): Strapi {
  return {
    fetchItems: () => Promise.resolve([])
  }
}

async function fetchFromStrapi(uri: string, token: string, item: string, options?: object) {
  const url = new URL(item, uri)
  if (options) url.search = qs.stringify(options)
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error(`Fetch failed (${response.statusText}): ${await response.text()}`)
  return (await response.json()).data
}
