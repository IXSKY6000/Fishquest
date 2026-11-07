import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export interface LocationPosition {
  coords: { latitude: number; longitude: number; accuracy: number };
}
export interface LocationError {
  code: number;
  message: string;
}
export type LocationWatch = { kind: 'web'; id: number } | { kind: 'native'; id: string };
const options = { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 };
function normalizeError(error: unknown): LocationError {
  const e = error as { code?: string | number; message?: string };
  return {
    code:
      e.code === 1 || e.code === 'OS-PLUG-GLOC-0003'
        ? 1
        : e.code === 3 || e.code === 'OS-PLUG-GLOC-0010'
          ? 3
          : 2,
    message: e.message || 'Position indisponible',
  };
}
export function locationAvailable() {
  return Capacitor.isNativePlatform() || Boolean(navigator.geolocation);
}
export async function requestLocationPermission() {
  if (!Capacitor.isNativePlatform()) return;
  let result = await Geolocation.checkPermissions();
  if (result.location !== 'granted' && result.coarseLocation !== 'granted')
    result = await Geolocation.requestPermissions({ permissions: ['location'] });
  if (result.location !== 'granted' && result.coarseLocation !== 'granted')
    throw { code: 1, message: 'Géolocalisation refusée' };
}
export async function currentPosition(
  onPosition: (position: LocationPosition) => void,
  onError: (error: LocationError) => void,
) {
  try {
    if (Capacitor.isNativePlatform()) onPosition(await Geolocation.getCurrentPosition(options));
    else navigator.geolocation.getCurrentPosition(onPosition, onError, options);
  } catch (error) {
    onError(normalizeError(error));
  }
}
export async function watchPosition(
  onPosition: (position: LocationPosition) => void,
  onError: (error: LocationError) => void,
): Promise<LocationWatch> {
  if (Capacitor.isNativePlatform()) {
    const id = await Geolocation.watchPosition(
      { ...options, minimumUpdateInterval: 5000 },
      (position, error) => {
        if (error) onError(normalizeError(error));
        else if (position) onPosition(position);
      },
    );
    return { kind: 'native', id };
  }
  return { kind: 'web', id: navigator.geolocation.watchPosition(onPosition, onError, options) };
}
export function clearLocationWatch(watch: LocationWatch) {
  if (watch.kind === 'web') navigator.geolocation.clearWatch(watch.id);
  else void Geolocation.clearWatch({ id: watch.id }).catch(() => {});
}
