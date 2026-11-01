/**
 * File: src/lib/geoUtils.js
 * Tiện ích tính khoảng cách GPS dùng cho chấm công
 */

export function getDefaultAttendanceConfig() {
  return {
    store_latitude: Number(import.meta.env?.VITE_STORE_LATITUDE ?? 10.7769),
    store_longitude: Number(import.meta.env?.VITE_STORE_LONGITUDE ?? 106.7009),
    allowed_radius_meters: Number(import.meta.env?.VITE_STORE_RADIUS_METERS ?? 200),
    check_in_window_minutes: Number(import.meta.env?.VITE_CHECK_IN_WINDOW_MINUTES ?? 15),
  };
}

export function distanceInMeters(latitude1, longitude1, latitude2, longitude2) {
  if (
    latitude1 == null || isNaN(Number(latitude1)) ||
    longitude1 == null || isNaN(Number(longitude1)) ||
    latitude2 == null || isNaN(Number(latitude2)) ||
    longitude2 == null || isNaN(Number(longitude2))
  ) {
    return null;
  }
  const radians = (degrees) => degrees * (Math.PI / 180);
  const earthRadius = 6371000;
  const latitudeDelta = radians(latitude2 - latitude1);
  const longitudeDelta = radians(longitude2 - longitude1);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(latitude1)) *
      Math.cos(radians(latitude2)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function checkLocationWithinRadius(
  currentLatitude,
  currentLongitude,
  targetLatitude,
  targetLongitude,
  radiusMeters
) {
  let cLat = currentLatitude;
  let cLng = currentLongitude;
  let tLat = targetLatitude;
  let tLng = targetLongitude;
  let rMeters = radiusMeters;

  if (typeof currentLatitude === "object" && currentLatitude !== null) {
    cLat = currentLatitude.latitude ?? currentLatitude.lat;
    cLng = currentLatitude.longitude ?? currentLatitude.lng;
    const cfg = currentLongitude || getDefaultAttendanceConfig();
    tLat = cfg.store_latitude ?? cfg.latitude ?? cfg.officeCoords?.lat;
    tLng = cfg.store_longitude ?? cfg.longitude ?? cfg.officeCoords?.lng;
    rMeters = cfg.allowed_radius_meters ?? cfg.allowedRadiusMeters ?? cfg.radius ?? 200;
  }

  const distance = distanceInMeters(cLat, cLng, tLat, tLng);
  if (distance == null || isNaN(distance)) {
    return {
      allowed: false,
      distance_meters: null,
      allowed_radius_meters: Number(rMeters) || 200,
      missingCoordinates: true,
    };
  }

  return {
    allowed: distance <= rMeters,
    distance_meters: Math.round(distance),
    allowed_radius_meters: rMeters,
  };
}

export default {
  getDefaultAttendanceConfig,
  distanceInMeters,
  checkLocationWithinRadius,
};

