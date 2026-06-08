import http from "k6/http";
import { check } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 50 },
    { duration: "3m", target: 50 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:3000";
const HEADERS = { "Content-Type": "application/json" };
const PRODUCT_IDS = (__ENV.PRODUCT_IDS || "p141-test-laptop-1,p141-test-laptop-2")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);
const PRODUCT_ID = __ENV.PRODUCT_ID || PRODUCT_IDS[0] || "p141-test-laptop-1";

function hasNoRetailPrice(response) {
  try {
    return !JSON.stringify(response.json()).includes("retailPrice");
  } catch {
    return false;
  }
}

function hasWaUrlWhenOk(response) {
  if (response.status === 404) return true;
  if (response.status !== 200) return false;
  try {
    return response.json("waUrl") !== undefined;
  } catch {
    return false;
  }
}

export default function apiContract() {
  let response = http.post(
    `${BASE}/api/products/saved`,
    JSON.stringify({ productIds: PRODUCT_IDS }),
    { headers: HEADERS },
  );
  check(response, {
    "saved API 200": (r) => r.status === 200,
    "no retailPrice in saved response": hasNoRetailPrice,
  });

  response = http.post(
    `${BASE}/api/products/batch`,
    JSON.stringify({ ids: PRODUCT_IDS.slice(0, 1) }),
    { headers: HEADERS },
  );
  check(response, {
    "batch API 200": (r) => r.status === 200,
    "no retailPrice in batch response": hasNoRetailPrice,
  });

  response = http.post(
    `${BASE}/api/inquiries/whatsapp`,
    JSON.stringify({ productId: PRODUCT_ID, sourcePage: "load-test" }),
    { headers: HEADERS },
  );
  check(response, {
    "inquiry returns waUrl or proper missing-product status": hasWaUrlWhenOk,
  });
}
