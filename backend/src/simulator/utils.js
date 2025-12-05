import crypto from "crypto";

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomIP() {
  return `${randomInt(1, 254)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
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
