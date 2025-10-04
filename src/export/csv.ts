import type { Sequence } from "../types/sequence";

const q = (s: any) => {
  // RFC4180-ish quoting: wrap in quotes and double any internal quotes
  const str = String(s ?? "");
  return `"${str.replace(/"/g, '""')}"`;
};
const j = (v: any) => q(JSON.stringify(v ?? null)); // JSON in a cell

const iso = (ms?: number) => (ms ? new Date(ms).toISOString() : "");

export function sequencesToCsv(seqs: Sequence[]): string {
  const header = [
    "id","name","hub","tags_json","cues_global_json","phase_gate_json",
    "createdBy","createdAt_iso","updatedAt_iso","isArchived","storageMode"
  ].join(",");
  const rows = seqs.map(s => [
    q(s.id),
    q(s.name),
    q(s.hub),
    j(s.tags),
    j(s.cues_global),
    j(s.phase_gate),
    q(s.createdBy),
    q(iso(s.createdAt)),
    q(iso(s.updatedAt)),
    q(s.isArchived ?? false),
    q(s.storageMode ?? "embedded"),
  ].join(","));
  return [header, ...rows].join("\n");
}

export function sequenceNodesToCsv(seqs: Sequence[]): string {
  const header = [
    "sequenceId","nodeId","label","position_tag_json","cues_json","phase_gate_json",
    "isHub","techniqueIds_json","videoRefs_json"
  ].join(",");
  const rows: string[] = [];
  for (const s of seqs) {
    for (const n of (s.nodes || [])) {
      rows.push([
        q(s.id),
        q(n.id),
        q(n.label),
        j(n.position_tag),
        j(n.cues),
        j(n.phase_gate),
        q(n.isHub ?? false),
        j(n.techniqueIds),
        j(n.videoRefs),
      ].join(","));
    }
  }
  return [header, ...rows].join("\n");
}

export function sequenceEdgesToCsv(seqs: Sequence[]): string {
  const header = [
    "sequenceId","fromId","toId","opponent_reaction","my_response","priority","freq_weight","notes"
  ].join(",");
  const rows: string[] = [];
  for (const s of seqs) {
    for (const e of (s.edges || [])) {
      rows.push([
        q(s.id),
        q(e.fromId),
        q(e.toId),
        q(e.opponent_reaction),
        q(e.my_response),
        q(e.priority ?? ""),
        q(e.freq_weight ?? ""),
        q(e.notes ?? ""),
      ].join(","));
    }
  }
  return [header, ...rows].join("\n");
}
