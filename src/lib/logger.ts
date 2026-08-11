import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Structured logger using pino.
 *
 * - In dev: pretty-prints via pino/file built-in transport.
 * - In production: outputs newline-delimited JSON to stdout.
 * - Secrets (cookie, authorization, password, token, pin, otp) are redacted.
 */
export const logger = pino({
  level: isDev ? "debug" : "info",
  ...(isDev
    ? { transport: { target: "pino/file", options: { destination: 1 } } }
    : {}),
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      "body.password",
      "body.token",
      "body.secret",
      "body.pin",
      "body.otp",
    ],
    censor: "[REDACTED]",
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      ip: req.ip,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
});
