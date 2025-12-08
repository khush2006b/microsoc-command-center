const geoData = {
  // US IPs
  '192.168.1.100': { country: 'United States', city: 'New York', lat: 40.7128, lon: -74.0060 },
  '10.0.0.50': { country: 'United States', city: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  '172.16.0.25': { country: 'United States', city: 'Chicago', lat: 41.8781, lon: -87.6298 },
  
  // International IPs
  '203.0.113.45': { country: 'China', city: 'Beijing', lat: 39.9042, lon: 116.4074 },
  '198.51.100.78': { country: 'Russia', city: 'Moscow', lat: 55.7558, lon: 37.6173 },
  '192.0.2.123': { country: 'United Kingdom', city: 'London', lat: 51.5074, lon: -0.1278 },
  '203.0.113.200': { country: 'Germany', city: 'Berlin', lat: 52.5200, lon: 13.4050 },
  '198.51.100.150': { country: 'France', city: 'Paris', lat: 48.8566, lon: 2.3522 },
  '192.0.2.88': { country: 'Japan', city: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  '203.0.113.99': { country: 'India', city: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  '198.51.100.44': { country: 'Brazil', city: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  '192.0.2.199': { country: 'Australia', city: 'Sydney', lat: -33.8688, lon: 151.2093 },
  '203.0.113.55': { country: 'Canada', city: 'Toronto', lat: 43.6532, lon: -79.3832 },
  '198.51.100.222': { country: 'South Korea', city: 'Seoul', lat: 37.5665, lon: 126.9780 },
  '192.0.2.33': { country: 'Netherlands', city: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
  '203.0.113.177': { country: 'Singapore', city: 'Singapore', lat: 1.3521, lon: 103.8198 },
  '198.51.100.111': { country: 'Spain', city: 'Madrid', lat: 40.4168, lon: -3.7038 },
  '192.0.2.66': { country: 'Italy', city: 'Rome', lat: 41.9028, lon: 12.4964 },
  '203.0.113.144': { country: 'Mexico', city: 'Mexico City', lat: 19.4326, lon: -99.1332 },
  '198.51.100.88': { country: 'South Africa', city: 'Cape Town', lat: -33.9249, lon: 18.4241 },
};

const cityPool = [
  { country: 'United States', city: 'New York', lat: 40.7128, lon: -74.0060 },
  { country: 'United States', city: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  { country: 'United States', city: 'San Francisco', lat: 37.7749, lon: -122.4194 },
  { country: 'United States', city: 'Seattle', lat: 47.6062, lon: -122.3321 },
  { country: 'United States', city: 'Miami', lat: 25.7617, lon: -80.1918 },
  { country: 'China', city: 'Beijing', lat: 39.9042, lon: 116.4074 },
  { country: 'China', city: 'Shanghai', lat: 31.2304, lon: 121.4737 },
  { country: 'Russia', city: 'Moscow', lat: 55.7558, lon: 37.6173 },
  { country: 'Russia', city: 'St. Petersburg', lat: 59.9343, lon: 30.3351 },
  { country: 'United Kingdom', city: 'London', lat: 51.5074, lon: -0.1278 },
  { country: 'Germany', city: 'Berlin', lat: 52.5200, lon: 13.4050 },
  { country: 'Germany', city: 'Munich', lat: 48.1351, lon: 11.5820 },
  { country: 'France', city: 'Paris', lat: 48.8566, lon: 2.3522 },
  { country: 'Japan', city: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { country: 'India', city: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { country: 'India', city: 'Delhi', lat: 28.7041, lon: 77.1025 },
  { country: 'Brazil', city: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  { country: 'Australia', city: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { country: 'Canada', city: 'Toronto', lat: 43.6532, lon: -79.3832 },
  { country: 'South Korea', city: 'Seoul', lat: 37.5665, lon: 126.9780 },
  { country: 'Netherlands', city: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
  { country: 'Singapore', city: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { country: 'Spain', city: 'Madrid', lat: 40.4168, lon: -3.7038 },
  { country: 'Italy', city: 'Rome', lat: 41.9028, lon: 12.4964 },
  { country: 'Mexico', city: 'Mexico City', lat: 19.4326, lon: -99.1332 },
  { country: 'South Africa', city: 'Cape Town', lat: -33.9249, lon: 18.4241 },
  { country: 'Turkey', city: 'Istanbul', lat: 41.0082, lon: 28.9784 },
  { country: 'UAE', city: 'Dubai', lat: 25.2048, lon: 55.2708 },
  { country: 'Poland', city: 'Warsaw', lat: 52.2297, lon: 21.0122 },
  { country: 'Sweden', city: 'Stockholm', lat: 59.3293, lon: 18.0686 },
];

function getRandomLocation() {
  return cityPool[Math.floor(Math.random() * cityPool.length)];
}

export function getGeoLocation(ip) {
  // Check if we have exact match
  if (geoData[ip]) {
    return geoData[ip];
  }
  
  // Return random location for unknown IPs
  return getRandomLocation();
}
