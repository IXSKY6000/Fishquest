import type { Coordinates, ExplorationVisit } from './types';
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad,
    dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function recordVisit(
  visits: ExplorationVisit[],
  point: Coordinates,
  accuracy: number,
  now = new Date(),
): ExplorationVisit[] {
  if (
    !Number.isFinite(point.lat) ||
    Math.abs(point.lat) > 90 ||
    !Number.isFinite(point.lng) ||
    Math.abs(point.lng) > 180 ||
    !Number.isFinite(accuracy) ||
    accuracy < 0 ||
    accuracy > 100
  )
    return visits;
  if (visits.some((v) => distanceMeters(v, point) < 250)) return visits;
  return [
    ...visits,
    { ...point, id: crypto.randomUUID(), accuracy, date: now.toISOString() },
  ].slice(-1000);
}
export function progress(visits: ExplorationVisit[]) {
  const xp = visits.length * 100;
  return { xp, level: Math.floor(xp / 500) + 1, withinLevel: xp % 500, places: visits.length };
}
