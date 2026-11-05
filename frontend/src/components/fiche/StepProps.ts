import type { Draft, Key } from "./model";
export type StepProps = { d: Draft; set: (k: Key, v: string) => void; errors: Partial<Record<Key, string>> };
