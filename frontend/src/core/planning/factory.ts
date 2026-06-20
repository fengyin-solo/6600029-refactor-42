import type {
  PathPlanner,
  PathSmoother,
  PathPlanningOptions,
  PathPlanningResult,
  Waypoint,
  NoFlyZone,
  GeoBounds,
} from '../types';
import { aStarPlanner } from './astar';
import { rrtPlanner } from './rrt';
import { catmullRomSmoother } from './smoother';

const planners = new Map<string, PathPlanner>();
const smoothers = new Map<string, PathSmoother>();

planners.set('astar', aStarPlanner);
planners.set('rrt', rrtPlanner);
smoothers.set('catmull-rom', catmullRomSmoother);

export function registerPlanner(planner: PathPlanner): void {
  planners.set(planner.name, planner);
}

export function registerSmoother(smoother: PathSmoother): void {
  smoothers.set(smoother.name, smoother);
}

export function getPlanner(name: string): PathPlanner {
  const planner = planners.get(name);
  if (!planner) {
    throw new Error(`Unknown path planner: ${name}. Available: ${[...planners.keys()].join(', ')}`);
  }
  return planner;
}

export function getSmoother(name: string): PathSmoother {
  const smoother = smoothers.get(name);
  if (!smoother) {
    throw new Error(`Unknown path smoother: ${name}. Available: ${[...smoothers.keys()].join(', ')}`);
  }
  return smoother;
}

export function getAvailablePlanners(): string[] {
  return [...planners.keys()];
}

export function getAvailableSmoothers(): string[] {
  return [...smoothers.keys()];
}

export function planRoute(
  start: [number, number],
  goal: [number, number],
  noFlyZones: NoFlyZone[],
  bounds: GeoBounds,
  options: PathPlanningOptions
): {
  planningResult: PathPlanningResult;
  smoothedWaypoints: Waypoint[];
} {
  const planner = getPlanner(options.algorithm);
  const planningResult = planner.plan(start, goal, noFlyZones, bounds, options);

  let smoothedWaypoints = planningResult.waypoints;
  if (options.smoothSegments && options.smoothSegments > 0) {
    const smoother = getSmoother('catmull-rom');
    smoothedWaypoints = smoother.smooth(planningResult.waypoints, options.smoothSegments);
  }

  return { planningResult, smoothedWaypoints };
}
