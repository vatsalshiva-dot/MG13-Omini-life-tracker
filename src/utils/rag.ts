import { pipeline, env } from "@xenova/transformers";
import localforage from "localforage";

// Fix for "JSON Parse error: Unrecognized token '<'"
env.allowLocalModels = false;

export interface VectorEntry {
  id: string; // date string or unique ID
  text: string;
  embedding: number[];
  type: "journal" | "task" | "finance";
}

const vectorStore = localforage.createInstance({
  name: "OmniLifeVectorDB",
  storeName: "embeddings",
});

let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedder;
}

export async function vectorizeText(text: string): Promise<number[]> {
  const model = await getEmbedder();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

export async function storeVector(entry: VectorEntry) {
  await vectorStore.setItem(entry.id, entry);
}

export async function getVector(id: string): Promise<VectorEntry | null> {
  return await vectorStore.getItem(id);
}

export function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchVectors(
  query: string,
  topK: number = 3,
): Promise<(VectorEntry & { score: number })[]> {
  const queryEmbedding = await vectorizeText(query);

  const results: (VectorEntry & { score: number })[] = [];

  await vectorStore.iterate((value: VectorEntry, key: string) => {
    const score = cosineSimilarity(queryEmbedding, value.embedding);
    results.push({ ...value, score });
  });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}
