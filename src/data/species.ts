import type { Species, SpeciesId } from '../domain/types';

// Editorial knowledge, not a claim about local presence or local regulations.
export const species: Species[] = [
  {
    id: 'brochet',
    name: 'Brochet',
    scientific: 'Esox lucius',
    code: 'BRO',
    color: '#47896b',
    family: 'Le chasseur des herbiers',
    description:
      'Un prédateur à l’affût, reconnaissable à son corps allongé et à son museau en bec de canard.',
    habitat: 'Eaux calmes, herbiers et bordures végétalisées des lacs et rivières lentes.',
    activity: 'Souvent à l’aube et au crépuscule. Activité variable selon la température de l’eau.',
    distinctions: [
      'Museau large et aplati',
      'Nageoire dorsale très en arrière',
      'Taches claires sur les flancs',
    ],
    techniques: ['Lancer-ramener', 'Prospection des bordures'],
    baits: ['Shad', 'Spinnerbait', 'Jerkbait'],
    airComfort: [7, 22],
  },
  {
    id: 'perche',
    name: 'Perche',
    scientific: 'Perca fluviatilis',
    code: 'PER',
    color: '#c39a42',
    family: 'La rayée des eaux douces',
    description:
      'Une espèce grégaire aux flancs rayés et aux nageoires orangées. Elle chasse volontiers les petits poissons.',
    habitat: 'Structures immergées, herbiers et cassures des lacs et rivières.',
    activity: 'Plutôt diurne. Les changements de lumière peuvent favoriser l’activité.',
    distinctions: [
      'Bandes verticales sombres',
      'Nageoires pelviennes rouges',
      'Première dorsale épineuse',
    ],
    techniques: ['Lancer léger', 'Drop-shot'],
    baits: ['Petit shad', 'Cuiller', 'Ver'],
    airComfort: [9, 25],
  },
  {
    id: 'truite',
    name: 'Truite fario',
    scientific: 'Salmo trutta',
    code: 'TRF',
    color: '#ac7b67',
    family: 'L’esprit des rivières',
    description: 'Un salmonidé exigeant en oxygène, aux points rouges et noirs caractéristiques.',
    habitat: 'Rivières fraîches et oxygénées, caches sous les berges et fosses.',
    activity: 'Selon les éclosions et la température de l’eau. Éviter la pêche en eau trop chaude.',
    distinctions: [
      'Points rouges et noirs',
      'Petite nageoire adipeuse',
      'Coloration très variable',
    ],
    techniques: ['Dérive naturelle', 'Pêche à la mouche'],
    baits: ['Cuiller légère', 'Mouche', 'Ver'],
    airComfort: [5, 19],
  },
  {
    id: 'sandre',
    name: 'Sandre',
    scientific: 'Sander lucioperca',
    code: 'SAN',
    color: '#859674',
    family: 'Le discret des profondeurs',
    description:
      'Un prédateur aux grands yeux et aux canines marquées, adapté à une faible luminosité.',
    habitat: 'Fonds minéraux, cassures et eaux parfois troubles, en lac ou en rivière.',
    activity:
      'Souvent en faible lumière. Les périodes de reproduction demandent une vigilance particulière.',
    distinctions: [
      'Deux dorsales séparées',
      'Canines bien visibles',
      'Corps élancé aux flancs gris-vert',
    ],
    techniques: ['Grattage lent', 'Pêche verticale'],
    baits: ['Shad', 'Finesse'],
    airComfort: [8, 24],
  },
  {
    id: 'carpe',
    name: 'Carpe',
    scientific: 'Cyprinus carpio',
    code: 'CCO',
    color: '#a88948',
    family: 'La force tranquille',
    description:
      'Un cyprinidé puissant qui recherche sa nourriture sur le fond, guidé par ses barbillons.',
    habitat: 'Eaux lentes, fonds meubles et zones végétalisées des étangs, lacs et rivières.',
    activity:
      'Variable avec la température de l’eau. Souvent active lorsque les eaux se réchauffent.',
    distinctions: [
      'Deux paires de barbillons',
      'Longue dorsale',
      'Écaillure variable selon la forme',
    ],
    techniques: ['Pêche au posé', 'Pêche au flotteur'],
    baits: ['Maïs', 'Bouillettes', 'Ver'],
    airComfort: [12, 27],
  },
  {
    id: 'silure',
    name: 'Silure',
    scientific: 'Silurus glanis',
    code: 'SIL',
    color: '#747d80',
    family: 'Le géant des fleuves',
    description: 'Un grand poisson sans écailles, doté de longs barbillons sensoriels.',
    habitat: 'Fosses, obstacles et secteurs profonds des grands cours d’eau et lacs.',
    activity: 'Souvent crépusculaire ou nocturne. Activité réduite en eau froide.',
    distinctions: ['Six barbillons', 'Peau sans écailles', 'Très longue nageoire anale'],
    techniques: ['Pêche au posé adaptée', 'Lancer puissant'],
    baits: ['Gros leurre souple', 'Vers'],
    airComfort: [14, 29],
  },
];
export const byId = Object.fromEntries(species.map((s) => [s.id, s])) as Record<SpeciesId, Species>;
export function matchSpecies(code: unknown, name?: unknown): Species | undefined {
  return species.find(
    (s) => s.code === code || s.scientific.toLowerCase() === String(name).toLowerCase(),
  );
}
export const knowledgeSource = {
  label: 'DORIS / FFESSM · fiches des espèces',
  url: 'https://doris.ffessm.fr/',
};
