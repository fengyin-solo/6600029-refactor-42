import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type {
  Waypoint,
  NoFlyZone,
  TerrainPoint,
  FlightPlan,
  DroneConfig,
  SimulationState,
  TerrainProfilePoint,
} from '../types';
import { planRoute, createFlightSimulator } from '../core';
import { flightAnalyzer } from '../core/analytics';
import { flightExporter } from '../core/export';
import { mockNoFlyZones, generateMockTerrain, defaultBounds } from '../core/data';
import { generateId } from '../core/utils/geo';

export const useDroneStore = defineStore('drone', () => {
  const waypoints = ref<Waypoint[]>([]);
  const noFlyZones = ref<NoFlyZone[]>([]);
  const terrainData = ref<TerrainPoint[]>([]);
  const currentPlan = ref<FlightPlan | null>(null);
  const selectedAlgorithm = ref<'astar' | 'rrt'>('astar');
  const mapCenter = ref<[number, number]>([39.9, 116.4]);

  const droneConfig = ref<DroneConfig>({
    maxAltitude: 500,
    maxSpeed: 20,
    batteryCapacity: 5000,
    consumptionRate: 100,
    safeDistance: 30,
  });

  const simulator = createFlightSimulator();
  const simulationState = ref<SimulationState>(simulator.getState());

  simulator.onUpdate((state) => {
    simulationState.value = state;
  });

  function addWaypoint(
    lat: number,
    lng: number,
    altitude = 100,
    speed = 10,
    action: Waypoint['action'] = 'none'
  ) {
    waypoints.value.push({
      id: generateId('wp'),
      lat,
      lng,
      altitude,
      speed,
      action,
    });
  }

  function removeWaypoint(id: string) {
    waypoints.value = waypoints.value.filter((w) => w.id !== id);
  }

  function updateWaypoint(id: string, updates: Partial<Waypoint>) {
    const wp = waypoints.value.find((w) => w.id === id);
    if (wp) Object.assign(wp, updates);
  }

  function planRouteWrapper(start: [number, number], goal: [number, number]) {
    const result = planRoute(start, goal, noFlyZones.value, defaultBounds, {
      algorithm: selectedAlgorithm.value,
      gridSize: 30,
      smoothSegments: 5,
    });

    waypoints.value = result.smoothedWaypoints;
    updatePlan();
    return result;
  }

  function clearRoute() {
    waypoints.value = [];
    currentPlan.value = null;
    simulator.stop();
    simulationState.value = simulator.getState();
  }

  function updatePlan() {
    if (waypoints.value.length < 2) {
      currentPlan.value = null;
      return;
    }

    const stats = flightAnalyzer.calculateStats(waypoints.value, droneConfig.value);
    currentPlan.value = {
      id: generateId('plan'),
      name: 'Flight Plan',
      waypoints: [...waypoints.value],
      totalDistance: stats.totalDistance,
      estimatedTime: stats.estimatedTime,
      batteryUsage: stats.batteryUsage,
    };
  }

  function simulateFlight() {
    if (waypoints.value.length < 2 || simulationState.value.isRunning) return;
    simulator.start(waypoints.value, droneConfig.value, {
      speedMultiplier: 1,
      tickInterval: 50,
    });
  }

  function pauseSimulation() {
    simulator.pause();
  }

  function resumeSimulation() {
    simulator.resume();
  }

  function stopSimulation() {
    simulator.stop();
    simulationState.value = simulator.getState();
  }

  function loadMockData() {
    noFlyZones.value = mockNoFlyZones;
    terrainData.value = generateMockTerrain();
  }

  function exportPlan(format: 'kml' | 'geojson' | 'gpx' = 'kml'): string {
    if (!currentPlan.value) return '';
    return flightExporter.export(currentPlan.value, {
      format,
      name: currentPlan.value.name,
      includeWaypointActions: true,
    });
  }

  watch(
    () => waypoints.value.length,
    () => {
      if (waypoints.value.length >= 2) {
        updatePlan();
      }
    }
  );

  const isSimulating = computed(() => simulationState.value.isRunning);
  const simProgress = computed(() => simulationState.value.progress);
  const totalDistance = computed(() => currentPlan.value?.totalDistance ?? 0);
  const estimatedTime = computed(() => currentPlan.value?.estimatedTime ?? 0);
  const batteryPercent = computed(() => currentPlan.value?.batteryUsage ?? 0);

  const terrainProfile = computed((): TerrainProfilePoint[] => {
    if (waypoints.value.length < 2) return [];
    return flightAnalyzer.generateTerrainProfile(waypoints.value, terrainData.value);
  });

  const terrainAnalysis = computed(() => {
    if (waypoints.value.length < 2) return null;
    return flightAnalyzer.analyzeTerrain(
      waypoints.value,
      terrainData.value,
      droneConfig.value.safeDistance
    );
  });

  const noFlyZoneViolations = computed(() => {
    if (waypoints.value.length < 2) return null;
    return flightAnalyzer.checkNoFlyZoneViolations(
      waypoints.value,
      noFlyZones.value,
      0
    );
  });

  const flightStats = computed(() => {
    if (waypoints.value.length < 2) return null;
    return flightAnalyzer.calculateStats(waypoints.value, droneConfig.value);
  });

  return {
    waypoints,
    noFlyZones,
    terrainData,
    currentPlan,
    droneConfig,
    selectedAlgorithm,
    isSimulating,
    simProgress,
    simulationState,
    mapCenter,
    totalDistance,
    estimatedTime,
    batteryPercent,
    terrainProfile,
    terrainAnalysis,
    noFlyZoneViolations,
    flightStats,
    addWaypoint,
    removeWaypoint,
    updateWaypoint,
    planRoute: planRouteWrapper,
    clearRoute,
    simulateFlight,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
    loadMockData,
    exportPlan,
    updatePlan,
  };
});
