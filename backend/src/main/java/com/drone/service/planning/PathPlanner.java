package com.drone.service.planning;

import com.drone.model.Waypoint;
import java.util.List;
import java.util.Map;

public interface PathPlanner {
    String getName();
    PathPlanningResult plan(
            double startLat, double startLng,
            double goalLat, double goalLng,
            List<double[]> noFlyZones,
            Map<String, Double> bounds,
            Map<String, Object> options
    );

    class PathPlanningResult {
        private final List<Waypoint> waypoints;
        private final String algorithm;
        private final int iterations;
        private final long planningTimeMs;

        public PathPlanningResult(List<Waypoint> waypoints, String algorithm,
                                  int iterations, long planningTimeMs) {
            this.waypoints = waypoints;
            this.algorithm = algorithm;
            this.iterations = iterations;
            this.planningTimeMs = planningTimeMs;
        }

        public List<Waypoint> getWaypoints() { return waypoints; }
        public String getAlgorithm() { return algorithm; }
        public int getIterations() { return iterations; }
        public long getPlanningTimeMs() { return planningTimeMs; }
    }
}
