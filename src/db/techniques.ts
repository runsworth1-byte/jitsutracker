// src/db/techniques.ts
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export type TechniqueDoc = { id: string } & Record<string, any>;

export async function getAllTechniques(): Promise<TechniqueDoc[]> {
  const snap = await getDocs(collection(db, "techniques"));
  const rows: TechniqueDoc[] = [];
  snap.forEach(d => rows.push({ id: d.id, ...(d.data() as any) }));
  return rows;
}
