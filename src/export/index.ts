// src/export/index.ts
import jsPDF from "jspdf";
import { listSequences } from "../services/sequences"; // Firestore read
import { saveAs } from "./save"; // small helper below

function formatFsTimestamp(v: any): string {
  try {
    if (!v) return "";
    // Firestore Timestamp object
    if (typeof v?.toDate === "function") {
      const d: Date = v.toDate();
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
    // { seconds, nanoseconds } proto
    if (typeof v === "object" && typeof v.seconds === "number") {
      const d = new Date(v.seconds * 1000);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
    // Already a string or other scalar
    if (typeof v === "string") return v;
    return String(v ?? "");
  } catch {
    return String(v ?? "");
  }
}

/** ---------- JSON ---------- */
export function exportCurriculumJson(bundle: {
  curriculum: any; lessons: any[]; techniques: Record<string, any>;
}) {
  const { curriculum, lessons, techniques } = bundle;
  const payload = { type: "curriculum", version: 1, curriculum, lessons, techniques };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const name = `curriculum_${safe(curriculum.name)}_${curriculum.id}.json`;
  triggerDownloadOrShare(blob, name, "application/json");
}

export function exportLessonJson(bundle: { lesson: any; techniques: Record<string, any>; curriculumName?: string }) {
  const { lesson, techniques, curriculumName } = bundle;
  const payload = { type: "lesson", version: 1, curriculumName, lesson, techniques };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const prefix = curriculumName ? `${safe(curriculumName)}__` : "";
  const name = `${prefix}lesson_${safe(lesson.title)}_${lesson.id}.json`;
  triggerDownloadOrShare(blob, name, "application/json");
}

export async function exportTechniquesCsv(techniques: any[]) {
  // Exact header + order requested
  const header = [
    "Technique ID",
    "SourceTab",
    "Technique",
    "Objective",
    "Starting position",
    "Left hand",
    "Right hand",
    "Left foot",
    "Right foot",
    "Movement 1",
    "Movement 2",
    "Movement 3",
    "Movement 4",
    "Movement 5",
    "Movement 6",
    "Notes",
    "Study",
    "Tags",
    "CreatedAt",
    "LastUpdated",
    "Legacy numbering",
  ];

  const rows: string[][] = [header];

  for (const t of techniques) {
    rows.push([
      t.Techniqueid ?? "",
      t.SourceTab ?? "",
      t.Technique ?? "",
      t.Objective ?? "",
      t["Starting position"] ?? "",
      t["Left hand"] ?? "",
      t["Right hand"] ?? "",
      t["Left foot"] ?? "",
      t["Right foot"] ?? "",
      t["Movement 1"] ?? "",
      t["Movement 2"] ?? "",
      t["Movement 3"] ?? "",
      t["Movement 4"] ?? "",
      t["Movement 5"] ?? "",
      t["Movement 6"] ?? "",
      t.Notes ?? "",
      String(t.Study ?? ""),
      Array.isArray(t?.Tags) ? t.Tags.join(" | ") : "",
      formatFsTimestamp(t.CreatedAt ?? t.createdAt),
      formatFsTimestamp(t.LastUpdated ?? t.updatedAt),
      String(t["Legacy numbering"] ?? t.Legacy ?? ""),
    ]);
  }

  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const name = `techniques_${new Date().toISOString().slice(0, 10)}.csv`;
  saveAs(blob, name);
}

/** ---------- CSV ---------- */
function toCsv(rows: string[][]) {
  return rows.map(r =>
    r.map(v => {
      const s = v ?? "";
      return /[",\n]/.test(s) ? `"${s.replaceAll(`"`, `""`)}"` : s;
    }).join(",")
  ).join("\n");
}

export function exportCurriculumCsv(bundle: {
  curriculum: any; lessons: any[]; techniques: Record<string, any>;
}) {
  const { curriculum, lessons, techniques } = bundle;
  const header = [
    "Curriculum", "Lesson Order", "Lesson Title", "Duration (min)",
    "Technique ID", "Technique Name", "Tags", "Objective", "Notes"
  ];

  const rows: string[][] = [header];
  for (const l of lessons) {
    for (const tid of l.items || []) {
      const t = techniques[tid];
      rows.push([
        curriculum.name || "",
        String(l.order ?? ""),
        l.title || "",
        String(l.durationMinutes ?? ""),
        tid,
        t?.Technique || "",
        (t?.Tags || []).join(" | "),
        t?.Objective || "",
        t?.Notes || ""
      ]);
    }
    if (!l.items || l.items.length === 0) {
      rows.push([
        curriculum.name || "",
        String(l.order ?? ""),
        l.title || "",
        String(l.durationMinutes ?? ""),
        "",
        "",
        "",
        "",
        l.notes || ""
      ]);
    }
  }

  const name = `curriculum_${safe(curriculum.name)}_${curriculum.id}.csv`;
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  triggerDownloadOrShare(blob, name, "text/csv");
}

export function exportLessonCsv(bundle: {
  lesson: any; techniques: Record<string, any>; curriculumName?: string
}) {
  const { lesson, techniques, curriculumName } = bundle;
  const header = [
    "Curriculum", "Lesson Order", "Lesson Title", "Duration (min)",
    "Technique ID", "Technique Name", "Tags", "Objective", "Notes"
  ];
  const rows: string[][] = [header];

  for (const tid of lesson.items || []) {
    const t = techniques[tid];
    rows.push([
      curriculumName || "",
      String(lesson.order ?? ""),
      lesson.title || "",
      String(lesson.durationMinutes ?? ""),
      tid,
      t?.Technique || "",
      (t?.Tags || []).join(" | "),
      t?.Objective || "",
      t?.Notes || ""
    ]);
  }
  if (!lesson.items || lesson.items.length === 0) {
    rows.push([
      curriculumName || "",
      String(lesson.order ?? ""),
      lesson.title || "",
      String(lesson.durationMinutes ?? ""),
      "",
      "",
      "",
      "",
      lesson.notes || ""
    ]);
  }

  const prefix = curriculumName ? `${safe(curriculumName)}__` : "";
  const name = `${prefix}lesson_${safe(lesson.title)}_${lesson.id}.csv`;
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  triggerDownloadOrShare(blob, name, "text/csv");
} // ←←✅ this brace was missing in your file

// ----- Sequences CSV (3 files) -----

// JSON-in-a-cell helper (preserves arrays/objects cleanly in Excel/Sheets)
const jcell = (v: any) => JSON.stringify(v ?? null);

// ISO timestamp from ms
const iso = (ms?: number) => (ms ? new Date(ms).toISOString() : "");

// Read from Firestore and export all three CSVs
export async function exportSequencesCsvFromFirestore() {
  const sequences = await listSequences(); // already sorted by updatedAt in our service
  return exportSequencesCsvBundle(sequences);
}

// Export all three CSVs from an in-memory array (if you already have it)
export function exportSequencesCsvBundle(sequences: any[]) {
  const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // --- sequences.csv ---
{
  const header = [
    "id",
    "name",
    "hub",
    "tags_json",
    "key_ideas_json",      // <-- NEW
    "cues_global_json",    // <-- kept for back-compat
    "phase_gate_json",
    "createdBy",
    "createdAt_iso",
    "updatedAt_iso",
    "isArchived",
    "storageMode"
  ];
  const rows: string[][] = [header];
  for (const s of sequences) {
    rows.push([
      s.id ?? "",
      s.name ?? "",
      s.hub ?? "",
      jcell(s.tags),
      jcell(s.key_ideas),            // <-- NEW
      jcell(s.cues_global),          // <-- kept for back-compat
      jcell(s.phase_gate),
      s.createdBy ?? "",
      iso(s.createdAt),
      iso(s.updatedAt),
      String(s.isArchived ?? false),
      s.storageMode ?? "embedded",
    ]);
  }
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  saveAs(blob, `sequences_${stamp}.csv`);
}

  // --- sequence_nodes.csv ---
{
  const header = [
    "sequenceId",
    "nodeId",
    "label",
    "position_tag_json",
    "actions_json",       // <-- NEW
    "cues_json",          // <-- kept for back-compat
    "phase_gate_json",
    "isHub",
    "techniqueIds_json",
    "videoRefs_json"
  ];
  const rows: string[][] = [header];

  for (const s of sequences) {
    for (const n of (s.nodes || [])) {
      rows.push([
        s.id ?? "",
        n.id ?? "",
        n.label ?? "",
        jcell(n.position_tag),
        jcell((n as any).actions),     // <-- NEW (typed as any for safety until types are updated)
        jcell(n.cues),                 // <-- legacy
        jcell(n.phase_gate),
        String((n as any).isHub ?? false),
        jcell(n.techniqueIds),
        jcell(n.videoRefs),
      ]);
    }
  }

  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  saveAs(blob, `sequence_nodes_${stamp}.csv`);
}

  // --- sequence_edges.csv ---
  {
    const header = [
      "sequenceId","fromId","toId","opponent_reaction","my_response","priority","freq_weight","notes"
    ];
    const rows: string[][] = [header];
    for (const s of sequences) {
      for (const e of (s.edges || [])) {
        rows.push([
          s.id ?? "",
          e.fromId ?? "",
          e.toId ?? "",
          e.opponent_reaction ?? "",
          e.my_response ?? "",
          e.priority ?? "",
          e.freq_weight != null ? String(e.freq_weight) : "",
          e.notes ?? "",
        ]);
      }
    }
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `sequence_edges_${stamp}.csv`);
  }
}

/** ---------- PDF (jsPDF simple text layout) ---------- */
export async function exportCurriculumPdf(bundle: {
  curriculum: any; lessons: any[]; techniques: Record<string, any>;
}) {
  const { curriculum, lessons, techniques } = bundle;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  let y = margin;

  doc.setFontSize(16);
  doc.text(`Curriculum: ${curriculum.name || ""}`, margin, y); y += 22;
  if (curriculum.label) { doc.setFontSize(11); wrap(doc, `Label: ${curriculum.label}`, margin, y, 500); y += 16; }
  if (curriculum.notes) { y = addBlock(doc, "Notes", curriculum.notes, margin, y); }

  for (const l of lessons) {
    y = maybeAddPage(doc, y);
    doc.setFontSize(14);
    doc.text(`Lesson ${l.order ?? ""}: ${l.title || ""} (${l.durationMinutes ?? 0} min)`, margin, y);
    y += 18;
    if (l.notes) { y = addBlock(doc, "Lesson Notes", l.notes, margin, y); }

    doc.setFontSize(11);
    for (const tid of l.items || []) {
      const t = techniques[tid];
      const line = `• ${t?.Technique || "(Unnamed)"}  [${(t?.Tags || []).join(", ")}]`;
      y = wrap(doc, line, margin + 12, y, 500);
      if (t?.Objective) y = wrap(doc, `   Objective: ${t.Objective}`, margin + 12, y + 2, 500);
      if (t?.Notes) y = wrap(doc, `   Notes: ${t.Notes}`, margin + 12, y + 2, 500);
      y += 6;
      y = maybeAddPage(doc, y);
    }
    y += 8;
  }

  const name = `curriculum_${safe(curriculum.name)}_${curriculum.id}.pdf`;
  triggerDownloadOrShare(doc.output("blob"), name, "application/pdf");
}

export async function exportLessonPdf(bundle: {
  lesson: any; techniques: Record<string, any>; curriculumName?: string
}) {
  const { lesson, techniques, curriculumName } = bundle;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  let y = margin;

  doc.setFontSize(16);
  doc.text(`${curriculumName ? curriculumName + " — " : ""}Lesson ${lesson.order ?? ""}: ${lesson.title || ""}`, margin, y);
  y += 20;
  doc.setFontSize(11);
  doc.text(`Duration: ${lesson.durationMinutes ?? 0} min`, margin, y);
  y += 16;
  if (lesson.notes) { y = addBlock(doc, "Notes", lesson.notes, margin, y); }

  doc.setFontSize(12);
  doc.text("Techniques", margin, y); y += 14;
  doc.setFontSize(11);
  for (const tid of lesson.items || []) {
    const t = techniques[tid];
    const line = `• ${t?.Technique || "(Unnamed)"}  [${(t?.Tags || []).join(", ")}]`;
    y = wrap(doc, line, margin + 12, y, 500);
    if (t?.Objective) y = wrap(doc, `   Objective: ${t.Objective}`, margin + 12, y + 2, 500);
    if (t?.Notes) y = wrap(doc, `   Notes: ${t.Notes}`, margin + 12, y + 2, 500);
    y += 6;
    y = maybeAddPage(doc, y);
  }

  const prefix = curriculumName ? `${safe(curriculumName)}__` : "";
  const name = `${prefix}lesson_${safe(lesson.title)}_${lesson.id}.pdf`;
  triggerDownloadOrShare(doc.output("blob"), name, "application/pdf");
}

/** ---------- shared helpers ---------- */
function safe(s: string = "") {
  return s.replace(/[^\w\-]+/g, "_").slice(0, 60);
}

function maybeAddPage(doc: jsPDF, y: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y > pageHeight - 72) {
    doc.addPage();
    return 48;
  }
  return y;
}

function addBlock(doc: jsPDF, title: string, text: string, x: number, y: number) {
  doc.setFontSize(12);
  doc.text(title, x, y); y += 14;
  doc.setFontSize(11);
  return wrap(doc, text, x, y, 500) + 10;
}

function wrap(doc: jsPDF, text: string, x: number, y: number, maxWidth: number) {
  const lines = doc.splitTextToSize(text, maxWidth);
  lines.forEach((line: string) => { doc.text(line, x, y); y += 14; });
  return y;
}

/** Download or use Web Share when available */
async function triggerDownloadOrShare(blob: Blob, filename: string, mime: string) {
  const file = new File([blob], filename, { type: mime });
  // Try Web Share (mobile PWA friendly)
  // @ts-ignore
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      // @ts-ignore
      await navigator.share({ files: [file], title: filename, text: filename });
      return;
    } catch { /* fall through to download */ }
  }
  saveAs(blob, filename);
}
