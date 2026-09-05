import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { ClinicSettings } from '../types';
import { DEFAULT_SETTINGS } from './storage';

const COLLECTION = 'settings';
const DOC_ID = 'clinic';

export { isFirebaseConfigured };

export function subscribeToSettings(
  onChange: (settings: ClinicSettings) => void,
  onError?: (err: unknown) => void
): () => void {
  if (!db) return () => {};

  const ref = doc(db, COLLECTION, DOC_ID);

  const unsubscribe = onSnapshot(
    ref,
    async (snapshot) => {
      if (!snapshot.exists()) {
        await seedDefaultSettings();
        return;
      }
      onChange({ ...DEFAULT_SETTINGS, ...(snapshot.data() as Partial<ClinicSettings>) });
    },
    (err) => onError?.(err)
  );

  return unsubscribe;
}

async function seedDefaultSettings(): Promise<void> {
  if (!db) return;
  const ref = doc(db, COLLECTION, DOC_ID);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    await setDoc(ref, DEFAULT_SETTINGS);
  }
}

export async function updateSettingsInCloud(settings: ClinicSettings): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, COLLECTION, DOC_ID), settings, { merge: true });
}
