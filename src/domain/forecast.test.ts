import { describe, it, expect } from 'vitest';
import { estimateConditions, localSolarHour } from './forecast';
import { byId } from '../data/species';
import type { WeatherHour } from './types';
const point = { lat: 46.3, lng: 6.4 };
const hour: WeatherHour = {
  time: '2026-06-18T06:00:00Z',
  temperature: 16,
  wind: 10,
  rain: 0,
  pressure: 1013,
  cloud: 60,
};
describe('prévisions explicables', () => {
  it('ne calcule aucun indice avec une donnée météo manquante', () => {
    for (const field of ['temperature', 'wind', 'rain', 'pressure', 'cloud'] as const) {
      const result = estimateConditions({ ...hour, [field]: null }, byId.brochet, point);
      expect(result.score).toBeNull();
      expect(result.confidence).toBe('insuffisante');
    }
  });
  it('pénalise le vent et la pluie et affiche les facteurs de sécurité', () => {
    const normal = estimateConditions(hour, byId.brochet, point);
    const rough = estimateConditions({ ...hour, wind: 45, rain: 8 }, byId.brochet, point);
    expect(rough.score!).toBeLessThan(normal.score!);
    expect(rough.safety).toHaveLength(2);
    expect(rough.score).toBeGreaterThanOrEqual(0);
  });
  it('reste une règle déterministe de confiance limitée', () => {
    const result = estimateConditions(hour, byId.perche, point);
    expect(result).toEqual(estimateConditions(hour, byId.perche, point));
    expect(result.confidence).toBe('limitée');
    expect(result.factors.join(' ')).toContain('Profondeur');
    expect(result.factors.join(' ')).toContain('sans effet attribué');
  });
  it('utilise UTC et la longitude, sans dépendre du fuseau du navigateur', () => {
    expect(localSolarHour('2026-06-18T06:30:00Z', 15)).toBe(7.5);
  });
  it('refuse les nombres non finis et les dates invalides', () => {
    expect(estimateConditions({ ...hour, temperature: NaN }, byId.carpe, point).score).toBeNull();
    expect(estimateConditions({ ...hour, time: 'invalid' }, byId.carpe, point).score).toBeNull();
  });
});
