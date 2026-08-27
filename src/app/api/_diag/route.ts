import net from "node:net";
import { NextResponse } from "next/server";

// TEMPORARY diagnostic endpoint. Delete once the database connection works.
// Guarded by a token so it is not readable by the public. It never returns the
// database password -- only the host, and whether a raw TCP connection to it
// can be opened from inside this container.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN = "rama-diag-2026";

function tcpProbe(host: string, port: number, timeoutMs = 8000) {
  return new Promise<string>((resolve) => {
    const started = Date.now();
    const socket = new net.Socket();
    const finish = (result: string) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(`OPEN (${Date.now() - started}ms)`));
    socket.once("timeout", () => finish(`TIMEOUT after ${timeoutMs}ms`));
    socket.once("error", (e: NodeJS.ErrnoException) =>
      finish(`FAILED: ${e.code ?? e.message}`),
    );
    socket.connect(port, host);
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("token") !== TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const raw = process.env.DATABASE_URL;
  const report: Record<string, unknown> = {
    databaseUrlPresent: Boolean(raw),
    nodeVersion: process.version,
  };

  if (raw) {
    try {
      const parsed = new URL(raw);
      report.dbHost = parsed.hostname;
      report.dbPort = parsed.port || "3306";
      report.dbUser = parsed.username;
      report.dbName = parsed.pathname.replace(/^\//, "");
      report.dbPasswordLength = decodeURIComponent(parsed.password || "").length;

      // Can this container open a socket to the database at all?
      report.tcpToDatabase = await tcpProbe(
        parsed.hostname,
        Number(parsed.port || 3306),
      );
    } catch (e) {
      report.parseError = (e as Error).message;
    }
  }

  // Control probe: proves outbound TCP works in general, so a failure above
  // points at port 3306 specifically rather than at all egress.
  report.tcpToPort443 = await tcpProbe("api.ipify.org", 443);

  // The container's outbound address -- this is what would need whitelisting
  // in hPanel -> Databases -> Remote MySQL.
  try {
    const res = await fetch("https://api.ipify.org?format=json", {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    report.outboundIp = (await res.json()).ip;
  } catch (e) {
    report.outboundIp = `could not determine: ${(e as Error).message}`;
  }

  return NextResponse.json(report, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
