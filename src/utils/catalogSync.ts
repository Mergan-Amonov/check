import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Treatment } from '../types';
import { DEFAULT_TREATMENTS } from './storage';

const COLLECTION = 'treatments';

export { isFirebaseConfigured };

export function subscribeToCatalog(
  onChange: (treatments: Treatment[]) => void,
  onError?: (err: unknown) => void
): () => void {
  if (!db) return () => {};

  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      if (snapshot.empty) {
        await seedDefaultCatalog();
        return;
      }
      const treatments = snapshot.docs.map((d) => {
        const data = d.data() as Treatment & { createdAt?: number };
        return {
          id: data.id,
          name: data.name,
          category: data.category,
          price: data.price,
          description: data.description
        };
      });
      onChange(treatments);
    },
    (err) => onError?.(err)
  );

  return unsubscribe;
}

async function seedDefaultCatalog(): Promise<void> {
  if (!db) return;
  const batch = writeBatch(db);
  DEFAULT_TREATMENTS.forEach((t, index) => {
    const ref = doc(db!, COLLECTION, t.id);
    batch.set(ref, { ...t, createdAt: Date.now() - index });
  });
  await batch.commit();
}

export async function addTreatmentToCloud(treatment: Treatment): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, COLLECTION, treatment.id), { ...treatment, createdAt: Date.now() });
}

export async function updateTreatmentInCloud(treatment: Treatment): Promise<void> {
  if (!db) return;
  // Merge without touching createdAt so the catalog order stays stable on edit.
  await setDoc(doc(db, COLLECTION, treatment.id), { ...treatment }, { merge: true });
}

export async function deleteTreatmentFromCloud(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function resetCatalogInCloud(): Promise<void> {
  if (!db) return;
  const snapshot = await getDocs(collection(db, COLLECTION));
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  await seedDefaultCatalog();
}
