import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Cell } from 'recharts'
import type { Evenement, Homme } from '../types'
import { classement, histogrammeTotaux, seriesCumulatives } from '../lib/scores'

type Props = {
  hommes: Homme[]
  evenements: Evenement[]
}

export function ScoreCharts({ hommes, evenements }: Props) {
  const lineData = seriesCumulatives(hommes, evenements)
  const barData = histogrammeTotaux(hommes, evenements)
  const ranks = classement(hommes, evenements)

  if (hommes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500 light:border-slate-300 pink:border-pink-200/80 pink:bg-white/90 dark:border-slate-700 dark:bg-slate-900">
        Aucun homme enregistré pour l’instant.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Évolution des points (lignes)</h2>
        {lineData.length === 0 ? (
          <p className="text-slate-500 pink:text-pink-900/70">Pas encore d’événements.</p>
        ) : (
          <div className="h-80 w-full rounded-xl border border-slate-200 bg-white p-2 light:border-slate-200 pink:border-pink-200/80 pink:bg-white/95 dark:border-slate-800 dark:bg-slate-900">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {hommes.map((h) => (
                  <Line
                    key={h.id}
                    type="monotone"
                    dataKey={h.id}
                    name={`${h.prenom} ${h.nom}`}
                    stroke={h.couleur || '#6366f1'}
                    dot={false}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Total par personne (histogramme)</h2>
        <div className="h-72 w-full rounded-xl border border-slate-200 bg-white p-2 light:border-slate-200 pink:border-pink-200/80 pink:bg-white/95 dark:border-slate-800 dark:bg-slate-900">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 16, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="nom" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" name="Points" radius={[0, 6, 6, 0]}>
                {barData.map((entry) => (
                  <Cell key={entry.id} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Classement général</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white light:border-slate-200 pink:border-pink-200/80 pink:bg-white/95 dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 light:bg-slate-100 pink:bg-pink-100/60 pink:text-pink-900 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Homme</th>
                <th className="px-4 py-3 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {ranks.map((row, i) => (
                <tr
                  key={row.homme.id}
                  className="border-t border-slate-100 light:border-slate-100 pink:border-pink-100 dark:border-slate-800"
                >
                  <td className="px-4 py-3 font-medium text-slate-500">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {row.homme.photoUrl ? (
                        <img
                          src={row.homme.photoUrl}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover ring-2 ring-white light:ring-white pink:ring-pink-100 dark:ring-slate-900"
                          style={{ outline: `2px solid ${row.homme.couleur}` }}
                        />
                      ) : (
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: row.homme.couleur || '#6366f1' }}
                        >
                          {(row.homme.prenom[0] ?? '?').toUpperCase()}
                          {(row.homme.nom[0] ?? '?').toUpperCase()}
                        </span>
                      )}
                      <span>
                        {row.homme.prenom} {row.homme.nom}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
