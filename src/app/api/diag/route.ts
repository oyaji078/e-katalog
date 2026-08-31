import net from "node:net";
import { NextResponse } from "next/server";

import { buildPoolConfig, describeDbError } from "@/lib/db";

// TEMPORARY diagnostic endpoint. Delete once the database connection is stable.
//
// Token-guarded. It reports the database HOST and the container's outbound IP
// so the connection path can be diagnosed from inside Hostinger's Node
// container -- something that cannot be observed from outside. It never returns
// the username, password or connection string.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN = "rama-diag-2026";

function tcpProbe(host: string, port: number, timeoutMs = 8000) {
  return new Promise<string>((resolve) => {
    const startedAt = Date.now();
    const socket = new net.Socket();
    const finish = (result: string) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(`OPEN (${Date.now() - startedAt}ms)`));
    socket.once("timeout", () => finish(`TIMEOUT after ${timeoutMs}ms`));
    socket.once("error", (e: NodeJS.ErrnoException) => finish(`FAILED: ${e.code ?? e.message}`));
    socket.connect(port, host);
  });
}

/** Real MySQL handshake against one host, reported as a safe category. */
async function mysqlProbe(host: string, port: number): Promise<string> {
  const raw = process.env.DATABASE_URL;
  if (!raw) return "skipped: DATABASE_URL not set";

  try {
    const mariadb = await import("mariadb");
    const base = buildPoolConfig(raw);
    const conn = await mariadb.createConnection({
      host,
      port,
      user: base.user,
      password: base.password,
      database: base.database,
      allowPublicKeyRetrieval: base.allowPublicKeyRetrieval,
      connectTimeout: 8000,
    });
    const rows = await conn.query("SELECT VERSION() AS v");
    await conn.end();
    return `CONNECTED (${rows[0].v})`;
  } catch (error) {
    return describeDbError(error);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("token") !== TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const raw = process.env.DATABASE_URL;
  const report: Record<string, unknown> = {
    commit: "pool-config-fix",
    nodeVersion: process.version,
    databaseUrlPresent: Boolean(raw),
  };

  if (!raw) {
    return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const config = buildPoolConfig(raw);
    report.dbHost = config.host;
    report.dbPort = config.port;
    report.dbName = config.database;
    report.passwordLength = config.password.length;
    report.pool = {
      connectionLimit: config.connectionLimit,
      acquireTimeoutMs: config.acquireTimeout,
      connectTimeoutMs: config.connectTimeout,
    };

    // Does the configured host work from inside this container?
    report.tcpConfiguredHost = await tcpProbe(config.host, config.port);
    report.mysqlConfiguredHost = await mysqlProbe(config.host, config.port);

    // If the app and MySQL share a host, loopback is the correct route and the
    // public hostname may be blocked by hairpin NAT. Test both so one deploy
    // settles which address this container should actually use.
    if (config.host !== "localhost" && config.host !== "127.0.0.1") {
      report.tcpLocalhost = await tcpProbe("127.0.0.1", config.port);
      report.mysqlLocalhost = await mysqlProbe("127.0.0.1", config.port);
    }
  } catch (e) {
    report.parseError = (e as Error).message;
  }

  // Control probe: proves outbound TCP works at all, so a failure above points
  // at port 3306 specifically rather than at blanket egress filtering.
  report.tcpControlPort443 = await tcpProbe("api.ipify.org", 443);

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
