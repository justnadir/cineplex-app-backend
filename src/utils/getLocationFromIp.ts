import geoip from "geoip-lite";
import { Request } from "express";

export function getLocationFromIp(ip: string) {
  const geo = geoip.lookup(ip);

  if (!geo) {
    return { city: "Unknown", country: "Unknown" };
  }

  return {
    city: geo.city || "Unknown",
    country: geo.country || "Unknown",
  };
}

export function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers["x-forwarded-for"] as string;

  let ip = forwarded
    ? forwarded?.split(",")[0]?.trim()
    : req.socket.remoteAddress || "Unknown";

  if (ip?.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return ip;
}
