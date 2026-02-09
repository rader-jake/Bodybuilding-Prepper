import type { Checkin } from "@shared/schema";
import type { CheckInMetricValue } from "@shared/types";

export const getCheckinMetricValue = (checkin: Checkin, key: string): CheckInMetricValue | undefined => {
  if (key === "weight" && checkin.weight) return checkin.weight;
  const data: any = checkin.data || {};
  if (Array.isArray(data.metrics)) {
    const match = data.metrics.find((metric: any) => metric?.key === key);
    if (match) return match.value as CheckInMetricValue;
  }
  if (data && Object.prototype.hasOwnProperty.call(data, key)) {
    return data[key] as CheckInMetricValue;
  }
  return undefined;
};

export const formatMetricValue = (value: CheckInMetricValue | undefined) => {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};
