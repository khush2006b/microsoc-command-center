import crypto from "crypto";

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate realistic public IP addresses from various countries
export function randomIP() {
  const ipPools = [
    // USA - Common cloud providers and ISPs
    { prefix: [3, 4, 5, 6, 8, 11, 13, 15, 18, 20], range: [0, 255] },
    // China
    { prefix: [58, 59, 60, 61, 106, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125], range: [0, 255] },
    // Russia
    { prefix: [77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95], range: [0, 255] },
    // Germany
    { prefix: [62, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95], range: [0, 255] },
    // India
    { prefix: [103, 106, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123], range: [0, 255] },
    // Brazil
    { prefix: [177, 179, 186, 187, 189, 191, 200, 201], range: [0, 255] },
    // UK
    { prefix: [2, 5, 8, 31, 37, 46, 51, 62, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86], range: [0, 255] },
    // AWS (US/Global)
    { prefix: [3, 13, 18, 34, 35, 52, 54, 18, 23, 50, 52, 54, 107, 176], range: [0, 255] },
    // Google Cloud
    { prefix: [35, 34, 104, 130, 142, 146], range: [0, 255] },
    // Azure
    { prefix: [13, 20, 23, 40, 51, 52, 104, 137, 138, 191], range: [0, 255] },
  ];
  
  const pool = ipPools[randomInt(0, ipPools.length - 1)];
  const firstOctet = randomChoice(pool.prefix);
  
  return `${firstOctet}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
}

export function randomPort() {
  return randomInt(1, 65535);
}

export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

export function nowISO() {
  return new Date().toISOString();
}

export function randomUserAgent() {
  const agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "curl/7.68.0",
    "python-requests/2.25.1",
    "sqlmap/1.6.10",
    "Mozilla/5.0 (compatible; Googlebot/2.1)"
  ];
  return randomChoice(agents);
}
