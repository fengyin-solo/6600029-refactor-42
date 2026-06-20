import type {
  Waypoint,
  DroneConfig,
  SimulationState,
  SimulationOptions,
  FlightSimulator,
} from '../types';
import { haversine, interpolatePosition, lerp, createEventEmitter } from '../utils';

export function createFlightSimulator(): FlightSimulator {
  const emitter = createEventEmitter();
  let waypoints: Waypoint[] = [];
  let config: DroneConfig | null = null;
  let options: SimulationOptions = {};
  let timerId: ReturnType<typeof setInterval> | null = null;
  let startTime = 0;
  let pausedTime = 0;
  let totalDistance = 0;
  let segmentDistances: number[] = [];

  const state: SimulationState = {
    isRunning: false,
    progress: 0,
    currentPosition: [0, 0],
    currentAltitude: 0,
    currentSpeed: 0,
    currentWaypointIndex: 0,
    segmentProgress: 0,
    elapsedTime: 0,
    distanceTraveled: 0,
  };

  function calculateSegmentDistances(wps: Waypoint[]): number[] {
    const dists: number[] = [];
    let total = 0;
    for (let i = 1; i < wps.length; i++) {
      const d = haversine(wps[i - 1].lat, wps[i - 1].lng, wps[i].lat, wps[i].lng);
      dists.push(d);
      total += d;
    }
    totalDistance = total;
    return dists;
  }

  function updateStateFromProgress(progress: number): void {
    if (waypoints.length < 2) return;

    const totalWp = waypoints.length;
    const segIdx = Math.min(Math.floor(progress * (totalWp - 1)), totalWp - 2);
    const segProgress = (progress * (totalWp - 1)) - segIdx;
    const wp1 = waypoints[segIdx];
    const wp2 = waypoints[segIdx + 1];

    const [lat, lng] = interpolatePosition(wp1.lat, wp1.lng, wp2.lat, wp2.lng, segProgress);

    let distTraveled = 0;
    for (let i = 0; i < segIdx; i++) {
      distTraveled += segmentDistances[i];
    }
    distTraveled += segmentDistances[segIdx] * segProgress;

    state.progress = progress * 100;
    state.currentPosition = [lat, lng];
    state.currentAltitude = lerp(wp1.altitude, wp2.altitude, segProgress);
    state.currentSpeed = lerp(wp1.speed, wp2.speed, segProgress);
    state.currentWaypointIndex = segIdx;
    state.segmentProgress = segProgress;
    state.distanceTraveled = distTraveled;
  }

  function tick(): void {
    const elapsed = Date.now() - startTime - pausedTime;
    const speedMultiplier = options.speedMultiplier ?? 1;
    const realtime = options.realtime ?? false;

    let progress: number;
    if (realtime && config && totalDistance > 0) {
      const avgSpeed = waypoints.reduce((s, w) => s + w.speed, 0) / waypoints.length;
      const simulatedElapsed = (elapsed / 1000) * speedMultiplier;
      progress = Math.min(1, (avgSpeed * simulatedElapsed) / totalDistance);
      state.elapsedTime = simulatedElapsed;
    } else {
      progress = Math.min(1, (elapsed / 1000) * 0.02 * speedMultiplier);
      state.elapsedTime = elapsed / 1000;
    }

    updateStateFromProgress(progress);
    emitter.emit('update', { ...state });

    if (progress >= 1) {
      stop();
      emitter.emit('complete', undefined);
    }
  }

  function start(
    wps: Waypoint[],
    cfg: DroneConfig,
    opts: SimulationOptions = {}
  ): void {
    if (wps.length < 2) return;
    if (state.isRunning) return;

    waypoints = wps;
    config = cfg;
    options = opts;
    segmentDistances = calculateSegmentDistances(wps);
    startTime = Date.now();
    pausedTime = 0;

    state.isRunning = true;
    updateStateFromProgress(0);

    const interval = opts.tickInterval ?? 50;
    timerId = setInterval(tick, interval);

    emitter.emit('start', { waypoints: [...wps] });
  }

  function pause(): void {
    if (!state.isRunning || !timerId) return;
    clearInterval(timerId);
    timerId = null;
    state.isRunning = false;
    pausedTime += Date.now() - startTime;
    emitter.emit('pause', { ...state });
  }

  function resume(): void {
    if (state.isRunning || state.progress >= 100) return;
    startTime = Date.now();
    state.isRunning = true;
    const interval = options.tickInterval ?? 50;
    timerId = setInterval(tick, interval);
    emitter.emit('resume', { ...state });
  }

  function stop(): void {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    state.isRunning = false;
    emitter.emit('stop', { ...state });
  }

  function getState(): SimulationState {
    return { ...state };
  }

  function onUpdate(callback: (state: SimulationState) => void): () => void {
    return emitter.on('update', (e) => callback(e.payload as SimulationState));
  }

  function onComplete(callback: () => void): () => void {
    return emitter.on('complete', () => callback());
  }

  return { start, pause, resume, stop, getState, onUpdate, onComplete };
}
