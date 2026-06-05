import { ScoreCharts } from '../components/ScoreCharts'
import { useLiveData } from '../hooks/useLiveData'

export function PublicDashboard() {
  const { hommes, evenements, loading, missingConfig, error } = useLiveData()

  if (missingConfig) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <h1 className="text-xl font-semibold">deconstruction — configuration requise</h1>
        <p className="mt-2 text-sm leading-relaxed">
          Créez un fichier <code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-900/80">.env</code> à la racine du projet avec les clés Firebase (voir{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-900/80">.env.example</code> et le README). Rebuild ensuite pour GitHub Pages.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        <p className="font-medium">{error}</p>
        <p className="mt-2 text-sm">
          Vérifiez les règles Firestore (lecture publique) et la console Firebase.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight">deconstruction</h1>
      <p className="mb-8 text-slate-600 dark:text-slate-400">
        Tableau public des points — données en direct, sans connexion administrateur.
      </p>
      <ScoreCharts hommes={hommes} evenements={evenements} />
    </div>
  )
}
