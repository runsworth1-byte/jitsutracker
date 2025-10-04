import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { deleteSequence, getSequence } from "../../../src/services/sequences";
import type { Sequence, SequenceEdge, SequenceNode } from "../../../src/types/sequence";

/** ---------- local helpers (back-compat for new fields) ---------- */
type SequencePlus = Sequence & { key_ideas?: string[] };
type SequenceNodePlus = SequenceNode & { actions?: string[] };

function getKeyIdeas(s: SequencePlus): string[] {
  const v = (Array.isArray(s.key_ideas) ? s.key_ideas : s.cues_global) ?? [];
  return v.filter(Boolean);
}

function getActions(n: SequenceNodePlus): string[] {
  const v = (Array.isArray(n.actions) ? n.actions : n.cues) ?? [];
  return v.filter(Boolean);
}

function weightPick<T>(items: T[], getW: (t: T) => number) {
  if (!items.length) return undefined as any;
  const total = items.reduce((s, i) => s + (getW(i) || 0.0001), 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= getW(it) || 0.0001;
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

export default function SequenceViewer() {
  const params = useLocalSearchParams();
const seqId = Array.isArray(params.id) ? params.id[0] : params.id as string | undefined;
  const [seq, setSeq] = useState<Sequence | null>(null);
  const [mode, setMode] = useState<"view" | "quiz">("view");

  const [quizNodeId, setQuizNodeId] = useState<string | null>(null);
  const [quizEdge, setQuizEdge] = useState<SequenceEdge | null>(null);

  useEffect(() => {
  if (!seqId) return;
  (async () => setSeq(await getSequence(seqId)))();
}, [seqId]);

  const nodeMap = useMemo(() => {
    const m = new Map<string, SequenceNode>();
    seq?.nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [seq]);

  const edgesFrom = (nid: string) => (seq?.edges || []).filter((e) => e.fromId === nid);

  function renderInlineBold(line: string) {
  const parts = line.split(/\*\*(.+?)\*\*/g); // keep captured groups
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <Text key={i} style={{ fontWeight: "700", color: "#0ea5e9" }}>{p}</Text>
    ) : (
      <Text key={i}>{p}</Text>
    )
  );
}
  
  function startQuiz() {
    if (!seq || !seq.nodes.length) return Alert.alert("No nodes yet");
    const hub = seq.nodes.find((n) => (n as SequenceNodePlus).isHub) || seq.nodes[0];
    if (!hub) return Alert.alert("No hub found");
    setMode("quiz");
    const e = weightPick(edgesFrom(hub.id), (x) => x.freq_weight ?? 1);
    setQuizNodeId(hub.id);
    setQuizEdge(e || null);
  }

  function chooseResponse(edge: SequenceEdge) {
    if (!seq) return;
    const nextNodeId = edge.toId;
    const nextEdges = edgesFrom(nextNodeId);
    const e = nextEdges.length ? weightPick(nextEdges, (x) => x.freq_weight ?? 1) : null;
    setQuizNodeId(nextNodeId);
    setQuizEdge(e || null);
    if (!e) Alert.alert("Finish", "Sequence reached a finisher node.");
  }

  if (!seq) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Loading…</Text>
      </View>
    );
  }

  const keyIdeas = getKeyIdeas(seq as SequencePlus);
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Text style={{ fontWeight: "800", fontSize: 20 }}>{seq.name}</Text>
      {!!seq.tags?.length && <Text style={{ opacity: 0.7 }}>{seq.tags.join(" • ")}</Text>}
      {!!keyIdeas.length && (
        <Text style={{ marginTop: 6 }}>
          <Text style={{ fontWeight: "600" }}>Key ideas: </Text>
          {keyIdeas.join(" → ")}
        </Text>
      )}

      {/* Single action row: View / Start Quiz / Delete */}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <Pressable
          onPress={() => setMode("view")}
          style={{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
        >
          <Text>View</Text>
        </Pressable>
        <Pressable
          onPress={startQuiz}
          style={{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
        >
          <Text>Start Quiz</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (!seq) return;
            const doDelete = async () => {
              try {
                await deleteSequence(seq.id);
                router.replace("/(tabs)/sequences");
              } catch (e: any) {
                Alert.alert("Delete failed", e?.message ?? String(e));
              }
            };
            if (typeof window !== "undefined" && (window as any).confirm) {
              if (window.confirm("Delete this sequence? This cannot be undone.")) doDelete();
            } else {
              Alert.alert("Delete sequence?", "This cannot be undone.", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: doDelete },
              ]);
            }
          }}
          style={{
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderColor: "#c00",
          }}
        >
          <Text style={{ color: "#c00" }}>Delete</Text>
        </Pressable>
      </View>

      {mode === "view" && (
        <View style={{ gap: 8, marginTop: 8 }}>
          {seq.nodes.map((n) => {
            const actions = getActions(n as SequenceNodePlus);
            return (
              <View key={n.id} style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}>
                <Text style={{ fontWeight: "700" }}>
                  {n.label}
                  {(n as SequenceNodePlus).isHub ? "  (Hub)" : ""}
                </Text>

                {!!actions.length && (
                 <View style={{ marginTop: 4, opacity: 0.8 }}>
                     <Text style={{ fontWeight: "600" }}>Actions:</Text>
                    {actions.map((a, idx) => (
                      <Text key={idx} style={{ marginTop: 2 }}>
                        {renderInlineBold(a)}
                      </Text>
                     ))}
                </View>
            )}

                <Text style={{ marginTop: 6, fontWeight: "600" }}>Branches</Text>
                {seq.edges
                  .filter((e) => e.fromId === n.id)
                  .map((e) => (
                    <View key={`${e.fromId}->${e.toId}`} style={{ marginTop: 4 }}>
                      <Text>• Opponent: {e.opponent_reaction}</Text>
                      <Text>
                        {"  "}You: {e.my_response} → next: {nodeMap.get(e.toId)?.label || e.toId}
                      </Text>
                    </View>
                  ))}
              </View>
            );
          })}
        </View>
      )}

      {mode === "quiz" && quizNodeId && (
        <View style={{ borderWidth: 1, borderRadius: 12, padding: 12, gap: 10, marginTop: 8 }}>
          <Text style={{ fontWeight: "700" }}>Position: {nodeMap.get(quizNodeId)?.label}</Text>

          <Text style={{ marginTop: 4, opacity: 0.8 }}>
            Opponent: {quizEdge ? quizEdge.opponent_reaction : "No further reaction (finisher)"}
          </Text>

          <Text style={{ marginTop: 8, fontWeight: "600" }}>Your response:</Text>
{edgesFrom(quizNodeId).map((e) => (
  <Pressable
    key={`${e.fromId}->${e.toId}`}
    onPress={() => chooseResponse(e)}
    style={{ borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 6 }}
  >
    <Text>{renderInlineBold(e.my_response)}</Text>
    <Text style={{ opacity: 0.6, marginTop: 2 }}>
      → {nodeMap.get(e.toId)?.label || e.toId}
    </Text>
  </Pressable>
))}
        </View>
      )}
    </ScrollView>
  );
}
