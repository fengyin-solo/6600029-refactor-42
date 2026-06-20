export const EARTH_RADIUS = 6371000;

export function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function toDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = toRad(lng2 - lng1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function turnAngle(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
  lat3: number, lng3: number
): number {
  const b1 = bearing(lat1, lng1, lat2, lng2);
  const b2 = bearing(lat2, lng2, lat3, lng3);
  let diff = Math.abs(b2 - b1);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

export function interpolatePosition(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
  t: number
): [number, number] {
  return [
    lat1 + (lat2 - lat1) * t,
    lng1 + (lng2 - lng1) * t,
  ];
}

export function findNearestTerrainPoint(
  lat: number, lng: number,
  terrain: { lat: number; lng: number; elevation: number }[]
): { lat: number; lng: number; elevation: number; distance: number } {
  let nearest = terrain[0];
  let minDist = Infinity;
  for (const tp of terrain) {
    const d = haversine(lat, lng, tp.lat, tp.lng);
    if (d < minDist) {
      minDist = d;
      nearest = tp;
    }
  }
  return { ...nearest, distance: minDist };
}

export function calculatePathDistance<T extends { lat: number; lng: number }>(
  points: T[]
): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversine(
      points[i - 1].lat, points[i - 1].lng,
      points[i].lat, points[i].lng
    );
  }
  return total;
}

export function isPointInNoFlyZone(
  lat: number, lng: number,
  zone: { center: [number, number]; radius: number },
  buffer = 0
): boolean {
  const d = haversine(lat, lng, zone.center[0], zone.center[1]);
  return d < zone.radius + buffer;
}

export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
