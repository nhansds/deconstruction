/**
 * Couleurs distinctes et lisibles sur graphiques (clair / sombre).
 * Réparties sur le cercle chromatique pour une palette cohérente.
 */
export const HOMME_COLOR_PALETTE = [
  '#e11d48', // rose
  '#ea580c', // orange
  '#ca8a04', // ambre
  '#65a30d', // vert lime
  '#059669', // émeraude
  '#0d9488', // teal
  '#0891b2', // cyan
  '#2563eb', // bleu
  '#4f46e5', // indigo
  '#7c3aed', // violet
  '#a21caf', // fuchsia
  '#db2777', // pink
] as const

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

/** #rgb ou #rrggbb → #rrggbb minuscules ; sinon null */
export function normalizeHexColor(input: string): string | null {
  const s = input.trim().toLowerCase()
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(s)
  if (!m) return null
  const hex = m[1]
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
  }
  return `#${hex}`
}

function hexFromHsl(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360
  const ss = clamp01(s)
  const ll = clamp01(l)
  const c = (1 - Math.abs(2 * ll - 1)) * ss
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = ll - c / 2
  let rp = 0
  let gp = 0
  let bp = 0
  if (hh < 60) {
    rp = c
    gp = x
  } else if (hh < 120) {
    rp = x
    gp = c
  } else if (hh < 180) {
    gp = c
    bp = x
  } else if (hh < 240) {
    gp = x
    bp = c
  } else if (hh < 300) {
    rp = x
    bp = c
  } else {
    rp = c
    bp = x
  }
  const toByte = (v: number) => Math.round((v + m) * 255)
  const r = toByte(rp)
  const g = toByte(gp)
  const b = toByte(bp)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function collectUsedColors(
  hommes: { couleur?: string }[],
  extra: string | string[] | undefined,
): Set<string> {
  const used = new Set<string>()
  for (const h of hommes) {
    const n = h.couleur ? normalizeHexColor(h.couleur) : null
    if (n) used.add(n)
  }
  if (extra !== undefined) {
    const list = Array.isArray(extra) ? extra : [extra]
    for (const c of list) {
      const n = normalizeHexColor(c)
      if (n) used.add(n)
    }
  }
  return used
}

/**
 * Prochaine couleur de la palette non encore utilisée ; sinon teinte dérivée (angle d’or).
 * `extraUsed` sert après un `addDoc` avant que le snapshot Firestore n’ait rafraîchi la liste.
 */
export function suggestNextHommeColor(
  hommes: { couleur?: string }[],
  extraUsed?: string | string[],
): string {
  const used = collectUsedColors(hommes, extraUsed)
  for (const c of HOMME_COLOR_PALETTE) {
    if (!used.has(c)) return c
  }
  const n = hommes.length + (extraUsed === undefined ? 0 : Array.isArray(extraUsed) ? extraUsed.length : 1)
  const hue = (n * 137.508) % 360
  return hexFromHsl(hue, 0.72, 0.52)
}
