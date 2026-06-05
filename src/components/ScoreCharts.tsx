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
import { useIsNarrowScreen } from '../hooks/useIsNarrowScreen'
import { classement, histogrammeTotaux, seriesCumulatives } from '../lib/scores'

type Props = {
  hommes: Homme[]
  evenements: Evenement[]
}

export function ScoreCharts({ hommes, evenements }: Props) {
  const narrow = useIsNarrowScreen()
  const lineData = seriesCumulatives(hommes, evenements)
  const barData = histogrammeTotaux(hommes, evenements)
  const ranks = classement(hommes, evenements)

  const lineMargin = narrow
    ? { top: 4, right: 4, left: 0, bottom: 4 }
    : { top: 8, right: 8, left: 0, bottom: 0 }
  const barMargin = narrow
    ? { left: 4, right: 8, top: 4, bottom: 4 }
    : { left: 16, right: 16, top: 8, bottom: 8 }
  const yAxisWidth = narrow ? 76 : 120

  if (hommes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500 sm:p-6 sm:text-base light:border-slate-300 pink:border-pink-200/80 pink:bg-white/90 dark:border-slate-700 dark:bg-slate-900">
        Aucun homme enregistré pour l’instant.
      </p>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-8 sm:gap-10">
      <section className="min-w-0">
        <h2 className="mb-2 text-base font-semibold sm:mb-3 sm:text-lg">
          Évolution des points (lignes)
        </h2>
        {lineData.length === 0 ? (
          <p className="text-sm text-slate-500 sm:text-base pink:text-pink-900/70">
            Pas encore d’événements.
          </p>
        ) : (
          <div className="h-64 w-full min-w-0 rounded-xl border border-slate-200 bg-white p-1 sm:h-80 sm:p-2 light:border-slate-200 pink:border-pink-200/80 pink:bg-white/95 dark:border-slate-800 dark:bg-slate-900">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={lineMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: narrow ? 8 : 11 }}
                  interval={narrow ? 'preserveStartEnd' : 'preserveStartEnd'}
                  angle={narrow ? -40 : 0}
                  textAnchor={narrow ? 'end' : 'middle'}
                  height={narrow ? 52 : 30}
                />
                <YAxis tick={{ fontSize: narrow ? 9 : 11 }} width={narrow ? 28 : 36} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: narrow ? 10 : 12 }} />
                {hommes.map((h) => (
                  <Line
                    key={h.id}
                    type="monotone"
                    dataKey={h.id}
                    name={`${h.prenom} ${h.nom}`}
                    stroke={h.couleur || '#6366f1'}
                    dot={false}
                    strokeWidth={narrow ? 1.5 : 2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="min-w-0">
        <h2 className="mb-2 text-base font-semibold sm:mb-3 sm:text-lg">
          Total par personne (histogramme)
        </h2>
        <div className="h-56 w-full min-w-0 rounded-xl border border-slate-200 bg-white p-1 sm:h-72 sm:p-2 light:border-slate-200 pink:border-pink-200/80 pink:bg-white/95 dark:border-slate-800 dark:bg-slate-900">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={barMargin}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: narrow ? 9 : 11 }} />
              <YAxis
                type="category"
                dataKey="nom"
                width={yAxisWidth}
                tick={{ fontSize: narrow ? 9 : 11 }}
                tickFormatter={(v) =>
                  typeof v === 'string' && v.length > 14 ? `${v.slice(0, 12)}…` : String(v)
                }
              />
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

      <section className="min-w-0">
        <h2 className="mb-2 text-base font-semibold sm:mb-3 sm:text-lg">Classement général</h2>
        <p className="mb-2 text-xs text-slate-500 sm:hidden dark:text-slate-400">
          Faites défiler horizontalement pour voir toutes les colonnes.
        </p>
        <div className="-mx-1 min-w-0 overflow-x-auto rounded-xl border border-slate-200 bg-white light:border-slate-200 pink:border-pink-200/80 pink:bg-white/95 dark:border-slate-800 dark:bg-slate-900 sm:mx-0">
          <table className="w-full min-w-[280px] text-left text-xs sm:min-w-0 sm:text-sm">
            <thead className="bg-slate-100 text-slate-600 light:bg-slate-100 pink:bg-pink-100/60 pink:text-pink-900 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-2 py-2.5 font-medium sm:px-4 sm:py-3">#</th>
                <th className="px-2 py-2.5 font-medium sm:px-4 sm:py-3">Homme</th>
                <th className="px-2 py-2.5 text-right font-medium sm:px-4 sm:py-3">Points</th>
              </tr>
            </thead>
            <tbody>
              {ranks.map((row, i) => (
                <tr
                  key={row.homme.id}
                  className="border-t border-slate-100 light:border-slate-100 pink:border-pink-100 dark:border-slate-800"
                >
                  <td className="px-2 py-2.5 font-medium text-slate-500 sm:px-4 sm:py-3">{i + 1}</td>
                  <td className="max-w-[55vw] px-2 py-2.5 sm:max-w-none sm:px-4 sm:py-3">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                      {row.homme.photoUrl ? (
                        <img
                          src={row.homme.photoUrl}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white light:ring-white pink:ring-pink-100 sm:h-9 sm:w-9 dark:ring-slate-900"
                          style={{ outline: `2px solid ${row.homme.couleur}` }}
                        />
                      ) : (
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white sm:h-9 sm:w-9 sm:text-xs"
                          style={{ background: row.homme.couleur || '#6366f1' }}
                        >
                          {(row.homme.prenom[0] ?? '?').toUpperCase()}
                          {(row.homme.nom[0] ?? '?').toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0 truncate sm:break-normal">
                        {row.homme.prenom} {row.homme.nom}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums sm:px-4 sm:py-3">
                    {row.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
