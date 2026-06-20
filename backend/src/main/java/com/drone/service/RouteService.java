package com.drone.service;

import com.drone.model.Waypoint;
import com.drone.service.analytics.FlightAnalyzer;
import com.drone.service.data.MockDataProvider;
import com.drone.service.export.KmlExporter;
import com.drone.service.planning.PathPlanner;
import com.drone.service.planning.PathPlannerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class RouteService {

    private final PathPlannerFactory plannerFactory;
    private final MockDataProvider dataProvider;
    private final KmlExporter kmlExporter;
    private final FlightAnalyzer flightAnalyzer;

    public RouteService(
            PathPlannerFactory plannerFactory,
            MockDataProvider dataProvider,
            KmlExporter kmlExporter,
            FlightAnalyzer flightAnalyzer) {
        this.plannerFactory = plannerFactory;
        this.dataProvider = dataProvider;
        this.kmlExporter = kmlExporter;
        this.flightAnalyzer = flightAnalyzer;
    }

    public List<Waypoint> planRoute(
            double startLat, double startLng,
            double goalLat, double goalLng,
            String algorithm) {

        PathPlanner planner = plannerFactory.getPlanner(algorithm);
        List<double[]> noFlyZones = dataProvider.getNoFlyZoneCoords();
        Map<String, Double> bounds = dataProvider.getDefaultBounds();

        PathPlanner.PathPlanningResult result = planner.plan(
            startLat, startLng, goalLat, goalLng,
            noFlyZones, bounds, Map.of("gridSize", 20)
        );

        return result.getWaypoints();
    }

    public List<Map<String, Object>> getNoFlyZones() {
        return dataProvider.getNoFlyZones();
    }

    public List<Map<String, Object>> getTerrain() {
        return dataProvider.getTerrain();
    }

    public String exportKML(List<Waypoint> waypoints, String name) {
        return kmlExporter.export(waypoints, name);
    }

    public Map<String, Object> calculateFlightStats(
            List<Waypoint> waypoints,
            Map<String, Object> droneConfig) {
        return flightAnalyzer.calculateStats(waypoints, droneConfig);
    }

    public List<String> getAvailableAlgorithms() {
        return List.copyOf(plannerFactory.getAvailablePlanners());
    }
}
