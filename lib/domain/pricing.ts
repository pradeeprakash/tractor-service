export const HOURS_STEP = 0.5;
export const MIN_HOURS = 0.5;
export const MAX_HOURS = 24;

export function hoursToX2(hours: number): number {
  const x2 = Math.round(hours * 2);
  if (Math.abs(x2 / 2 - hours) > 1e-9) {
    throw new Error("hours must be a multiple of 0.5");
  }
  return x2;
}

export function x2ToHours(hoursX2: number): number {
  return hoursX2 / 2;
}

export function calcServiceTotalPaise(ratePaisePerHour: number, hours: number): number {
  if (!Number.isFinite(ratePaisePerHour) || ratePaisePerHour <= 0) {
    throw new Error("ratePaisePerHour must be a positive number");
  }
  if (!Number.isFinite(hours) || hours < MIN_HOURS) {
    throw new Error(`hours must be >= ${MIN_HOURS}`);
  }
  const x2 = hoursToX2(hours);
  return Math.round((ratePaisePerHour * x2) / 2);
}

export function clampHours(hours: number): number {
  if (hours < MIN_HOURS) return MIN_HOURS;
  if (hours > MAX_HOURS) return MAX_HOURS;
  return hours;
}
