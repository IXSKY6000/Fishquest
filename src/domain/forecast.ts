import type { Coordinates, Species, WeatherHour } from './types';
export interface Estimate {
  label: string;
  score: number | null;
  factors: string[];
  safety: string[];
  confidence: 'limitée' | 'insuffisante';
}
export function localSolarHour(time: string, longitude: number): number {
  const date = new Date(time);
  return (date.getUTCHours() + date.getUTCMinutes() / 60 + longitude / 15 + 24) % 24;
}
export function estimateConditions(hour: WeatherHour, fish: Species, point: Coordinates): Estimate {
  if (
    [hour.temperature, hour.wind, hour.rain, hour.cloud, hour.pressure].some(
      (x) => x === null || !Number.isFinite(x),
    ) ||
    !Number.isFinite(Date.parse(hour.time))
  )
    return {
      label: 'Données insuffisantes',
      score: null,
      factors: ['Météo incomplète : aucune estimation calculée.'],
      safety: [],
      confidence: 'insuffisante',
    };
  let score = 45;
  const factors: string[] = [];
  const safety: string[] = [];
  const temp = hour.temperature!,
    wind = hour.wind!,
    rain = hour.rain!,
    cloud = hour.cloud!;
  if (temp >= fish.airComfort[0] && temp <= fish.airComfort[1]) {
    score += 15;
    factors.push(
      `Air à ${temp} °C : plage indicative compatible avec ${fish.name.toLowerCase()}. Ce n’est pas la température de l’eau.`,
    );
  } else {
    score -= 10;
    factors.push(
      'Température de l’air hors de la plage indicative ; l’eau peut être très différente.',
    );
  }
  if (wind >= 4 && wind <= 18) {
    score += 8;
    factors.push('Vent faible à modéré : surface légèrement agitée.');
  }
  if (wind > 30) {
    score -= 35;
    safety.push('Vent soutenu : évitez les secteurs exposés et vérifiez les alertes locales.');
  }
  if (rain > 3) {
    score -= 25;
    safety.push('Pluie marquée : surveillez les crues, berges glissantes et risques d’orage.');
  }
  if (cloud >= 40 && cloud <= 90) {
    score += 8;
    factors.push('Couverture nuageuse : luminosité atténuée.');
  }
  const h = localSolarHour(hour.time, point.lng);
  if ((h >= 5 && h < 9) || (h >= 17 && h < 21)) {
    score += 12;
    factors.push(
      'Créneau matinal ou de fin de journée, en heure solaire approximative (pas un calcul du lever du soleil).',
    );
  }
  const month = new Date(hour.time).getUTCMonth();
  if (month <= 1 || month === 11) {
    score -= 8;
    factors.push('Saison hivernale : activité souvent réduite ; vérifier les fermetures.');
  }
  factors.push(
    `Pression : ${hour.pressure} hPa, affichée mais sans effet attribué faute de tendance mesurée.`,
  );
  factors.push('Profondeur, température de l’eau et débit indisponibles : confiance limitée.');
  score = Math.max(0, Math.min(100, score));
  return {
    label:
      score >= 85
        ? 'Très favorables'
        : score >= 65
          ? 'Favorables'
          : score >= 40
            ? 'Moyennes'
            : 'Défavorables',
    score,
    factors,
    safety,
    confidence: 'limitée',
  };
}
