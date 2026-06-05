import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { getFirebase } from '../firebase'
import type { AdminProfile } from '../types'

type Result = {
  admins: AdminProfile[]
  loading: boolean
  error: string | null
}

const empty: Result = { admins: [], loading: true, error: null }

/**
 * Liste des fiches `admins` (utilisateurs ayant au moins une fois synchronisé leur compte).
 * À n’utiliser que lorsque l’utilisateur courant est connecté (sinon Firestore refusera la lecture).
 */
export function useAdminsList(enabled: boolean): Result {
  const [state, setState] = useState<Result>(empty)

  useEffect(() => {
    if (!enabled) {
      queueMicrotask(() =>
        setState({ admins: [], loading: false, error: null }),
      )
      return
    }

    const fb = getFirebase()
    if (!fb) {
      queueMicrotask(() =>
        setState({ admins: [], loading: false, error: null }),
      )
      return
    }

    const q = query(collection(fb.db, 'admins'), orderBy('email'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const admins: AdminProfile[] = snap.docs.map((d) => {
          const data = d.data() as Omit<AdminProfile, 'id'>
          return {
            id: d.id,
            email: typeof data.email === 'string' ? data.email : '',
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0,
            updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
          }
        })
        setState({ admins, loading: false, error: null })
      },
      () => {
        setState({
          admins: [],
          loading: false,
          error: 'Impossible de charger la liste des administrateurs (règles Firestore ou index).',
        })
      },
    )
    return () => unsub()
  }, [enabled])

  return state
}
