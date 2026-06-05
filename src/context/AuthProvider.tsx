import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getFirebase } from '../firebase'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const fb = getFirebase()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!fb) {
      queueMicrotask(() => {
        setUser(null)
        setLoading(false)
      })
      return
    }
    const unsub = onAuthStateChanged(fb.auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [fb])

  /** Enregistre / met à jour la fiche admin dans Firestore pour l’annuaire (liste des admins). */
  useEffect(() => {
    if (!fb || !user) return
    let cancelled = false
    void (async () => {
      try {
        const ref = doc(fb.db, 'admins', user.uid)
        const snap = await getDoc(ref)
        if (cancelled) return
        await setDoc(
          ref,
          {
            email: user.email ?? '',
            updatedAt: Date.now(),
            ...(snap.exists() ? {} : { createdAt: Date.now() }),
          },
          { merge: true },
        )
      } catch {
        // Firestore indisponible ou règles : l’app reste utilisable sans annuaire
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fb, user])

  const signIn = useCallback(async (email: string, password: string) => {
    const f = getFirebase()
    if (!f) throw new Error('Firebase non configuré')
    await signInWithEmailAndPassword(f.auth, email.trim(), password)
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const f = getFirebase()
    if (!f) throw new Error('Firebase non configuré')
    await createUserWithEmailAndPassword(f.auth, email.trim(), password)
  }, [])

  const logOut = useCallback(async () => {
    const f = getFirebase()
    if (!f) return
    await signOut(f.auth)
  }, [])

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, logOut }),
    [user, loading, signIn, signUp, logOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
