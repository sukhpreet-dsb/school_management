/**
 * Geolocation & Geofencing helper for School Management
 */

export const DEFAULT_SCHOOL_CONFIG = {
  latitude: 30.674404,
  longitude: 76.740797,
  radiusMeters: 500, // 500m geofence radius
  name: 'Central School Campus',
};

export function getSchoolCoordinates() {
  const lat = process.env.NEXT_PUBLIC_SCHOOL_LATITUDE
    ? parseFloat(process.env.NEXT_PUBLIC_SCHOOL_LATITUDE)
    : DEFAULT_SCHOOL_CONFIG.latitude;
  const lng = process.env.NEXT_PUBLIC_SCHOOL_LONGITUDE
    ? parseFloat(process.env.NEXT_PUBLIC_SCHOOL_LONGITUDE)
    : DEFAULT_SCHOOL_CONFIG.longitude;
  const radius = process.env.NEXT_PUBLIC_SCHOOL_RADIUS_METERS
    ? parseFloat(process.env.NEXT_PUBLIC_SCHOOL_RADIUS_METERS)
    : DEFAULT_SCHOOL_CONFIG.radiusMeters;

  return {
    latitude: isNaN(lat) ? DEFAULT_SCHOOL_CONFIG.latitude : lat,
    longitude: isNaN(lng) ? DEFAULT_SCHOOL_CONFIG.longitude : lng,
    radiusMeters: isNaN(radius) ? DEFAULT_SCHOOL_CONFIG.radiusMeters : radius,
  };
}

/**
 * Calculates distance between two coordinates in meters using the Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Checks if a given coordinate is within the campus radius
 */
export function checkCampusGeofence(
  userLat: number,
  userLng: number,
  overrideRadius?: number
) {
  const school = getSchoolCoordinates();
  const radius = overrideRadius ?? school.radiusMeters;
  const distance = calculateDistanceMeters(
    userLat,
    userLng,
    school.latitude,
    school.longitude
  );

  return {
    isInside: distance <= radius,
    distanceMeters: distance,
    schoolLatitude: school.latitude,
    schoolLongitude: school.longitude,
    maxRadiusMeters: radius,
  };
}

/**
 * Generates a Google Maps link for a coordinate
 */
export function getGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}
