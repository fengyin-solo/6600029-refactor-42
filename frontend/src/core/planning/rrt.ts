import type { Waypoint, NoFlyZone, PathPlanningResult, PathPlanner } from '../types';
import { haversine, generateId, isPointInNoFlyZone } from '../utils/geo';

interface RRTNode {
  lat: number;
  lng: number;
  parent: RRTNode | null;
}

export const rrtPlanner: PathPlanner = {
  name: 'rrt',

  plan(
    start: [number, number],
    goal: [number, number],
    noFlyZones: NoFlyZone[],
    _bounds: unknown,
    options?: Partial<{ maxIterations: number; stepSize: number; goalBias: number }>
  ): PathPlanningResult {
    const startTime = performance.now();
    const maxIter = options?.maxIterations ?? 500;
    const stepSize = options?.stepSize ?? 0.005;
    const goalBias = options?.goalBias ?? 0.1;

    const tree: RRTNode[] = [{ lat: start[0], lng: start[1], parent: null }];

    const nearest = (lat: number, lng: number): RRTNode => {
      let best = tree[0];
      let bestD = Infinity;
      for (const n of tree) {
        const d = (n.lat - lat) ** 2 + (n.lng - lng) ** 2;
        if (d < bestD) {
          bestD = d;
          best = n;
        }
      }
      return best;
    };

    let iterations = 0;

    for (let i = 0; i < maxIter; i++) {
      iterations++;
      let sampleLat: number, sampleLng: number;
      if (Math.random() < goalBias) {
        sampleLat = goal[0];
        sampleLng = goal[1];
      } else {
        sampleLat = start[0] + (goal[0] - start[0]) * (Math.random() * 2 - 0.5);
        sampleLng = start[1] + (goal[1] - start[1]) * (Math.random() * 2 - 0.5);
      }

      const near = nearest(sampleLat, sampleLng);
      const dx = sampleLat - near.lat;
      const dy = sampleLng - near.lng;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) continue;

      const newLat = near.lat + (dx / dist) * Math.min(stepSize, dist);
      const newLng = near.lng + (dy / dist) * Math.min(stepSize, dist);

      if (noFlyZones.some(z => isPointInNoFlyZone(newLat, newLng, z))) continue;

      const newNode: RRTNode = { lat: newLat, lng: newLng, parent: near };
      tree.push(newNode);

      if (haversine(newLat, newLng, goal[0], goal[1]) < 500) {
        const goalNode: RRTNode = { lat: goal[0], lng: goal[1], parent: newNode };
        tree.push(goalNode);

        const waypoints: Waypoint[] = [];
        let n: RRTNode | null = goalNode;
        let idx = 0;
        while (n) {
          waypoints.unshift({
            id: generateId(`wp-r-${idx++}`),
            lat: n.lat,
            lng: n.lng,
            altitude: 100,
            speed: 10,
            action: 'none',
          });
          n = n.parent;
        }

        return {
          waypoints,
          algorithm: 'rrt',
          iterations,
          planningTime: performance.now() - startTime,
        };
      }
    }

    return {
      waypoints: [
        { id: generateId('wp-rf'), lat: start[0], lng: start[1], altitude: 100, speed: 10, action: 'none' },
        { id: generateId('wp-rf'), lat: goal[0], lng: goal[1], altitude: 100, speed: 10, action: 'none' },
      ],
      algorithm: 'rrt-fallback',
      iterations,
      planningTime: performance.now() - startTime,
    };
  },
};
