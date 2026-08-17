#!/usr/bin/env node
/**
 * Check that every icon this app references actually exists in the design system.
 *
 * OcIcon resolves `fillType: 'none'` to `<name>.svg` and anything else to
 * `<name>-<fillType>.svg`, defaulting to `fill`. A name that exists only bare — which is true of
 * most formatting glyphs, `bold`, `italic`, `h-1`, `table-2` and friends — renders **nothing** when
 * asked for with `fill-type="line"`, with no console error and no build failure. This catches that.
 *
 * Usage: node dev/verify-icons.mjs [path/to/design-system/src/assets/icons]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const iconDir =
  process.argv[2] || join(here, '../../../web/packages/design-system/src/assets/icons')

let available
try {
  available = new Set(
    readdirSync(iconDir)
      .filter((f) => f.endsWith('.svg'))
      .map((f) => f.slice(0, -4))
  )
} catch {
  console.error(`Icon directory not found: ${iconDir}`)
  console.error('Pass the path explicitly if the web checkout is elsewhere.')
  process.exit(2)
}

const sources = []
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walk(full)
    } else if (/\.(ts|vue)$/.test(entry)) {
      sources.push(full)
    }
  }
}
walk(join(here, '../src'))

const problems = []
const seen = new Set()

const record = (file, name, fillType) => {
  const resolved = fillType === 'none' ? name : `${name}-${fillType}`
  const key = `${name}|${fillType}`
  if (seen.has(key)) {
    return
  }
  seen.add(key)
  if (!available.has(resolved)) {
    const alt = available.has(name)
      ? "exists bare, so use fillType 'none'"
      : available.has(`${name}-line`)
        ? "exists as -line, so use fillType 'line'"
        : 'no such icon under any fill type'
    problems.push(`${file}: ${resolved}.svg missing (${alt})`)
  }
}

for (const file of sources) {
  const text = readFileSync(file, 'utf8')
  const short = file.slice(file.indexOf('/src/') + 1)

  // Toolbar item objects: { icon: 'x', fillType: 'line' }. EditorToolbar renders these with
  // `entry.fillType || 'none'`, so an omitted fillType means the bare name.
  //
  // index.ts is different: its icons are appInfo/menu-item icons handed to the runtime, which
  // renders them through SidebarNavItem with a 'fill' default.
  const objectDefault = file.endsWith('index.ts') ? 'fill' : 'none'
  for (const m of text.matchAll(/icon: '([a-z0-9-]+)'(?:,\s*\n\s*fillType: '([a-z]+)')?/g)) {
    record(short, m[1], m[2] || objectDefault)
  }

  // Template usage: <oc-icon name="x" fill-type="line" />
  for (const m of text.matchAll(/<oc-icon\b[^>]*>/g)) {
    const tag = m[0]
    const name = tag.match(/[^:]name="([a-z0-9-]+)"/)
    if (!name) {
      continue // dynamic :name, checked through the toolbar item objects above
    }
    const fill = tag.match(/fill-type="([a-z]+)"/)
    record(short, name[1], fill ? fill[1] : 'fill')
  }
}

if (problems.length) {
  console.error(`${problems.length} unresolvable icon reference(s):\n`)
  problems.forEach((p) => console.error(`  ${p}`))
  process.exit(1)
}

console.log(`All ${seen.size} icon references resolve against ${iconDir}`)
