import type { Waypoint, FlightPlan, NoFlyZone, TerrainPoint, DroneConfig } from "../../types";
export type { Waypoint, FlightPlan, NoFlyZone, TerrainPoint, DroneConfig };
export interface GeoBounds { minLat: number; maxLat: number; minLng: number; maxLng: number; }
export interface PathPlanningOptions { algorithm: "astar" | "rrt" | string; gridSize?: number; maxIterations?: number; smoothSegments?: number; }
export interface PathPlanningResult { waypoints: Waypoint[]; algorithm: string; iterations: number; planningTime: number; }
export interface PathPlanner { name: string; plan: (start: [number, number], goal: [number, number], noFlyZones: NoFlyZone[], bounds: GeoBounds, options?: Partial<PathPlanningOptions>) => PathPlanningResult; }
export interface PathSmoother { name: string; smooth: (waypoints: Waypoint[], segments?: number) => Waypoint[]; }
export interface SimulationState { isRunning: boolean; progress: number; currentPosition: [number, number]; currentAltitude: number; currentSpeed: number; currentWaypointIndex: number; segmentProgress: number; elapsedTime: number; distanceTraveled: number; }
export interface SimulationOptions { speedMultiplier?: number; tickInterval?: number; realtime?: boolean; }
export interface FlightSimulator { start: (waypoints: Waypoint[], config: DroneConfig, options?: SimulationOptions) => void; pause: () => void; resume: () => void; stop: () => void; getState: () => SimulationState; onUpdate: (callback: (state: SimulationState) => void) => () => void; onComplete: (callback: () => void) => () => void; }
export interface FlightStatistics { totalDistance: number; estimatedTime: number; batteryUsage: number; avgSpeed: number; maxAltitude: number; minAltitude: number; waypointCount: number; maxTurnAngle: number; }
export interface TerrainAnalysisResult { safe: boolean; minClearance: number; maxClearance: number; avgClearance: number; collisions: { wp: Waypoint; terrainElev: number; clearance: number }[]; warnings: { wp: Waypoint; terrainElev: number; clearance: number }[]; }
export interface TerrainProfilePoint { lat: number; lng: number; altitude: number; terrainElevation: number; clearance: number; distance: number; }
export interface FlightAnalyzer { calculateStats: (waypoints: Waypoint[], config: DroneConfig) => FlightStatistics; analyzeTerrain: (waypoints: Waypoint[], terrain: TerrainPoint[], safeDistance?: number) => TerrainAnalysisResult; generateTerrainProfile: (waypoints: Waypoint[], terrain: TerrainPoint[]) => TerrainProfilePoint[]; checkNoFlyZoneViolations: (waypoints: Waypoint[], noFlyZones: NoFlyZone[], buffer?: number) => { safe: boolean; violations: { wp: Waypoint; zone: NoFlyZone; distance: number }[] }; }
export interface ExportOptions { format: "kml" | "geojson" | "gpx"; name?: string; description?: string; includeWaypointActions?: boolean; }
export interface Exporter { export: (plan: FlightPlan, options: ExportOptions) => string; supportedFormats: string[]; }
export type ModuleEvent<T = unknown> = { type: string; payload: T; timestamp: number; };
export type EventHandler<T = unknown> = (event: ModuleEvent<T>) => void;
export interface EventEmitter { on: <T>(eventType: string, handler: EventHandler<T>) => () => void; emit: <T>(eventType: string, payload: T) => void; off: (eventType: string, handler: EventHandler) => void; }
