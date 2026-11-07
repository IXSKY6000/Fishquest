import { describe, it, expect } from 'vitest';
import { recommend } from './advisor';
import type { AdviceInput } from './advisor';
import { species } from '../data/species';
const input: AdviceInput = {
  species: 'brochet',
  season: 'été',
  water: 'lac',
  light: 'claire',
  current: 'faible',
  depth: null,
  temperature: null,
  wind: null,
  equipment: [],
};
describe('conseiller', () => {
  it('propose des appâts cohérents pour chaque espèce', () => {
    for (const s of species) expect(recommend({ ...input, species: s.id })).toHaveLength(2);
    expect(recommend({ ...input, species: 'carpe' })[0].name).toBe('Maïs');
    expect(recommend({ ...input, species: 'truite' })[1].name).toBe('Mouche');
  });
  it('ne transforme pas une profondeur inconnue en mesure', () => {
    expect(recommend(input)[0].depth).toContain('inconnue');
    expect(recommend({ ...input, depth: 4 })[0].depth).toContain('4 m');
  });
  it('adapte la présentation au froid et à la lumière', () => {
    const cold = recommend({ ...input, temperature: 7, light: 'faible' })[0];
    expect(cold.animation).toContain('Ralentir');
    expect(cold.color).toContain('Contrastée');
  });
  it('distingue le matériel possédé du matériel suggéré', () => {
    const advice = recommend({ ...input, equipment: ['Shad'] });
    expect(advice[0].available).toBe(true);
    expect(advice[1].available).toBe(false);
  });
});
