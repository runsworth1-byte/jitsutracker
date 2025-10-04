// src/services/sequences.ts
import { db } from "@/firebaseConfig"; // adjust if your path differs
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { Sequence } from "../types/sequence";

/**
 * List sequences, optionally filtering by a tag.
 * (You can expand this later with includeArchived, etc.)
 */
export async function listSequences(opts?: { tag?: string }) {
  const col = collection(db, "sequences");
  const q = opts?.tag
    ? query(col, where("tags", "array-contains", opts.tag), orderBy("updatedAt", "desc"))
    : query(col, orderBy("updatedAt", "desc"));

  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Sequence;
    const { id: _ignore, ...rest } = data as any; // drop id from doc data if present
    return { id: d.id, ...rest } as Sequence;
  });
}

/** Get a single sequence by id. Returns null if not found. */
export async function getSequence(id: string) {
  const ref = doc(db, "sequences", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as Sequence;
  const { id: _ignore, ...rest } = data as any; // drop id from doc data if present
  return { id: snap.id, ...rest } as Sequence;
}

/**
 * Create a sequence. Caller should provide a fully-formed object
 * (including createdBy). We stamp created/updated timestamps here.
 */
export async function createSequence(seq: Omit<Sequence, "createdAt" | "updatedAt">) {
  const ref = doc(db, "sequences", seq.id);
  const now = Date.now();
  const payload: Sequence = { ...seq, createdAt: now, updatedAt: now };
  await setDoc(ref, payload, { merge: true });
  return payload;
}

/**
 * Save (upsert) a sequence. We bump updatedAt automatically.
 * Use this for edits after initial create.
 */
export async function saveSequence(seq: Sequence) {
  const ref = doc(db, "sequences", seq.id);
  const payload = { ...seq, updatedAt: Date.now() };
  await setDoc(ref, payload, { merge: true });
  return payload;
}

/** Lightweight partial update if you only touch a few fields. */
export async function patchSequence(id: string, patch: Partial<Sequence>) {
  const ref = doc(db, "sequences", id);
  await updateDoc(ref, { ...patch, updatedAt: Date.now() } as any);
}

/** Delete a single sequence (irreversible). */
export async function deleteSequence(id: string) {
  await deleteDoc(doc(db, "sequences", id));
}

/** Bulk delete multiple sequences (irreversible). */
export async function deleteSequences(ids: string[]) {
  const batch = writeBatch(db);
  ids.forEach((id) => batch.delete(doc(db, "sequences", id)));
  await batch.commit();
}

/** Approximate serialized size (for the 1 MB doc limit guard). */
export async function approxSequenceSizeBytes(seq: Sequence): Promise<number> {
  return new TextEncoder().encode(JSON.stringify(seq)).length;
}
