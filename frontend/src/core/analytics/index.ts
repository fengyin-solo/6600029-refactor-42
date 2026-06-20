import type {
  Waypoint,
  DroneConfig,
  TerrainPoint,
  NoFlyZone,
  FlightStatistics,
  TerrainAnalysisResult,
  TerrainProfilePoint,
  FlightAnalyzer,
} from '../types';
import { haversine, calculatePathDistance, findNearestTerrainPoint, turnAngle } from '../utils';

export const flightAnalyzer: FlightAnalyzer = {
  calculateStats(waypoints: Waypoint[], config: DroneConfig): FlightStatistics {
    const totalDistance = calculatePathDistance(waypoints);
    const avgSpeed = waypoints.reduce((s, w) => s + w.speed, 0) / (waypoints.length || 1);
    const estimatedTime = totalDistance / (avgSpeed || 1);
    const flightMinutes = estimatedTime / 60;
    const batteryUsage = (flightMinutes * config.consumptionRate / config.batteryCapacity) * 100;

    let maxAltitude = 0;
    let minAltitude = Infinity;
    for (const wp of waypoints) {
      maxAltitude = Math.max(maxAltitude, wp.altitude);
      minAltitude = Math.min(minAltitude, wp.altitude);
    }

    let maxTurnAngle = 0;
    for (let i = 1; i < waypoints.length - 1; i++) {
      const angle = turnAngle(
        waypoints[i - 1].lat, waypoints[i - 1].lng,
        waypoints[i].lat, waypoints[i].lng,
        waypoints[i + 1].lat, waypoints[i + 1].lng
      );
      maxTurnAngle = Math.max(maxTurnAngle, angle);
    }

    return {
      totalDistance,
      estimatedTime,
      batteryUsage: Math.min(100, batteryUsage),
      avgSpeed,
      maxAltitude,
      minAltitude: minAltitude === Infinity ? 0 : minAltitude,
      waypointCount: waypoints.length,
      maxTurnAngle,
    };
  },

  analyzeTerrain(
    waypoints: Waypoint[],
    terrain: TerrainPoint[],
    safeDistance = 30
  ): TerrainAnalysisResult {
    const collisions: TerrainAnalysisResult['collisions'] = [];
    const warnings: TerrainAnalysisResult['warnings'] = [];
    let minClearance = Infinity;
    let maxClearance = -Infinity;
    let totalClearance = 0;

    for (const wp of waypoints) {
      const nearest = findNearestTerrainPoint(wp.lat, wp.lng, terrain);
      const clearance = wp.altitude - nearest.elevation;

      minClearance = Math.min(minClearance, clearance);
      maxClearance = Math.max(maxClearance, clearance);
      totalClearance += clearance;

      if (clearance < safeDistance) {
        collisions.push({ wp, terrainElev: nearest.elevation, clearance });
      } else if (clearance < safeDistance * 1.5) {
        warnings.push({ wp, terrainElev: nearest.elevation, clearance });
      }
    }

    return {
      safe: collisions.length === 0,
      minClearance: minClearance === Infinity ? 0 : minClearance,
      maxClearance: maxClearance === -Infinity ? 0 : maxClearance,
      avgClearance: waypoints.length > 0 ? totalClearance / waypoints.length : 0,
      collisions,
      warnings,
    };
  },

  generateTerrainProfile(
    waypoints: Waypoint[],
    terrain: TerrainPoint[]
  ): TerrainProfilePoint[] {
    const profile: TerrainProfilePoint[] = [];
    let cumulativeDistance = 0;

    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      const nearest = findNearestTerrainPoint(wp.lat, wp.lng, terrain);
      const clearance = wp.altitude - nearest.elevation;

      if (i > 0) {
        cumulativeDistance += haversine(
          waypoints[i - 1].lat, waypoints[i - 1].lng,
          wp.lat, wp.lng
        );
      }

      profile.push({
        lat: wp.lat,
        lng: wp.lng,
        altitude: wp.altitude,
        terrainElevation: nearest.elevation,
        clearance,
        distance: cumulativeDistance,
      });
    }

    return profile;
  },

  checkNoFlyZoneViolations(
    waypoints: Waypoint[],
    noFlyZones: NoFlyZone[],
    buffer = 0
  ): { safe: boolean; violations: { wp: Waypoint; zone: NoFlyZone; distance: number }[] } {
    const violations: { wp: Waypoint; zone: NoFlyZone; distance: number }[] = [];

    for (const wp of waypoints) {
      for (const zone of noFlyZones) {
        const d = haversine(wp.lat, wp.lng, zone.center[0], zone.center[1]);
        if (d < zone.radius + buffer) {
          violations.push({ wp, zone, distance: d });
        }
      }
    }

    return { safe: violations.length === 0, violations };
  },
};
