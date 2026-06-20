package com.drone.service.common;

public class GeoUtils {

    private static final double EARTH_RADIUS = 6371000;

    private GeoUtils() {}

    public static double toRad(double degrees) {
        return Math.toRadians(degrees);
    }

    public static double haversine(double lat1, double lng1, double lat2, double lng2) {
        double dLat = toRad(lat2 - lat1);
        double dLng = toRad(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public static boolean isPointInNoFlyZone(
            double lat, double lng,
            double zoneLat, double zoneLng, double radius,
            double buffer) {
        double d = haversine(lat, lng, zoneLat, zoneLng);
        return d < radius + buffer;
    }

    public static String generateId(String prefix) {
        return prefix + "-" + System.currentTimeMillis() + "-" +
               Long.toHexString(Double.doubleToLongBits(Math.random()));
    }

    public static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }
}
