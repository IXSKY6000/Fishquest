import type { Presence } from '../domain/types';
// Fictional observations for interaction testing. Coordinates are not fishing spots.
export const demoPresences: Presence[] = [
  ['brochet', 46.349, 6.386, 'inventory'],
  ['perche', 46.407, 6.552, 'inventory'],
  ['truite', 46.372, 6.486, 'inventory'],
  ['sandre', 46.432, 6.611, 'inventory'],
  ['carpe', 46.311, 6.292, 'observations'],
  ['silure', 46.394, 6.457, 'observations'],
  ['brochet', 46.444, 6.688, 'observations'],
  ['perche', 46.389, 6.537, 'inventory'],
].map(([id, lat, lng, layer], i) => ({
  id: `demo-${i}`,
  species: id as Presence['species'],
  lat: Number(lat),
  lng: Number(lng),
  layer: layer as Presence['layer'],
  location: 'Lac Léman · exemple fictif',
  date: null,
  source: 'Démonstration FishQuest — donnée fictive',
  sourceUrl: '',
  reliability: 'Non applicable · exemple fictif',
  demo: true,
}));
