export const POSE_KEYS = [
  { key: "front_relaxed", label: "Front Relaxed" },
  { key: "back_relaxed", label: "Back Relaxed" },
  { key: "side_left", label: "Side Left" },
  { key: "side_right", label: "Side Right" },
  { key: "front_most_muscular", label: "Front Most Muscular" },
  { key: "rear_lat_spread", label: "Rear Lat Spread" },
  { key: "leg_shot", label: "Leg Shot" },
  { key: "back_double_biceps", label: "Back Double Biceps" },
] as const;

export type PoseKey = typeof POSE_KEYS[number]["key"];
