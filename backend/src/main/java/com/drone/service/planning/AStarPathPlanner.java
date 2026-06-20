package com.drone.service.planning;

import com.drone.model.Waypoint;
import com.drone.service.common.GeoUtils;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class AStarPathPlanner implements PathPlanner {

    @Override
    public String getName() {
        return "astar";
    }

    @Override
    public PathPlanningResult plan(
            double startLat, double startLng,
            double goalLat, double goalLng,
            List<double[]> noFlyZones,
            Map<String, Double> bounds,
            Map<String, Object> options) {

        long startTime = System.currentTimeMillis();
        int gridSize = (int) options.getOrDefault("gridSize", 20);

        double minLat = bounds.get("minLat");
        double maxLat = bounds.get("maxLat");
        double minLng = bounds.get("minLng");
        double maxLng = bounds.get("maxLng");
        double dLat = (maxLat - minLat) / gridSize;
        double dLng = (maxLng - minLng) / gridSize;

        int startRow = (int) GeoUtils.clamp((startLat - minLat) / dLat, 0, gridSize - 1);
        int startCol = (int) GeoUtils.clamp((startLng - minLng) / dLng, 0, gridSize - 1);
        int goalRow = (int) GeoUtils.clamp((goalLat - minLat) / dLat, 0, gridSize - 1);
        int goalCol = (int) GeoUtils.clamp((goalLng - minLng) / dLng, 0, gridSize - 1);

        int[][] g = new int[gridSize][gridSize];
        int[][] parent = new int[gridSize][gridSize];
        for (int[] row : g) Arrays.fill(row, Integer.MAX_VALUE);
        for (int[] row : parent) Arrays.fill(row, -1);

        boolean[][] blocked = buildBlockedGrid(gridSize, minLat, minLng, dLat, dLng, noFlyZones);

        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[2] - b[2]);
        g[startRow][startCol] = 0;
        pq.offer(new int[]{startRow, startCol, heuristic(startRow, startCol, goalRow, goalCol)});

        int[][] dirs = {{-1,0},{1,0},{0,-1},{0,1},{-1,-1},{-1,1},{1,-1},{1,1}};
        int iterations = 0;

        while (!pq.isEmpty()) {
            iterations++;
            int[] curr = pq.poll();
            int cr = curr[0], cc = curr[1];

            if (cr == goalRow && cc == goalCol) break;

            for (int[] d : dirs) {
                int nr = cr + d[0], nc = cc + d[1];
                if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
                if (blocked[nr][nc]) continue;

                int cost = (d[0] != 0 && d[1] != 0) ? 14 : 10;
                int newG = g[cr][cc] + cost;
                if (newG < g[nr][nc]) {
                    g[nr][nc] = newG;
                    parent[nr][nc] = cr * gridSize + cc;
                    int h = heuristic(nr, nc, goalRow, goalCol);
                    pq.offer(new int[]{nr, nc, newG + h});
                }
            }
        }

        List<Waypoint> path = reconstructPath(
            parent, gridSize, startRow, startCol, goalRow, goalCol,
            minLat, minLng, dLat, dLng, startLat, startLng, goalLat, goalLng
        );

        return new PathPlanningResult(
            path, getName(), iterations, System.currentTimeMillis() - startTime
        );
    }

    private boolean[][] buildBlockedGrid(int gridSize, double minLat, double minLng,
                                         double dLat, double dLng, List<double[]> noFlyZones) {
        boolean[][] blocked = new boolean[gridSize][gridSize];
        for (double[] zone : noFlyZones) {
            for (int r = 0; r < gridSize; r++) {
                for (int c = 0; c < gridSize; c++) {
                    double lat = minLat + r * dLat;
                    double lng = minLng + c * dLng;
                    if (GeoUtils.isPointInNoFlyZone(lat, lng, zone[0], zone[1], zone[2], 0)) {
                        blocked[r][c] = true;
                    }
                }
            }
        }
        return blocked;
    }

    private int heuristic(int r1, int c1, int r2, int c2) {
        return (int) (Math.sqrt((r1 - r2) * (r1 - r2) + (c1 - c2) * (c1 - c2)) * 10);
    }

    private List<Waypoint> reconstructPath(
            int[][] parent, int gridSize,
            int startRow, int startCol, int goalRow, int goalCol,
            double minLat, double minLng, double dLat, double dLng,
            double startLat, double startLng, double goalLat, double goalLng) {

        List<int[]> rawPath = new ArrayList<>();
        int r = goalRow, c = goalCol;
        while (r != startRow || c != startCol) {
            rawPath.add(0, new int[]{r, c});
            int p = parent[r][c];
            if (p == -1) break;
            r = p / gridSize;
            c = p % gridSize;
        }
        rawPath.add(0, new int[]{startRow, startCol});

        List<Waypoint> path = new ArrayList<>();
        int idx = 0;
        for (int[] p : rawPath) {
            double lat = minLat + p[0] * dLat;
            double lng = minLng + p[1] * dLng;
            path.add(new Waypoint(GeoUtils.generateId("wp"), lat, lng, 100, 10, "none"));
        }

        if (path.isEmpty()) {
            path.add(new Waypoint(GeoUtils.generateId("wp"), startLat, startLng, 100, 10, "none"));
            path.add(new Waypoint(GeoUtils.generateId("wp"), goalLat, goalLng, 100, 10, "none"));
        }

        return path;
    }
}
