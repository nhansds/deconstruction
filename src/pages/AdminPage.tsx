import { useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore'
import { getFirebase } from '../firebase'
import { useAdminsList } from '../hooks/useAdminsList'
import { useAuth } from '../hooks/useAuth'
import { useLiveData } from '../hooks/useLiveData'
import { useSiteConfig } from '../hooks/useSiteConfig'
import { ScoreCharts } from '../components/ScoreCharts'
import { deleteAllDocumentsInCollection } from '../lib/deleteAllInCollection'
import { suggestNextHommeColor } from '../lib/hommeColorPalette'
import type { ActionDef, Homme } from '../types'

type Tab = 'hommes' | 'actions' | 'events' | 'charts' | 'admins'

const tabs: { id: Tab; label: string }[] = [
  { id: 'hommes', label: 'Hommes' },
  { id: 'actions', label: 'Actions' },
  { id: 'events', label: 'Événements' },
  { id: 'charts', label: 'Visualisations' },
  { id: 'admins', label: 'Administrateurs' },
]

/** Bouton « Supprimer » sur une ligne de liste (homme, action, événement). */
const rowDeleteButtonClass =
  'touch-manipulation min-h-10 w-full shrink-0 rounded-md border border-red-200 bg-white px-2.5 py-2 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 disabled:pointer-events-none disabled:opacity-40 dark:border-red-800 dark:bg-slate-950 dark:text-red-300 dark:hover:bg-red-950/50 sm:w-auto sm:min-h-0 sm:py-1.5'

function parseCoefficientInput(raw: string): number | null {
  const t = raw.trim().replace(',', '.')
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

function readFileAsDataUrl(file: File, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error(`Fichier trop volumineux (max ${Math.round(maxBytes / 1024)} Ko).`))
      return
    }
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error('Lecture du fichier impossible.'))
    r.readAsDataURL(file)
  })
}

export function AdminPage() {
  const auth = useAuth()
  const adminsList = useAdminsList(!!auth.user)
  const live = useLiveData()
  const site = useSiteConfig()
  const [tab, setTab] = useState<Tab>('hommes')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState<string | null>(null)

  const fb = useMemo(() => getFirebase(), [])

  /* ——— Homme ——— */
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  /** null = suivre la suggestion auto selon les hommes déjà en base */
  const [couleurOverride, setCouleurOverride] = useState<string | null>(null)
  const autoHommeCouleur = useMemo(
    () => suggestNextHommeColor(live.hommes),
    [live.hommes],
  )
  const effectiveHommeCouleur = couleurOverride ?? autoHommeCouleur

  /** Édition d’un homme existant (formulaire inline dans la liste). */
  const [editingHommeId, setEditingHommeId] = useState<string | null>(null)
  const [editHommePrenom, setEditHommePrenom] = useState('')
  const [editHommeNom, setEditHommeNom] = useState('')
  const [editHommePhotoUrl, setEditHommePhotoUrl] = useState('')
  const [editHommeCouleur, setEditHommeCouleur] = useState('#6366f1')

  /* ——— Action ——— */
  const [libelle, setLibelle] = useState('')
  const [coefficient, setCoefficient] = useState('1')
  /** Brouillons du coefficient par id d’action (clé absente = valeur Firestore affichée). */
  const [actionCoeffDraftById, setActionCoeffDraftById] = useState<Record<string, string>>({})

  /* ——— Événement ——— */
  const [selHomme, setSelHomme] = useState('')
  const [selAction, setSelAction] = useState('')

  async function handleLogin(mode: 'in' | 'up') {
    setLoginErr(null)
    if (mode === 'up' && !site.allowSignUp) {
      setLoginErr('Les inscriptions sont fermées.')
      return
    }
    try {
      if (mode === 'in') await auth.signIn(email, password)
      else await auth.signUp(email, password)
    } catch (e: unknown) {
      setLoginErr(e instanceof Error ? e.message : 'Erreur de connexion')
    }
  }

  async function setAllowSignUp(next: boolean) {
    if (!fb || !auth.user) return
    setFormError(null)
    setBusy(true)
    try {
      await setDoc(
        doc(fb.db, 'config', 'site'),
        { allowSignUp: next, updatedAt: Date.now() },
        { merge: true },
      )
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Impossible d’enregistrer les paramètres.')
    } finally {
      setBusy(false)
    }
  }

  async function addHomme(e: React.FormEvent) {
    e.preventDefault()
    if (!fb || !auth.user) return
    setFormError(null)
    setBusy(true)
    try {
      await addDoc(collection(fb.db, 'hommes'), {
        prenom: prenom.trim(),
        nom: nom.trim(),
        photoUrl: photoUrl.trim(),
        couleur: effectiveHommeCouleur,
        createdAt: Date.now(),
      })
      setPrenom('')
      setNom('')
      setPhotoUrl('')
      setCouleurOverride(suggestNextHommeColor(live.hommes, effectiveHommeCouleur))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  async function addHommePhoto(file: File | null) {
    if (!file) return
    setFormError(null)
    try {
      const url = await readFileAsDataUrl(file, 350 * 1024)
      setPhotoUrl(url)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur fichier')
    }
  }

  function startEditHomme(h: Homme) {
    setFormError(null)
    setEditingHommeId(h.id)
    setEditHommePrenom(h.prenom)
    setEditHommeNom(h.nom)
    setEditHommePhotoUrl(h.photoUrl?.trim() ?? '')
    setEditHommeCouleur(h.couleur || '#6366f1')
  }

  function cancelEditHomme() {
    setEditingHommeId(null)
  }

  async function editHommePhotoFromFile(file: File | null) {
    if (!file) return
    setFormError(null)
    try {
      const url = await readFileAsDataUrl(file, 350 * 1024)
      setEditHommePhotoUrl(url)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur fichier')
    }
  }

  async function saveHommeEdits(hId: string) {
    if (!fb || !auth.user) return
    const current = live.hommes.find((x) => x.id === hId)
    if (!current) return
    const prenom = editHommePrenom.trim()
    const nom = editHommeNom.trim()
    if (!prenom || !nom) {
      setFormError('Prénom et nom sont obligatoires.')
      return
    }
    const photoUrl = editHommePhotoUrl.trim()
    const couleur = editHommeCouleur
    if (
      prenom === current.prenom &&
      nom === current.nom &&
      photoUrl === (current.photoUrl ?? '').trim() &&
      couleur.toLowerCase() === (current.couleur ?? '').toLowerCase()
    ) {
      return
    }
    setFormError(null)
    setBusy(true)
    try {
      await updateDoc(doc(fb.db, 'hommes', hId), {
        prenom,
        nom,
        photoUrl,
        couleur,
      })
      setEditingHommeId(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Impossible d’enregistrer les modifications.')
    } finally {
      setBusy(false)
    }
  }

  async function removeHomme(h: Homme) {
    if (!fb || !auth.user) return
    if (!confirm(`Supprimer ${h.prenom} ${h.nom} ?`)) return
    if (editingHommeId === h.id) setEditingHommeId(null)
    setBusy(true)
    try {
      await deleteDoc(doc(fb.db, 'hommes', h.id))
    } finally {
      setBusy(false)
    }
  }

  async function addAction(e: React.FormEvent) {
    e.preventDefault()
    if (!fb || !auth.user) return
    setFormError(null)
    const coef = parseCoefficientInput(coefficient)
    if (coef === null) {
      setFormError('Coefficient invalide')
      return
    }
    setBusy(true)
    try {
      await addDoc(collection(fb.db, 'actions'), {
        libelle: libelle.trim(),
        coefficient: coef,
        createdAt: Date.now(),
      })
      setLibelle('')
      setCoefficient('1')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  async function removeAction(a: ActionDef) {
    if (!fb || !auth.user) return
    if (!confirm(`Supprimer l’action « ${a.libelle} » ?`)) return
    setBusy(true)
    try {
      await deleteDoc(doc(fb.db, 'actions', a.id))
      setActionCoeffDraftById((prev) => {
        const next = { ...prev }
        delete next[a.id]
        return next
      })
    } finally {
      setBusy(false)
    }
  }

  async function updateActionCoefficient(a: ActionDef) {
    if (!fb || !auth.user) return
    const raw = actionCoeffDraftById[a.id] ?? String(a.coefficient)
    const next = parseCoefficientInput(raw)
    if (next === null) {
      setFormError('Coefficient invalide')
      return
    }
    if (next === a.coefficient) return
    setFormError(null)
    setBusy(true)
    try {
      await updateDoc(doc(fb.db, 'actions', a.id), { coefficient: next })
      setActionCoeffDraftById((prev) => {
        const next = { ...prev }
        delete next[a.id]
        return next
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Impossible de mettre à jour le coefficient.')
    } finally {
      setBusy(false)
    }
  }

  async function addEvenement(e: React.FormEvent) {
    e.preventDefault()
    if (!fb || !auth.user) return
    const homme = live.hommes.find((h) => h.id === selHomme)
    const action = live.actions.find((a) => a.id === selAction)
    if (!homme || !action) {
      setFormError('Choisissez un homme et une action.')
      return
    }
    setFormError(null)
    setBusy(true)
    try {
      await addDoc(collection(fb.db, 'evenements'), {
        hommeId: homme.id,
        actionId: action.id,
        points: action.coefficient,
        actionLibelle: action.libelle,
        hommeLabel: `${homme.prenom} ${homme.nom}`,
        createdAt: Date.now(),
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  async function removeEvent(id: string) {
    if (!fb || !auth.user) return
    if (!confirm('Supprimer cet événement ? Les points seront recalculés.')) return
    setBusy(true)
    try {
      await deleteDoc(doc(fb.db, 'evenements', id))
    } finally {
      setBusy(false)
    }
  }

  async function deleteAllDonnees() {
    if (!fb || !auth.user) return
    const ne = live.evenements.length
    const na = live.actions.length
    const nh = live.hommes.length
    if (ne + na + nh === 0) {
      setFormError(null)
      return
    }
    if (
      !confirm(
        `Supprimer définitivement tout le contenu ?\n\n• ${ne} événement(s)\n• ${na} action(s)\n• ${nh} homme(s)\n\nCette opération est irréversible.`,
      )
    ) {
      return
    }
    setFormError(null)
    setBusy(true)
    try {
      await deleteAllDocumentsInCollection(fb.db, 'evenements')
      await deleteAllDocumentsInCollection(fb.db, 'actions')
      await deleteAllDocumentsInCollection(fb.db, 'hommes')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la suppression.')
    } finally {
      setBusy(false)
    }
  }

  if (live.missingConfig) {
    return (
      <div className="min-w-0 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 sm:p-6 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-medium">deconstruction — Firebase n’est pas configuré.</p>
        <p className="mt-2 text-sm">Voir README et .env.example</p>
      </div>
    )
  }

  if (!auth.user) {
    return (
      <div className="mx-auto w-full max-w-md px-2 sm:px-0">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          Connexion administrateur
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <label className="text-sm font-medium">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
          <label className="text-sm font-medium">
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
          {loginErr && (
            <p className="text-sm text-red-600 dark:text-red-400">{loginErr}</p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
            <button
              type="button"
              disabled={auth.loading || site.loading}
              onClick={() => handleLogin('in')}
              className={`touch-manipulation min-h-11 rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50 ${site.allowSignUp ? 'w-full sm:flex-1' : 'w-full'}`}
            >
              Se connecter
            </button>
            {site.allowSignUp && (
              <button
                type="button"
                disabled={auth.loading || site.loading}
                onClick={() => handleLogin('up')}
                className="touch-manipulation min-h-11 w-full flex-1 rounded-lg border border-slate-300 py-2.5 font-medium dark:border-slate-600"
              >
                S’inscrire
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="break-words text-sm text-slate-500">
            Administration · {auth.user.email}
          </p>
        </div>
        <button
          type="button"
          onClick={() => auth.logOut()}
          className="touch-manipulation min-h-11 w-full shrink-0 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium dark:border-slate-600 sm:w-auto"
        >
          Déconnexion
        </button>
      </div>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:mb-8 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Paramètres d’accès
        </h2>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              Autoriser les nouvelles inscriptions
            </p>
            <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">
              Désactivé : le bouton « S’inscrire » disparaît de la page de connexion. Vous pourrez toujours vous connecter avec un compte déjà créé.
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-3 select-none">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {site.allowSignUp ? 'Ouvert' : 'Fermé'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={site.allowSignUp}
              disabled={busy || site.loading}
              onClick={() => setAllowSignUp(!site.allowSignUp)}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 ${
                site.allowSignUp ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  site.allowSignUp ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </div>
        <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-700">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">
            Données
          </h3>
          <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            Supprime en une fois tous les événements, les actions et les hommes.
          </p>
          <button
            type="button"
            disabled={
              busy ||
              (live.evenements.length === 0 &&
                live.actions.length === 0 &&
                live.hommes.length === 0)
            }
            onClick={() => deleteAllDonnees()}
            className="touch-manipulation mt-3 min-h-11 w-full rounded-lg border border-red-300 bg-white px-4 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/40 sm:w-auto sm:text-center"
          >
            Supprimer toutes les données
          </button>
        </div>
      </section>

      <div className="mb-4 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mb-6 sm:flex-wrap sm:overflow-x-visible [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`touch-manipulation shrink-0 snap-start rounded-lg px-3 py-2.5 text-sm font-medium sm:px-4 sm:py-2 ${
              tab === t.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {live.error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {live.error}
        </p>
      )}
      {formError && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {formError}
        </p>
      )}

      {tab === 'hommes' && (
        <section className="grid gap-6 sm:gap-8 lg:grid-cols-2">
          <form
            onSubmit={addHomme}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6"
          >
            <h2 className="text-lg font-semibold">Nouvel homme</h2>
            <div className="mt-4 flex flex-col gap-3">
              <label className="text-sm font-medium">
                Prénom
                <input
                  required
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <label className="text-sm font-medium">
                Nom
                <input
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <label className="text-sm font-medium">
                URL de la photo (optionnel)
                <input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <label className="text-sm font-medium">
                Ou fichier image (max ~350 Ko)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => addHommePhoto(e.target.files?.[0] ?? null)}
                  className="mt-1 w-full text-sm"
                />
              </label>
              <label className="text-sm font-medium">
                Couleur
                <input
                  type="color"
                  value={effectiveHommeCouleur}
                  onChange={(e) => setCouleurOverride(e.target.value)}
                  className="mt-2 h-10 w-full cursor-pointer rounded border border-slate-300 bg-white dark:border-slate-600"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="touch-manipulation mt-2 min-h-11 w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50 sm:w-auto sm:px-6"
              >
                Enregistrer
              </button>
            </div>
          </form>
          <div>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              Modifier le nom ou la photo ne met pas à jour le libellé affiché sur les événements déjà
              enregistrés ; seuls les nouveaux événements utiliseront le nom à jour.
            </p>
            <ul className="space-y-3">
            {live.hommes.map((h) => {
              const isEditing = editingHommeId === h.id
              const previewPrenom = isEditing ? editHommePrenom : h.prenom
              const previewNom = isEditing ? editHommeNom : h.nom
              const previewPhoto = isEditing ? editHommePhotoUrl : h.photoUrl
              const previewCouleur = isEditing ? editHommeCouleur : h.couleur
              const canSaveEdit =
                isEditing &&
                editHommePrenom.trim() !== '' &&
                editHommeNom.trim() !== '' &&
                (editHommePrenom.trim() !== h.prenom ||
                  editHommeNom.trim() !== h.nom ||
                  editHommePhotoUrl.trim() !== (h.photoUrl ?? '').trim() ||
                  editHommeCouleur.toLowerCase() !== (h.couleur ?? '').toLowerCase())

              return (
              <li
                key={h.id}
                className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4"
              >
                {isEditing ? (
                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex items-center gap-3">
                      {previewPhoto ? (
                        <img src={previewPhoto} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                          style={{ background: previewCouleur }}
                        >
                          {(previewPrenom[0] ?? '?').toUpperCase()}
                          {(previewNom[0] ?? '?').toUpperCase()}
                        </span>
                      )}
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Modifier la fiche
                      </p>
                    </div>
                    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                      <label className="text-sm font-medium">
                        Prénom
                        <input
                          required
                          value={editHommePrenom}
                          onChange={(e) => setEditHommePrenom(e.target.value)}
                          className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-600 dark:bg-slate-950"
                        />
                      </label>
                      <label className="text-sm font-medium">
                        Nom
                        <input
                          required
                          value={editHommeNom}
                          onChange={(e) => setEditHommeNom(e.target.value)}
                          className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-600 dark:bg-slate-950"
                        />
                      </label>
                      <label className="min-w-0 sm:col-span-2">
                        <span className="text-sm font-medium">URL de la photo (optionnel)</span>
                        <input
                          value={editHommePhotoUrl}
                          onChange={(e) => setEditHommePhotoUrl(e.target.value)}
                          placeholder="https://..."
                          className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-600 dark:bg-slate-950"
                        />
                      </label>
                      <label className="text-sm font-medium sm:col-span-2">
                        Ou fichier image (max ~350 Ko)
                        <input
                          key={h.id}
                          type="file"
                          accept="image/*"
                          onChange={(e) => editHommePhotoFromFile(e.target.files?.[0] ?? null)}
                          className="mt-1 w-full text-sm"
                        />
                      </label>
                      <label className="text-sm font-medium sm:col-span-2">
                        Couleur
                        <input
                          type="color"
                          value={editHommeCouleur}
                          onChange={(e) => setEditHommeCouleur(e.target.value)}
                          className="mt-2 h-10 w-full max-w-xs cursor-pointer rounded border border-slate-300 bg-white dark:border-slate-600"
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy || !canSaveEdit}
                        onClick={() => saveHommeEdits(h.id)}
                        className="touch-manipulation min-h-11 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:pointer-events-none disabled:opacity-40"
                      >
                        Enregistrer les modifications
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={cancelEditHomme}
                        className="touch-manipulation min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium dark:border-slate-600 dark:bg-slate-900"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => removeHomme(h)}
                        className={rowDeleteButtonClass}
                        aria-label={`Supprimer ${h.prenom} ${h.nom}`}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      {h.photoUrl ? (
                        <img src={h.photoUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <span
                          className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ background: h.couleur }}
                        >
                          {(h.prenom[0] ?? '?').toUpperCase()}
                          {(h.nom[0] ?? '?').toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium break-words">
                          {h.prenom} {h.nom}
                        </p>
                        <p className="text-xs text-slate-500">{h.couleur}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <button
                        type="button"
                        disabled={busy || editingHommeId !== null}
                        onClick={() => startEditHomme(h)}
                        className="touch-manipulation min-h-10 w-full shrink-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto sm:min-h-0 sm:py-1.5"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => removeHomme(h)}
                        className={rowDeleteButtonClass}
                        aria-label={`Supprimer ${h.prenom} ${h.nom}`}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </li>
              )
            })}
          </ul>
          </div>
        </section>
      )}

      {tab === 'actions' && (
        <section className="grid gap-6 sm:gap-8 lg:grid-cols-2">
          <form
            onSubmit={addAction}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6"
          >
            <h2 className="text-lg font-semibold">Nouvelle action</h2>
            <p className="mt-1 text-xs text-slate-500">
              Le coefficient est ajouté aux points au moment où l’événement est créé (peut être négatif).
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <label className="text-sm font-medium">
                Libellé
                <input
                  required
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <label className="text-sm font-medium">
                Coefficient (points)
                <input
                  required
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={coefficient}
                  onChange={(e) => setCoefficient(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="touch-manipulation min-h-11 w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50 sm:w-auto sm:px-6"
              >
                Enregistrer
              </button>
            </div>
          </form>
          <div>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              Modifier le coefficient d’une action n’altère pas les points déjà enregistrés sur les
              événements passés ; seuls les nouveaux événements utiliseront la valeur mise à jour.
            </p>
            <ul className="space-y-2">
            {live.actions.map((a) => {
              const draftRaw = actionCoeffDraftById[a.id]
              const parsed = parseCoefficientInput(
                draftRaw !== undefined ? draftRaw : String(a.coefficient),
              )
              const canUpdateCoeff = parsed !== null && parsed !== a.coefficient
              return (
              <li
                key={a.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3"
              >
                <span className="min-w-0 font-medium break-words sm:max-w-[min(100%,14rem)] sm:flex-1 md:max-w-none">
                  {a.libelle}
                </span>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <label className="flex min-w-0 flex-col text-xs font-medium text-slate-600 dark:text-slate-400">
                    <span className="mb-0.5">Coefficient (pts)</span>
                    <input
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      aria-label={`Coefficient pour l’action ${a.libelle}`}
                      value={draftRaw ?? String(a.coefficient)}
                      onChange={(e) =>
                        setActionCoeffDraftById((prev) => ({ ...prev, [a.id]: e.target.value }))
                      }
                      className="min-h-10 w-full min-w-[6.5rem] max-w-[8.5rem] rounded-lg border border-slate-300 bg-white px-2 py-2 text-base tabular-nums dark:border-slate-600 dark:bg-slate-950"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busy || !canUpdateCoeff}
                    onClick={() => updateActionCoefficient(a)}
                    className="touch-manipulation min-h-10 shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    Mettre à jour
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => removeAction(a)}
                    className={rowDeleteButtonClass}
                    aria-label={`Supprimer l’action ${a.libelle}`}
                  >
                    Supprimer
                  </button>
                </div>
              </li>
              )
            })}
          </ul>
          </div>
        </section>
      )}

      {tab === 'events' && (
        <section className="grid gap-6 sm:gap-8 lg:grid-cols-2">
          <form
            onSubmit={addEvenement}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6"
          >
            <h2 className="text-lg font-semibold">Enregistrer un événement</h2>
            <div className="mt-4 flex flex-col gap-3">
              <label className="text-sm font-medium">
                Homme
                <select
                  required
                  value={selHomme}
                  onChange={(e) => setSelHomme(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-600 dark:bg-slate-950"
                >
                  <option value="">—</option>
                  {live.hommes.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.prenom} {h.nom}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Action
                <select
                  required
                  value={selAction}
                  onChange={(e) => setSelAction(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-600 dark:bg-slate-950"
                >
                  <option value="">—</option>
                  {live.actions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.libelle} ({a.coefficient > 0 ? '+' : ''}
                      {a.coefficient})
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={busy}
                className="touch-manipulation min-h-11 w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50 sm:w-auto sm:px-6"
              >
                Valider l’événement
              </button>
            </div>
          </form>
          <div>
            <ul className="max-h-[min(60vh,480px)] space-y-2 overflow-y-auto pr-1 sm:max-h-[480px]">
              {[...live.evenements]
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((ev) => (
                  <li
                    key={ev.id}
                    className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-start sm:justify-between sm:py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium break-words">{ev.hommeLabel}</p>
                      <p className="text-slate-500">
                        {ev.actionLibelle}{' '}
                        <span className="tabular-nums text-indigo-600 dark:text-indigo-400">
                          ({ev.points > 0 ? '+' : ''}
                          {ev.points})
                        </span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(ev.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeEvent(ev.id)}
                      className={rowDeleteButtonClass}
                      aria-label={`Supprimer l’événement : ${ev.hommeLabel}, ${ev.actionLibelle}`}
                    >
                      Supprimer
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </section>
      )}

      {tab === 'charts' && (
        <div className="min-w-0">
          <ScoreCharts hommes={live.hommes} evenements={live.evenements} />
        </div>
      )}

      {tab === 'admins' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="text-base font-semibold sm:text-lg">Comptes administrateurs</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Comptes enregistrés dans Firestore après une connexion (collection{' '}
            <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">admins</code>). Un
            utilisateur Auth qui ne s’est jamais connecté depuis cette mise à jour n’apparaît pas.
          </p>
          {adminsList.loading ? (
            <div className="mt-8 flex justify-center py-12">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : adminsList.error ? (
            <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {adminsList.error} Publiez les dernières règles (<code className="text-xs">firestore.rules</code>
              ) dans la console Firebase.
            </p>
          ) : adminsList.admins.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              Aucune fiche pour l’instant. Votre compte devrait apparaître après synchronisation (quelques
              secondes après connexion).
            </p>
          ) : (
            <>
              <ul className="mt-6 space-y-3 sm:hidden">
                {adminsList.admins.map((a) => {
                  const isSelf = auth.user?.uid === a.id
                  return (
                    <li
                      key={a.id}
                      className={`rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700 ${
                        isSelf ? 'bg-indigo-50/80 dark:bg-indigo-950/30' : ''
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="break-all font-medium">{a.email || '—'}</span>
                        {isSelf && (
                          <span className="rounded bg-indigo-200 px-1.5 py-0.5 text-xs font-medium text-indigo-900 dark:bg-indigo-800 dark:text-indigo-100">
                            Vous
                          </span>
                        )}
                      </div>
                      <p className="mt-2 break-all font-mono text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                        {a.id}
                      </p>
                      <dl className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        <div>
                          <dt className="inline font-medium text-slate-500">1re synchro :</dt>{' '}
                          <dd className="inline">
                            {a.createdAt
                              ? new Date(a.createdAt).toLocaleString('fr-FR')
                              : '—'}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline font-medium text-slate-500">Dernière :</dt>{' '}
                          <dd className="inline">
                            {a.updatedAt
                              ? new Date(a.updatedAt).toLocaleString('fr-FR')
                              : '—'}
                          </dd>
                        </div>
                      </dl>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-6 hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400">
                    <tr>
                      <th className="pb-3 pr-4 font-medium">E-mail</th>
                      <th className="pb-3 pr-4 font-medium">Identifiant (uid)</th>
                      <th className="pb-3 pr-4 font-medium">Première synchro</th>
                      <th className="pb-3 font-medium">Dernière synchro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminsList.admins.map((a) => {
                      const isSelf = auth.user?.uid === a.id
                      return (
                        <tr
                          key={a.id}
                          className={`border-b border-slate-100 dark:border-slate-800 ${
                            isSelf ? 'bg-indigo-50/80 dark:bg-indigo-950/30' : ''
                          }`}
                        >
                          <td className="py-3 pr-4">
                            <span className="font-medium">{a.email || '—'}</span>
                            {isSelf && (
                              <span className="ml-2 rounded bg-indigo-200 px-1.5 py-0.5 text-xs font-medium text-indigo-900 dark:bg-indigo-800 dark:text-indigo-100">
                                Vous
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                            {a.id}
                          </td>
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                            {a.createdAt
                              ? new Date(a.createdAt).toLocaleString('fr-FR')
                              : '—'}
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-400">
                            {a.updatedAt
                              ? new Date(a.updatedAt).toLocaleString('fr-FR')
                              : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
