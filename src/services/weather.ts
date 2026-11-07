import { z } from 'zod';
import type { Coordinates, Weather, WeatherHour } from '../domain/types';
import { getJson } from './http';
const maybe = z.number().nullable();
const fields = {
  temperature_2m: maybe,
  wind_speed_10m: maybe,
  precipitation: maybe,
  surface_pressure: maybe,
  cloud_cover: maybe,
};
const currentSchema = z.object({ time: z.string(), ...fields });
const seriesSchema = z.object({
  time: z.array(z.string()),
  temperature_2m: z.array(maybe),
  wind_speed_10m: z.array(maybe),
  precipitation: z.array(maybe),
  surface_pressure: z.array(maybe),
  cloud_cover: z.array(maybe),
});
const responseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  current: currentSchema,
  hourly: seriesSchema,
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_min: z.array(maybe),
    temperature_2m_max: z.array(maybe),
    precipitation_sum: z.array(maybe),
  }),
});
const vars = Object.keys(fields).join(',');
export async function loadWeather(point: Coordinates, signal: AbortSignal): Promise<Weather> {
  // UTC avoids silently interpreting the forecast in the browser's local timezone.
  const params = new URLSearchParams({
    latitude: String(point.lat),
    longitude: String(point.lng),
    current: vars,
    hourly: vars,
    daily: 'temperature_2m_min,temperature_2m_max,precipitation_sum',
    timezone: 'GMT',
    forecast_days: '5',
    wind_speed_unit: 'kmh',
  });
  const r = responseSchema.parse(
    await getJson(`https://api.open-meteo.com/v1/forecast?${params}`, signal),
  );
  const c = r.current;
  const current: WeatherHour = {
    time: c.time + 'Z',
    temperature: c.temperature_2m,
    wind: c.wind_speed_10m,
    rain: c.precipitation,
    pressure: c.surface_pressure,
    cloud: c.cloud_cover,
  };
  const hours: WeatherHour[] = r.hourly.time.map((t, i) => ({
    time: t + 'Z',
    temperature: r.hourly.temperature_2m[i] ?? null,
    wind: r.hourly.wind_speed_10m[i] ?? null,
    rain: r.hourly.precipitation[i] ?? null,
    pressure: r.hourly.surface_pressure[i] ?? null,
    cloud: r.hourly.cloud_cover[i] ?? null,
  }));
  return {
    current,
    hours,
    days: r.daily.time.map((t, i) => ({
      time: t,
      min: r.daily.temperature_2m_min[i] ?? null,
      max: r.daily.temperature_2m_max[i] ?? null,
      rain: r.daily.precipitation_sum[i] ?? null,
    })),
    fetchedAt: new Date().toISOString(),
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
  };
}
