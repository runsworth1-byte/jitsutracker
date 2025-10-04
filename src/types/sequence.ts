/**
 * Phase-gate markers to keep sequences consistent with how we teach/execute.
 */
export type PhaseGate = "Entry" | "Control" | "Pass" | "Stabilize";

/**
 * A single position/state in a sequence graph.
 * Example: "Half-Butterfly Hub (top)" or "Chest-to-chest with nearside underhook".
 */
export type SequenceNode = {
  /** Stable node ID unique within the sequence (e.g., "N1", "B2", "SIDE"). */
  id: string;
  /** Human-readable label shown in the UI. */
  label: string;
  /** Position tags used for search/filters (e.g., ["half_butterfly_top"]). */
  position_tag: string[];
  /** Optional quick execution cues for this node. */
  cues?: string[];
  /** Optional phase-gate(s) that best describe this node. */
  phase_gate?: PhaseGate[];
  /** Mark true for hub nodes that other branches intentionally funnel back to. */
  isHub?: boolean;
  /** Optional related techniques you might want to deep-link to later. */
  techniqueIds?: string[];
  /** Optional video references (URLs or storage paths). */
  videoRefs?: string[];
};

/**
 * A directed edge in the sequence graph (from one node to the next).
 * Encodes opponent reaction -> your response, plus priority/weighting for quizzing.
 */
export type SequenceEdge = {
  /** Source node ID. */
  fromId: string;
  /** Destination node ID. */
  toId: string;
  /** What they do (trigger). Example: "Arm–knee connection" */
  opponent_reaction: string;
  /** What you do (response). Example: "Inside elbow drags knee; step to mount" */
  my_response: string;
  /** Optional importance indicator for study ordering. */
  priority?: "A" | "B" | "C";
  /** Optional weighting (0–1) for quiz randomization. Defaults handled in code. */
  freq_weight?: number;
  /** Free-form notes if needed. */
  notes?: string;
};

/**
 * The full sequence document (embedded arrays model).
 * Keep this under ~500KB; migrate to subcollections only if you truly outgrow it.
 */
export type Sequence = {
  /** Firestore doc id (slug/uuid). */
  id: string;
  /** Display name. */
  name: string;
  /** Canonical hub label for quick starts (e.g., "Half-Butterfly Hub"). */
  hub: string;
  /** Free-form tags for discovery (e.g., ["passing","half-butterfly","gi"]). */
  tags: string[];
  /** Always-on cues shown at the top of the viewer. */
  cues_global: string[];
  /** Ordered list of phase-gates used in this sequence. */
  phase_gate: PhaseGate[];
  /** Embedded node list. */
  nodes: SequenceNode[];
  /** Embedded edge list. */
  edges: SequenceEdge[];
  /** Ownership/metadata. */
  createdBy: string;
  createdAt: number; // Date.now()
  updatedAt: number; // Date.now()
  /** Soft delete/archive. */
  isArchived?: boolean;
  /** Future-proof flag in case we migrate to split storage. */
  storageMode?: "embedded";
};
