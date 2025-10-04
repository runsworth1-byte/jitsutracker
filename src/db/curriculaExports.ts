// src/db/curriculaExports.ts
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export type Technique = {
  id: string;
  Technique: string;
  Objective?: string;
  Tags?: string[];
  Positions?: any;
  Movements?: any;
  Notes?: string;
  Legacy?: string | number;
  Study?: boolean;
  SourceTab?: string;
};

export type Lesson = {
  id: string;
  order: number;
  title: string;
  notes?: string;
  durationMinutes?: number;
  items: string[]; // technique IDs
};

export type Curriculum = {
  id: string;
  name: string;
  label?: string;
  notes?: string;
  focusTags?: string[];
};

export async function getCurriculumBundle(curriculumId: string) {
  const cRef = doc(db, "curricula", curriculumId);
  const cSnap = await getDoc(cRef);
  if (!cSnap.exists()) throw new Error("Curriculum not found");

  const curriculum = { id: cSnap.id, ...cSnap.data() } as Curriculum;

  const lessonsCol = collection(cRef, "lessons");
  const lessonsSnap = await getDocs(lessonsCol);
  const lessons: Lesson[] = lessonsSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as Lesson))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Collect technique IDs across lessons
  const techniqueIds = Array.from(new Set(lessons.flatMap(l => l.items || [])));

  // Fetch techniques in parallel (batched manual loop to keep it simple)
  const techniques: Record<string, Technique> = {};
  await Promise.all(
    techniqueIds.map(async (tid) => {
      const tSnap = await getDoc(doc(db, "techniques", tid));
      if (tSnap.exists()) {
        techniques[tid] = { id: tSnap.id, ...(tSnap.data() as any) };
      }
    })
  );

  return { curriculum, lessons, techniques };
}

export async function getLessonBundle(curriculumId: string, lessonId: string) {
  const cRef = doc(db, "curricula", curriculumId);
  const lRef = doc(cRef, "lessons", lessonId);
  const lSnap = await getDoc(lRef);
  if (!lSnap.exists()) throw new Error("Lesson not found");

  const lesson = { id: lSnap.id, ...lSnap.data() } as Lesson;

  const techniqueIds = Array.from(new Set(lesson.items || []));
  const techniques: Record<string, Technique> = {};
  await Promise.all(
    techniqueIds.map(async (tid) => {
      const tSnap = await getDoc(doc(db, "techniques", tid));
      if (tSnap.exists()) {
        techniques[tid] = { id: tSnap.id, ...(tSnap.data() as any) };
      }
    })
  );

  return { lesson, techniques };
}
