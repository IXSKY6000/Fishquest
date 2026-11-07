import type { SpeciesId } from './types';
export interface AdviceInput {
  species: SpeciesId;
  season: 'printemps' | 'été' | 'automne' | 'hiver';
  water: 'lac' | 'rivière' | 'étang';
  light: 'claire' | 'faible';
  current: 'faible' | 'modéré' | 'fort';
  depth: number | null;
  temperature: number | null;
  wind: number | null;
  equipment: string[];
}
export interface Advice {
  name: string;
  size: string;
  weight: string;
  color: string;
  animation: string;
  depth: string;
  reason: string;
  available: boolean;
}
const knowledge: Record<
  SpeciesId,
  { name: string; size: string; weight: string; animation: string }[]
> = {
  brochet: [
    {
      name: 'Shad',
      size: '12–18 cm',
      weight: '5–15 g, à ajuster',
      animation: 'Récupération lente et régulière, entrecoupée de pauses.',
    },
    {
      name: 'Spinnerbait',
      size: '10–15 cm',
      weight: '10–20 g, à ajuster',
      animation: 'Passages réguliers en bordure des herbiers.',
    },
  ],
  perche: [
    {
      name: 'Petit shad',
      size: '5–8 cm',
      weight: '2–7 g, à ajuster',
      animation: 'Petits bonds et pauses sur les zones dégagées.',
    },
    {
      name: 'Cuiller',
      size: 'N° 1–2',
      weight: '3–6 g, à ajuster',
      animation: 'Lancer-ramener régulier.',
    },
  ],
  truite: [
    {
      name: 'Cuiller légère',
      size: 'N° 0–2',
      weight: '2–5 g, à ajuster',
      animation: 'Récupération juste assez rapide pour faire tourner la palette.',
    },
    {
      name: 'Mouche',
      size: 'Hameçon n° 12–18',
      weight: 'Sans lest ou lestage très léger',
      animation: 'Dérive naturelle, sans dragage, adaptée aux insectes présents.',
    },
  ],
  sandre: [
    {
      name: 'Shad',
      size: '8–12 cm',
      weight: '5–15 g, à ajuster',
      animation: 'Petites tractions lentes et longues pauses près du fond.',
    },
    {
      name: 'Finesse',
      size: '8–12 cm',
      weight: '3–10 g, à ajuster',
      animation: 'Animations minimales, montage léger.',
    },
  ],
  carpe: [
    {
      name: 'Maïs',
      size: '1–3 grains',
      weight: 'Lest minimal pour tenir le montage',
      animation: 'Au posé ; amorçage modéré, selon la réglementation.',
    },
    {
      name: 'Bouillettes',
      size: '12–20 mm',
      weight: 'Lest adapté au fond et à la sécurité du montage',
      animation: 'Présentation immobile et discrète.',
    },
  ],
  silure: [
    {
      name: 'Gros leurre souple',
      size: '18–25 cm',
      weight: '20–60 g, à ajuster',
      animation: 'Tractions amples et contrôlées, matériel puissant adapté.',
    },
    {
      name: 'Vers',
      size: 'Bouquet adapté au montage',
      weight: 'Lest minimal pour tenir le fond',
      animation: 'Présentation au posé sur un secteur accessible et sûr.',
    },
  ],
};
export function recommend(input: AdviceInput): Advice[] {
  return knowledge[input.species].map((k) => ({
    ...k,
    animation:
      input.season === 'hiver' || (input.temperature !== null && input.temperature < 10)
        ? `${k.animation} Ralentir et allonger les pauses en eau ou saison froide.`
        : k.animation,
    color:
      input.light === 'faible'
        ? 'Contrastée, blanc ou chartreuse à essayer'
        : 'Naturelle, argent ou olive à essayer',
    depth:
      input.depth === null
        ? 'Profondeur inconnue : commencer en bordure, sans présumer du fond.'
        : `Prospecter progressivement entre la surface et ${input.depth} m, selon l’accrochage.`,
    weight:
      input.current === 'fort'
        ? `${k.weight}. Courant fort : augmenter seulement si nécessaire et rester en sécurité.`
        : k.weight,
    reason: `Base par espèce · ${input.water} · ${input.season}. ${input.light === 'faible' ? 'Faible lumière : privilégier un contraste visible.' : 'Bonne lumière : commencer par une présentation discrète.'} ${input.temperature === null ? 'Température de l’eau inconnue.' : `Eau renseignée par vous : ${input.temperature} °C.`} ${input.wind === null ? 'Vent non renseigné.' : `Vent renseigné : ${input.wind} km/h ; adapter le contrôle de la ligne.`}`,
    available: input.equipment.length === 0 || input.equipment.includes(k.name),
  }));
}
export const equipmentNames = [
  ...new Set(
    Object.values(knowledge)
      .flat()
      .map((k) => k.name),
  ),
];
