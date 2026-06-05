import type { Evenement, Homme } from '../types'

export type RankRow = {
  homme: Homme
  total: number
}

export function totalParHomme(
  hommes: Homme[],
  evenements: Evenement[],
): Map<string, number> {
  const map = new Map<string, number>()
  for (const h of hommes) map.set(h.id, 0)
  for (const e of evenements) {
    map.set(e.hommeId, (map.get(e.hommeId) ?? 0) + e.points)
  }
  return map
}

export function classement(hommes: Homme[], evenements: Evenement[]): RankRow[] {
  const totals = totalParHomme(hommes, evenements)
  return hommes
    .map((homme) => ({ homme, total: totals.get(homme.id) ?? 0 }))
    .sort((a, b) => b.total - a.total)
}

/** Points cumulés dans le temps (un point par événement, tous hommes sur même axe temps) */
export function seriesCumulatives(
  hommes: Homme[],
  evenements: Evenement[],
): { t: number; label: string; [key: string]: number | string }[] {
  const sorted = [...evenements].sort((a, b) => a.createdAt - b.createdAt)
  const cum = new Map<string, number>()
  for (const h of hommes) cum.set(h.id, 0)

  const rows: { t: number; label: string; [key: string]: number | string }[] = []

  for (const e of sorted) {
    const id = e.hommeId
    cum.set(id, (cum.get(id) ?? 0) + e.points)
    const row: { t: number; label: string; [key: string]: number | string } = {
      t: e.createdAt,
      label: new Date(e.createdAt).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    }
    for (const h of hommes) {
      row[h.id] = cum.get(h.id) ?? 0
    }
    rows.push(row)
  }

  return rows
}

export function histogrammeTotaux(
  hommes: Homme[],
  evenements: Evenement[],
): { id: string; nom: string; total: number; fill: string }[] {
  const totals = totalParHomme(hommes, evenements)
  return hommes.map((h) => ({
    id: h.id,
    nom: `${h.prenom} ${h.nom}`,
    total: totals.get(h.id) ?? 0,
    fill: h.couleur || '#6366f1',
  }))
}
