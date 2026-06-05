import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirebase } from '../firebase'
import type { ActionDef, Evenement, Homme } from '../types'

export type LiveData = {
  hommes: Homme[]
  actions: ActionDef[]
  evenements: Evenement[]
  loading: boolean
  /** true si les variables d’environnement Firebase ne sont pas définies */
  missingConfig: boolean
  error: string | null
}

const initial: LiveData = {
  hommes: [],
  actions: [],
  evenements: [],
  loading: true,
  missingConfig: false,
  error: null,
}

export function useLiveData(): LiveData {
  const [state, setState] = useState<LiveData>(initial)

  useEffect(() => {
    const fb = getFirebase()
    if (!fb) {
      queueMicrotask(() => {
        setState({ ...initial, loading: false, missingConfig: true, error: null })
      })
      return
    }

    const { db } = fb
    let unsubs: Unsubscribe[] = []

    const fail = (msg: string) =>
      setState((s) => ({
        ...s,
        loading: false,
        missingConfig: false,
        error: msg,
      }))

    try {
      const qHommes = query(collection(db, 'hommes'), orderBy('createdAt', 'asc'))
      const qActions = query(collection(db, 'actions'), orderBy('createdAt', 'asc'))
      const qEvents = query(collection(db, 'evenements'), orderBy('createdAt', 'asc'))

      let h: Homme[] = []
      let a: ActionDef[] = []
      let e: Evenement[] = []

      const push = () =>
        setState({
          hommes: h,
          actions: a,
          evenements: e,
          loading: false,
          missingConfig: false,
          error: null,
        })

      unsubs = [
        onSnapshot(
          qHommes,
          (snap) => {
            h = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Homme, 'id'>) }))
            push()
          },
          () => fail('Impossible de lire les hommes.'),
        ),
        onSnapshot(
          qActions,
          (snap) => {
            a = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActionDef, 'id'>) }))
            push()
          },
          () => fail('Impossible de lire les actions.'),
        ),
        onSnapshot(
          qEvents,
          (snap) => {
            e = snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<Evenement, 'id'>),
            }))
            push()
          },
          () => fail('Impossible de lire les événements.'),
        ),
      ]
    } catch {
      fail('Erreur Firestore.')
    }

    return () => {
      unsubs.forEach((u) => u())
    }
  }, [])

  return state
}
