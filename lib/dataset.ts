import fs from "node:fs/promises";
import path from "node:path";
import type { WeddingDataset } from "@/types";

const DATASET_PATH = path.join(process.cwd(), "data", "weddings.json");

/** Read the cached dataset. Returns null before the first build. */
export async function readDataset(): Promise<WeddingDataset | null> {
  try {
    const raw = await fs.readFile(DATASET_PATH, "utf8");
    return JSON.parse(raw) as WeddingDataset;
  } catch {
    return null;
  }
}

export async function writeDataset(dataset: WeddingDataset): Promise<void> {
  await fs.mkdir(path.dirname(DATASET_PATH), { recursive: true });
  await fs.writeFile(DATASET_PATH, `${JSON.stringify(dataset, null, 2)}\n`);
}
