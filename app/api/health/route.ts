import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const processStart = Date.now();

export async function GET(): Promise<NextResponse> {
  const now = new Date();
  const dbStart = performance.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Math.round(performance.now() - dbStart);

    const response = NextResponse.json({
      status: "ok",
      timestamp: now.toISOString(),
      uptimeSec: Math.floor((Date.now() - processStart) / 1000),
      version: process.env.npm_package_version ?? "unknown",
      checks: {
        database: {
          status: "ok",
          latencyMs: dbLatencyMs,
        },
      },
    });

    response.headers.set("cache-control", "no-store");
    return response;
  } catch {
    const response = NextResponse.json(
      {
        status: "degraded",
        timestamp: now.toISOString(),
        uptimeSec: Math.floor((Date.now() - processStart) / 1000),
        version: process.env.npm_package_version ?? "unknown",
        checks: {
          database: {
            status: "error",
          },
        },
      },
      { status: 503 },
    );

    response.headers.set("cache-control", "no-store");
    return response;
  }
}
