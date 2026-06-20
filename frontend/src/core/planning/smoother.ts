import type { Waypoint, PathSmoother } from '../types';
import { generateId } from '../utils/geo';

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

export const catmullRomSmoother: PathSmoother = {
  name: 'catmull-rom',

  smooth(waypoints: Waypoint[], segments = 5): Waypoint[] {
    if (waypoints.length < 3) return [...waypoints];

    const result: Waypoint[] = [{ ...waypoints[0], id: generateId('wp-smooth') }];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const p0 = waypoints[Math.max(0, i - 1)];
      const p1 = waypoints[i];
      const p2 = waypoints[Math.min(waypoints.length - 1, i + 1)];
      const p3 = waypoints[Math.min(waypoints.length - 1, i + 2)];

      for (let s = 1; s <= segments; s++) {
        const t = s / segments;
        result.push({
          id: generateId('wp-smooth'),
          lat: catmullRom(p0.lat, p1.lat, p2.lat, p3.lat, t),
          lng: catmullRom(p0.lng, p1.lng, p2.lng, p3.lng, t),
          altitude: catmullRom(p0.altitude, p1.altitude, p2.altitude, p3.altitude, t),
          speed: catmullRom(p0.speed, p1.speed, p2.speed, p3.speed, t),
          action: p1.action,
        });
      }
    }

    return result;
  },
};
