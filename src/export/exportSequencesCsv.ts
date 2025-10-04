import { listSequences } from "../services/sequences";
import { sequenceEdgesToCsv, sequenceNodesToCsv, sequencesToCsv } from "./csv";
import { saveCsv } from "./saveCsv";

export async function exportSequencesAsCsv() {
  const sequences = await listSequences();
  const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g, "-"); // YYYY-MM-DD-HH-MM-SS

  const seqCsv  = sequencesToCsv(sequences);
  const nodeCsv = sequenceNodesToCsv(sequences);
  const edgeCsv = sequenceEdgesToCsv(sequences);

  await saveCsv(seqCsv,  `sequences-${ts}.csv`);
  await saveCsv(nodeCsv, `sequence_nodes-${ts}.csv`);
  await saveCsv(edgeCsv, `sequence_edges-${ts}.csv`);
}
