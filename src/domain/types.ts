export type SpeciesId = 'brochet' | 'perche' | 'truite' | 'sandre' | 'carpe' | 'silure';
export type LayerId = 'inventory' | 'observations' | 'estimated';
export interface Coordinates {
  lat: number;
  lng: number;
}
export interface MapArea {
  west: number;
  south: number;
  east: number;
  north: number;
  zoom: number;
}
export interface Species {
  id: SpeciesId;
  name: string;
  scientific: string;
  code: string;
  color: string;
  family: string;
  habitat: string;
  activity: string;
  description: string;
  distinctions: string[];
  techniques: string[];
  baits: string[];
  airComfort: [number, number];
}
export interface Presence extends Coordinates {
  id: string;
  species: SpeciesId;
  layer: 'inventory' | 'observations';
  location: string;
  date: string | null;
  source: string;
  sourceUrl: string;
  reliability: string;
  demo: boolean;
  stationCode?: string;
}
export interface WeatherHour {
  time: string;
  temperature: number | null;
  wind: number | null;
  rain: number | null;
  pressure: number | null;
  cloud: number | null;
}
export interface WeatherDay {
  time: string;
  min: number | null;
  max: number | null;
  rain: number | null;
}
export interface Weather {
  current: WeatherHour;
  hours: WeatherHour[];
  days: WeatherDay[];
  fetchedAt: string;
  timezone: string;
  latitude: number;
  longitude: number;
}
export interface ExplorationVisit extends Coordinates {
  id: string;
  date: string;
  accuracy: number;
}
export type Page = 'map' | 'forecast' | 'advisor' | 'identify' | 'explore';
