import type { NoFlyZone, TerrainPoint } from '../types';

export const mockNoFlyZones: NoFlyZone[] = [
  {
    id: 'nfz-1',
    name: '首都国际机场',
    center: [40.0799, 116.6031],
    radius: 8000,
    type: 'airport',
  },
  {
    id: 'nfz-2',
    name: '南苑军事区',
    center: [39.7833, 116.3833],
    radius: 5000,
    type: 'military',
  },
  {
    id: 'nfz-3',
    name: '中南海限制区',
    center: [39.9139, 116.3741],
    radius: 3000,
    type: 'restricted',
  },
];

export function generateMockTerrain(
  baseLat = 39.85,
  baseLng = 116.35,
  gridSize = 20,
  step = 0.005
): TerrainPoint[] {
  const points: TerrainPoint[] = [];
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = baseLat + i * step;
      const lng = baseLng + j * step;
      const elevation =
        50 +
        30 * Math.sin(i * 0.5) * Math.cos(j * 0.4) +
        20 * Math.sin(i * 0.3 + j * 0.2) +
        10 * Math.cos(i * 0.7 - j * 0.5);
      points.push({ lat, lng, elevation });
    }
  }
  return points;
}

export const mockTerrainData: TerrainPoint[] = generateMockTerrain();

export const defaultBounds = {
  minLat: 39.85,
  maxLat: 39.95,
  minLng: 116.35,
  maxLng: 116.45,
};
