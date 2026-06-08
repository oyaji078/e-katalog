import { NextResponse } from "next/server";

/**
 * Consistent JSON error envelope for API routes: `{ error: string }`.
 * Keeps public endpoints uniform (e.g. /api/products/saved and /api/products/batch
 * both reject invalid input with this shape instead of silently degrading).
 */
export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** 400 Bad Request with the shared error shape. */
export function badRequest(message = "Invalid request"): NextResponse {
  return jsonError(message, 400);
}
