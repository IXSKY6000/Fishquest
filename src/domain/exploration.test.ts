import { describe, it, expect } from 'vitest';
import { distanceMeters, progress, recordVisit } from './exploration';
const point = { lat: 46.369, lng: 6.472 };
describe('exploration privée', () => {
  it('refuse les positions imprécises ou invalides', () => {
    expect(recordVisit([], point, 101)).toEqual([]);
    expect(recordVisit([], { lat: NaN, lng: 6 }, 2)).toEqual([]);
    expect(recordVisit([], point, -1)).toEqual([]);
  });
  it('ne donne pas de nouveaux points à proximité d’un secteur déjà visité', () => {
    const first = recordVisit([], point, 15);
    expect(recordVisit(first, point, 10)).toBe(first);
    expect(recordVisit(first, { ...point, lat: point.lat + 0.0001 }, 10)).toBe(first);
    expect(recordVisit(first, { ...point, lat: point.lat + 0.003 }, 10)).toHaveLength(2);
  });
  it('calcule la distance géodésique en mètres', () => {
    expect(distanceMeters(point, point)).toBe(0);
    expect(distanceMeters({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(111194.9, 0);
  });
  it('attribue 100 XP par secteur et un niveau tous les 500 XP', () => {
    expect(progress([])).toEqual({ xp: 0, level: 1, withinLevel: 0, places: 0 });
    const visits = Array.from({ length: 5 }, (_, i) => ({
      ...point,
      id: String(i),
      accuracy: 10,
      date: '2026-11-07T12:00:00Z',
    }));
    expect(progress(visits)).toEqual({ xp: 500, level: 2, withinLevel: 0, places: 5 });
  });
});
