# Flüüfff website 2026

## Quick start

- [Visit this site](https://fluufff.org)
- [Building this site](./docs/dev.md)

## Branches

- `main`: the primary branch, best to leave untouched when you are new.
- `next`: the development branch, pull requests should target this one.

## Fonts

Some fonts are not referenced by their string name but via var instead:

```diff
- font-family: "Inter", sans-serif;
+ font-family: var(--font-inter), sans-serif;
```

### Strapi

Some of the content comes from the CMS, the IT department can be contacted for a read-only API key.

Avoid adding those secrets to .env, instead you will want to create an .env.local file alongside it.

In order to make some local changes to what strapi returns you can use the "deno run dev --immutable" flag in order to not pull changes,
it is named after a very stubborn long lived HTTP cache header, it will serve content from .strapi that was automatically cached before.

### Scoped css

Note that when css is scoped those classes cannot be used as inner/outer class on `Section` elements.

### Stack traces

The line numbers mentioned on that page might not point to the actual line of code,
if you are unable to find it there then search around based on the error message itself.

### Scss

Some of the scss files have a names that are not as obvious:

- `charter.scss`: typically refered to as the variables file
- `tailwind-extras.scss`: generates global css color classes

### Icons

Cheat sheet for adding icons matching the design:

- check in `package.json` which icon sets are loaded
- go to https://icon-sets.iconify.design/
- use the "filter icon sets" search bar (not the main one) to filter on one of those
- rinse and repeat, if none of the existing sets have what you need then find a new set
- import them like `import LucideMenu from '~icons/lucide/menu'` for use as html elements
