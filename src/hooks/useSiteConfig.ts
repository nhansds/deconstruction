import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { getFirebase } from '../firebase'

/** `true` par défaut si le document n’existe pas encore (première installation). */
export function useSiteConfig() {
  const [allowSignUp, setAllowSignUp] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fb = getFirebase()
    if (!fb) {
      queueMicrotask(() => setLoading(false))
      return
    }

    const ref = doc(fb.db, 'config', 'site')
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const v = snap.data()?.allowSignUp
        setAllowSignUp(v !== false)
        setLoading(false)
      },
      () => {
        setAllowSignUp(true)
        setLoading(false)
      },
    )
    return () => unsub()
  }, [])

  return { allowSignUp, loading }
}
