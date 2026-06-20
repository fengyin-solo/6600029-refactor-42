import type { Waypoint, NoFlyZone, GeoBounds, PathPlanningResult, PathPlanner } from '../types';
import { haversine, generateId, isPointInNoFlyZone } from '../utils/geo';

interface GridNode {
  lat: number;
  lng: number;
  row: number;
  col: number;
  g: number;
  h: number;
  f: number;
  parent: GridNode | null;
}

export const aStarPlanner: PathPlanner = {
  name: 'astar',

  plan(
    start: [number, number],
    goal: [number, number],
    noFlyZones: NoFlyZone[],
    bounds: GeoBounds,
    options?: Partial<{ gridSize: number; maxIterations: number }>
  ): PathPlanningResult {
    const startTime = performance.now();
    const gridSize = options?.gridSize ?? 30;
    const maxIterations = options?.maxIterations ?? 10000;

    const { minLat, maxLat, minLng, maxLng } = bounds;
    const rows = gridSize;
    const cols = gridSize;
    const dLat = (maxLat - minLat) / rows;
    const dLng = (maxLng - minLng) / cols;

    const toRow = (lat: number) => Math.round((lat - minLat) / dLat);
    const toCol = (lng: number) => Math.round((lng - minLng) / dLng);
    const toLat = (row: number) => minLat + row * dLat;
    const toLng = (col: number) => minLng + col * dLng;

    const startRow = Math.max(0, Math.min(rows - 1, toRow(start[0])));
    const startCol = Math.max(0, Math.min(cols - 1, toCol(start[1])));
    const goalRow = Math.max(0, Math.min(rows - 1, toRow(goal[0])));
    const goalCol = Math.max(0, Math.min(cols - 1, toCol(goal[1])));

    const heuristic = (r: number, c: number) =>
      haversine(toLat(r), toLng(c), goal[0], goal[1]);

    const open: GridNode[] = [];
    const closed = new Set<string>();

    const startNode: GridNode = {
      lat: toLat(startRow),
      lng: toLng(startCol),
      row: startRow,
      col: startCol,
      g: 0,
      h: heuristic(startRow, startCol),
      f: heuristic(startRow, startCol),
      parent: null,
    };
    open.push(startNode);

    const dirs = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1],
    ];

    let iterations = 0;
    let goalNode: GridNode | null = null;

    while (open.length > 0 && iterations < maxIterations) {
      iterations++;
      open.sort((a, b) => a.f - b.f);
      const current = open.shift()!;
      const key = `${current.row},${current.col}`;

      if (current.row === goalRow && current.col === goalCol) {
        goalNode = current;
        break;
      }

      closed.add(key);

      for (const [dr, dc] of dirs) {
        const nr = current.row + dr;
        const nc = current.col + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

        const nKey = `${nr},${nc}`;
        if (closed.has(nKey)) continue;

        const nLat = toLat(nr);
        const nLng = toLng(nc);
        if (noFlyZones.some(z => isPointInNoFlyZone(nLat, nLng, z))) continue;

        const moveCost = dr !== 0 && dc !== 0 ? 1.414 : 1;
        const g = current.g + moveCost * haversine(current.lat, current.lng, nLat, nLng);
        const h = heuristic(nr, nc);

        const existing = open.find((n) => n.row === nr && n.col === nc);
        if (existing) {
          if (g < existing.g) {
            existing.g = g;
            existing.f = g + h;
            existing.parent = current;
          }
        } else {
          open.push({ lat: nLat, lng: nLng, row: nr, col: nc, g, h, f: g + h, parent: current });
        }
      }
    }

    const waypoints: Waypoint[] = [];
    if (goalNode) {
      let n: GridNode | null = goalNode;
      let idx = 0;
      while (n) {
        waypoints.unshift({
          id: generateId(`wp-a-${idx++}`),
          lat: n.lat,
          lng: n.lng,
          altitude: 100,
          speed: 10,
          action: 'none',
        });
        n = n.parent;
      }
    } else {
      waypoints.push(
        { id: generateId('wp-fallback'), lat: start[0], lng: start[1], altitude: 100, speed: 10, action: 'none' },
        { id: generateId('wp-fallback'), lat: goal[0], lng: goal[1], altitude: 100, speed: 10, action: 'none' }
      );
    }

    return {
      waypoints,
      algorithm: 'astar',
      iterations,
      planningTime: performance.now() - startTime,
    };
  },
};
