// src/db/curricula.ts
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection, doc, getDoc, getDocs, orderBy, query,
    serverTimestamp,
    updateDoc
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import type { Curriculum, Lesson } from "../types/curriculum";

export async function createCurriculum(input: Partial<Curriculum>): Promise<string> {
  const ref = await addDoc(collection(db, "curricula"), {
    name: input.name ?? "Untitled",
    label: input.label ?? input.name ?? "General",
    notes: input.notes ?? "",
    focusTags: input.focusTags ?? [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCurriculum(id: string, patch: Partial<Curriculum>) {
  await updateDoc(doc(db, "curricula", id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function getCurriculum(id: string): Promise<Curriculum | null> {
  const snap = await getDoc(doc(db, "curricula", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Curriculum) : null;
}

export async function listCurricula(): Promise<Curriculum[]> {
  const snap = await getDocs(collection(db, "curricula"));
  const rows: Curriculum[] = [];
  snap.forEach(d => rows.push({ id: d.id, ...d.data() } as Curriculum));
  return rows;
}

// ---- Lessons (subcollection) ----
export function lessonCol(curriculumId: string) {
  return collection(db, "curricula", curriculumId, "lessons");
}

export async function createLesson(curriculumId: string, input: Partial<Lesson>): Promise<string> {
  const ref = await addDoc(lessonCol(curriculumId), {
    order: input.order ?? 1,
    title: input.title ?? "",
    notes: input.notes ?? "",
    durationMinutes: input.durationMinutes ?? null,
    items: input.items ?? [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateLesson(curriculumId: string, lessonId: string, patch: Partial<Lesson>) {
  await updateDoc(doc(db, "curricula", curriculumId, "lessons", lessonId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function listLessons(curriculumId: string): Promise<Lesson[]> {
  const q = query(lessonCol(curriculumId), orderBy("order", "asc"));
  const snap = await getDocs(q);
  const rows: Lesson[] = [];
  snap.forEach(d => rows.push({ id: d.id, ...d.data() } as Lesson));
  return rows;
}

// ---- Lesson item helpers ----
export async function addTechniqueToLesson(curriculumId: string, lessonId: string, techniqueId: string) {
  await updateDoc(doc(db, "curricula", curriculumId, "lessons", lessonId), {
    items: arrayUnion(techniqueId),
    updatedAt: serverTimestamp(),
  });
}

export async function removeTechniqueFromLesson(curriculumId: string, lessonId: string, techniqueId: string) {
  await updateDoc(doc(db, "curricula", curriculumId, "lessons", lessonId), {
    items: arrayRemove(techniqueId),
    updatedAt: serverTimestamp(),
  });
}

export async function setLessonMeta(curriculumId: string, lessonId: string, fields: { notes?: string; durationMinutes?: number | null; title?: string }) {
  await updateDoc(doc(db, "curricula", curriculumId, "lessons", lessonId), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}
