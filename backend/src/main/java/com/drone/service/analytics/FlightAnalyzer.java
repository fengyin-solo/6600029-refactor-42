package com.drone.service.analytics;

import com.drone.model.Waypoint;
import com.drone.service.common.GeoUtils;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class FlightAnalyzer {

    public Map<String, Object> calculateStats(List<Waypoint> waypoints,
                                              Map<String, Object> droneConfig) {
        double totalDistance = 0;
        for (int i = 1; i < waypoints.size(); i++) {
            totalDistance += GeoUtils.haversine(
                waypoints.get(i - 1).getLat(), waypoints.get(i - 1).getLng(),
                waypoints.get(i).getLat(), waypoints.get(i).getLng()
            );
        }

        double avgSpeed = waypoints.stream()
            .mapToDouble(Waypoint::getSpeed)
            .average()
            .orElse(0);

        double estimatedTime = totalDistance / (avgSpeed > 0 ? avgSpeed : 1);
        double flightMinutes = estimatedTime / 60;

        double batteryCapacity = ((Number) droneConfig.getOrDefault("batteryCapacity", 5000)).doubleValue();
        double consumptionRate = ((Number) droneConfig.getOrDefault("consumptionRate", 100)).doubleValue();
        double batteryUsage = (flightMinutes * consumptionRate / batteryCapacity) * 100;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDistance", totalDistance);
        stats.put("estimatedTime", estimatedTime);
        stats.put("batteryUsage", Math.min(100, batteryUsage));
        stats.put("avgSpeed", avgSpeed);
        stats.put("waypointCount", waypoints.size());

        return stats;
    }
}
