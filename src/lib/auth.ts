import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/db";

const buildTimeSecret = "build-time-secret-not-for-runtime";
const isNextBuild = process.env.NEXT_PHASE === "phase-production-build";

function userCode() {
  return `USR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export const auth = betterAuth({
  appName: "E-Katalog Komputer",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET ?? (isNextBuild ? buildTimeSecret : undefined),
  database: prismaAdapter(prisma, {
    provider: "mysql",
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
        required: false,
        defaultValue: "USER",
      },
      retailStatus: {
        type: "string",
        input: false,
        required: false,
        defaultValue: "REGISTERED",
      },
      whatsappNumber: {
        type: "string",
        required: false,
      },
      storeName: {
        type: "string",
        required: false,
      },
      address: {
        type: "string",
        required: false,
      },
      userCode: {
        type: "string",
        input: false,
        required: false,
        defaultValue: userCode,
      },
    },
  },
  plugins: [nextCookies()],
});
