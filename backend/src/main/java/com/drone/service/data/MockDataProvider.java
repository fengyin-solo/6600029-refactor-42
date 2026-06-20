package com.drone.service.data;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class MockDataProvider {

    public List<Map<String, Object>> getNoFlyZones() {
        List<Map<String, Object>> zones = new ArrayList<>();
        zones.add(Map.of(
            "id", "nfz-1", "name", "首都国际机场",
            "center", List.of(40.0799, 116.6031), "radius", 8000, "type", "airport"
        ));
        zones.add(Map.of(
            "id", "nfz-2", "name", "南苑军事区",
            "center", List.of(39.7833, 116.3833), "radius", 5000, "type", "military"
        ));
        zones.add(Map.of(
            "id", "nfz-3", "name", "中南海限制区",
            "center", List.of(39.9139, 116.3741), "radius", 3000, "type", "restricted"
        ));
        return zones;
    }

    public List<double[]> getNoFlyZoneCoords() {
        return List.of(
            new double[]{40.0799, 116.6031, 8000},
            new double[]{39.7833, 116.3833, 5000},
            new double[]{39.9139, 116.3741, 3000}
        );
    }

    public List<Map<String, Object>> getTerrain() {
        return generateTerrain(39.85, 116.35, 20, 0.005);
    }

    public List<Map<String, Object>> generateTerrain(
            double baseLat, double baseLng, int gridSize, double step) {
        List<Map<String, Object>> terrain = new ArrayList<>();
        for (int i = 0; i < gridSize; i++) {
            for (int j = 0; j < gridSize; j++) {
                double lat = baseLat + i * step;
                double lng = baseLng + j * step;
                double elevation = 50 +
                    30 * Math.sin(i * 0.5) * Math.cos(j * 0.4) +
                    20 * Math.sin(i * 0.3 + j * 0.2) +
                    10 * Math.cos(i * 0.7 - j * 0.5);
                terrain.add(Map.of("lat", lat, "lng", lng, "elevation", elevation));
            }
        }
        return terrain;
    }

    public Map<String, Double> getDefaultBounds() {
        return Map.of(
            "minLat", 39.85,
            "maxLat", 39.95,
            "minLng", 116.35,
            "maxLng", 116.45
        );
    }
}
