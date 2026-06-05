import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(__dirname, '..', 'dist')
const indexHtml = path.join(dist, 'index.html')
const notFound = path.join(dist, '404.html')

if (!fs.existsSync(indexHtml)) {
  console.error('dist/index.html introuvable. Lancez vite build avant.')
  process.exit(1)
}

fs.copyFileSync(indexHtml, notFound)
console.log('Copié dist/index.html -> dist/404.html (routing SPA GitHub Pages)')
