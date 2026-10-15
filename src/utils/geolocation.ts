import { GeoLocationData } from '../types/recorder';

/**
 * High-Precision GPS Geolocation Service for RecForge II-like Field Audio Recording
 */

export async function getCurrentGPSPosition(): Promise<GeoLocationData> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by your browser or device.'));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 10000
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, altitude, accuracy, speed } = pos.coords;
        let placeName = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;

        try {
          // Attempt reverse geocoding via OpenStreetMap Nominatim with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
            {
              signal: controller.signal,
              headers: { 'Accept-Language': 'en' }
            }
          );
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            if (data && data.address) {
              const addr = data.address;
              const locality =
                addr.city ||
                addr.town ||
                addr.village ||
                addr.suburb ||
                addr.county ||
                addr.state;
              const country = addr.country;
              if (locality && country) {
                placeName = `${locality}, ${country}`;
              } else if (data.display_name) {
                placeName = data.display_name.split(',').slice(0, 2).join(',').trim();
              }
            }
          }
        } catch (err) {
          // Fallback to coordinates on network timeout or offline
          placeName = `${latitude >= 0 ? '+' : ''}${latitude.toFixed(4)}°, ${longitude >= 0 ? '+' : ''}${longitude.toFixed(4)}°`;
        }

        resolve({
          latitude,
          longitude,
          altitude: altitude !== null && !isNaN(altitude) ? Number(altitude.toFixed(1)) : null,
          accuracy: accuracy !== null && !isNaN(accuracy) ? Math.round(accuracy) : null,
          speed: speed !== null && !isNaN(speed) ? Number(speed.toFixed(1)) : null,
          timestamp: pos.timestamp || Date.now(),
          placeName
        });
      },
      (err) => {
        let msg = 'Unknown location error.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = 'GPS Geolocation access permission was denied by user.';
            break;
          case err.POSITION_UNAVAILABLE:
            msg = 'GPS satellite / network fix is currently unavailable.';
            break;
          case err.TIMEOUT:
            msg = 'GPS location request timed out.';
            break;
        }
        reject(new Error(msg));
      },
      options
    );
  });
}

export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}

export function getMapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

export function getOpenStreetMapUrl(lat: number, lon: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
}
