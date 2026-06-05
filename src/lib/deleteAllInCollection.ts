import {
  collection,
  getDocs,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'

const MAX_BATCH = 450

/** Supprime tous les documents d’une collection (plusieurs batchs si besoin). */
export async function deleteAllDocumentsInCollection(
  db: Firestore,
  collectionId: string,
): Promise<number> {
  const snap = await getDocs(collection(db, collectionId))
  const refs = snap.docs.map((d) => d.ref)
  let deleted = 0
  for (let i = 0; i < refs.length; i += MAX_BATCH) {
    const batch = writeBatch(db)
    const chunk = refs.slice(i, i + MAX_BATCH)
    for (const ref of chunk) {
      batch.delete(ref)
    }
    await batch.commit()
    deleted += chunk.length
  }
  return deleted
}
