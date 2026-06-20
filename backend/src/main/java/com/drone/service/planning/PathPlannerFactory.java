package com.drone.service.planning;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class PathPlannerFactory {

    private final Map<String, PathPlanner> planners = new HashMap<>();

    public PathPlannerFactory(List<PathPlanner> plannerList) {
        for (PathPlanner planner : plannerList) {
            planners.put(planner.getName(), planner);
        }
    }

    public PathPlanner getPlanner(String name) {
        PathPlanner planner = planners.get(name);
        if (planner == null) {
            throw new IllegalArgumentException(
                "Unknown path planner: " + name + ". Available: " + planners.keySet()
            );
        }
        return planner;
    }

    public Set<String> getAvailablePlanners() {
        return planners.keySet();
    }

    public void registerPlanner(PathPlanner planner) {
        planners.put(planner.getName(), planner);
    }
}
