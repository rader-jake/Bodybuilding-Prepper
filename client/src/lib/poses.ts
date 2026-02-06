export const POSE_KEYS = [
  { key: "front", label: "Front" },
  { key: "side", label: "Side" },
  { key: "back", label: "Back" },
] as const;

export type PoseKey = typeof POSE_KEYS[number]["key"];
