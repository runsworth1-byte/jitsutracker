// app/(tabs)/sequences/new.tsx
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { nanoid } from "nanoid/non-secure";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput } from "react-native";
import { approxSequenceSizeBytes, createSequence } from "../../../src/services/sequences";
import type { Sequence } from "../../../src/types/sequence";

const slug = (s: string) =>
  (s || "sequence")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);

/** Soft validator to catch common issues early (non-throwing, returns problems) */
function validateSequenceShape(s: any): string[] {
  const problems: string[] = [];
  if (!s || typeof s !== "object") { problems.push("Payload is not an object."); return problems; }
  if (!s.id || typeof s.id !== "string") problems.push("Missing or invalid 'id' (string).");
  if (!s.name || typeof s.name !== "string") problems.push("Missing or invalid 'name' (string).");
  if (!Array.isArray(s.nodes)) problems.push("Missing or invalid 'nodes' (array).");
  if (!Array.isArray(s.edges)) problems.push("Missing or invalid 'edges' (array).");

  // Basic edge sanity
  if (Array.isArray(s.nodes) && Array.isArray(s.edges)) {
    const nodeIds = new Set(s.nodes.map((n: any) => n?.id).filter(Boolean));
    s.edges.forEach((e: any, idx: number) => {
      if (!e || typeof e !== "object") { problems.push(`Edge[${idx}] is not an object.`); return; }
      if (!e.fromId || !nodeIds.has(e.fromId)) problems.push(`Edge[${idx}] fromId '${e?.fromId}' not found in nodes.`);
      if (!e.toId   || !nodeIds.has(e.toId))   problems.push(`Edge[${idx}] toId '${e?.toId}' not found in nodes.`);
    });
  }
  return problems;
}

export default function NewSequence() {
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [json, setJson] = useState<string>("");
  const router = useRouter();

  async function onCreate() {
    console.log("[Sequences/New] Create clicked");
    const uid = getAuth().currentUser?.uid || "me";

    let seq: Omit<Sequence, "createdAt" | "updatedAt">;

    try {
      if (json.trim()) {
        console.log("[Sequences/New] Parsing JSON…");
        const parsed = JSON.parse(json);

        if (!parsed.name) parsed.name = name || "Untitled Sequence";
        if (!parsed.id) parsed.id = `${slug(parsed.name)}_${nanoid(6)}`;
        if (!parsed.tags) {
          parsed.tags = tags ? tags.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
        }
        if (!parsed.storageMode) parsed.storageMode = "embedded";
        if (!parsed.createdBy) parsed.createdBy = uid;

        // Back-compat: allow either `key_ideas` or `cues_global` (don’t fail if absent)
        if (!Array.isArray(parsed.key_ideas) && Array.isArray(parsed.cues_global)) {
          parsed.key_ideas = parsed.cues_global;
        }

        seq = parsed as Omit<Sequence, "createdAt" | "updatedAt">;
      } else {
        console.log("[Sequences/New] Building empty template…");
        const id = `${slug(name || "Untitled Sequence")}_${nanoid(6)}`;
        seq = {
          id,
          name: name || "Untitled Sequence",
          hub: "",
          tags: tags ? tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
          cues_global: [],
          phase_gate: ["Entry", "Control", "Pass", "Stabilize"],
          nodes: [],
          edges: [],
          createdBy: uid,
          storageMode: "embedded",
        };
      }
    } catch (parseErr: any) {
      console.error("[Sequences/New] JSON parse error:", parseErr);
      Alert.alert("Invalid JSON", parseErr?.message ?? "Could not parse JSON.");
      return;
    }

    // Shape validation (non-blocking unless critical)
    const problems = validateSequenceShape(seq);
    if (problems.length) {
      console.warn("[Sequences/New] Shape issues:\n" + problems.join("\n"));
      // Only block if the critical keys are missing (id/name/nodes/edges)
      const critical = problems.some(p =>
        p.includes("'id'") || p.includes("'name'") || p.includes("'nodes'") || p.includes("'edges'")
      );
      if (critical) {
        Alert.alert("Sequence invalid", problems.join("\n"));
        return;
      }
    }

    // Size check
    const size = await approxSequenceSizeBytes(seq as Sequence);
    console.log(`[Sequences/New] Byte size ~ ${size.toLocaleString()} bytes`);
    if (size > 950_000) { // warn before Firestore 1MB limit
      Alert.alert(
        "Very large sequence",
        "This document is close to Firestore’s 1 MB limit. Consider splitting or trimming notes."
      );
    }

    try {
      console.log("[Sequences/New] Writing to Firestore…", { id: seq.id, name: seq.name });
      await createSequence(seq);
      console.log("[Sequences/New] Write OK. Navigating to detail…", seq.id);

      // Prefer params form
      try {
        router.replace({ pathname: "/(tabs)/sequences/[id]", params: { id: seq.id } });
      } catch (navErr) {
        console.warn("[Sequences/New] Param navigation failed, trying string href", navErr);
        router.replace(`/sequences/${encodeURIComponent(seq.id)}`);
      }
    } catch (e: any) {
      console.error("[Sequences/New] Firestore error:", e);
      Alert.alert("Create failed", e?.message ?? "Unknown Firestore error.");
    }
  }

  console.log("[Sequences/New] mounted");

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontWeight: "700", fontSize: 18 }}>New Sequence</Text>

      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Tags (comma separated)"
        value={tags}
        onChangeText={setTags}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <Text style={{ marginTop: 10, fontWeight: "600" }}>Or paste JSON (optional)</Text>
      <TextInput
        placeholder='{"id":"...","name":"...","nodes":[...],"edges":[...] }'
        value={json}
        onChangeText={setJson}
        multiline
        style={{ minHeight: 160, borderWidth: 1, padding: 10, borderRadius: 8, fontFamily: "monospace" }}
      />

      <Pressable
        onPress={onCreate}
        style={{ alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderRadius: 8 }}
      >
        <Text>Create</Text>
      </Pressable>
    </ScrollView>
  );
}
