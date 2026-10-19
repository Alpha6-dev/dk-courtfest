// Post-build step: give every route listed in public/sitemap.xml its own static HTML file.
//
// GitHub Pages only serves files that exist, so a deep link such as /evenements used to fall
// back to 404.html (the app rendered, but with an HTTP 404 that blocks indexing). For each
// sitemap URL this script writes dist/<route>.html: a copy of dist/index.html whose canonical
// and og:url point at the route itself. GitHub Pages serves <route>.html at /<route> with a
// 200 and no redirect. The app shell is identical, so the client-side router still decides
// what to render; 404.html keeps handling paths that are not in the sitemap.
//
// Runs automatically after `vite build` through the "postbuild" npm script.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const origin = 'https://courtfest.com'

const indexPath = join(dist, 'index.html')
if (!existsSync(indexPath)) {
  console.error('[prerender-routes] dist/index.html not found: run vite build first.')
  process.exit(1)
}
const index = readFileSync(indexPath, 'utf8')

const sitemap = readFileSync(join(root, 'public', 'sitemap.xml'), 'utf8')
const routes = [...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
  .map((m) => m[1].trim())
  .filter((url) => url.startsWith(origin + '/'))
  .map((url) => url.slice(origin.length).replace(/\/+$/, ''))
  .filter((path) => path !== '')

if (routes.length === 0) {
  console.warn('[prerender-routes] no routes found in public/sitemap.xml, nothing to do.')
  process.exit(0)
}

for (const route of routes) {
  const url = origin + route
  const html = index
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`)
  const target = join(dist, route.slice(1) + '.html')
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, html)
  console.log(`[prerender-routes] ${route} -> ${target.slice(root.length + 1)}`)
}
