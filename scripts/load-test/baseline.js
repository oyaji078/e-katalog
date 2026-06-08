import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const catalogTime = new Trend("catalog_duration");
const homeTime = new Trend("home_duration");
const detailTime = new Trend("detail_duration");

export const options = {
  stages: [
    { duration: "1m", target: 25 },
    { duration: "8m", target: 25 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<800"],
    http_req_failed: ["rate<0.01"],
    errors: ["rate<0.01"],
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:3000";
const PRODUCT_SLUG = __ENV.PRODUCT_SLUG || "p141-test-laptop-1";

function record(response, trend, label) {
  trend.add(response.timings.duration);
  const ok = check(response, { [`${label} 200`]: (r) => r.status === 200 });
  errorRate.add(!ok);
}

export default function baseline() {
  let response = http.get(`${BASE}/`);
  record(response, homeTime, "home");
  sleep(1);

  response = http.get(`${BASE}/products`);
  record(response, catalogTime, "catalog");
  sleep(1);

  response = http.get(`${BASE}/products?search=produk&sort=price_asc&page=1`);
  const filterOk = check(response, { "catalog filter 200": (r) => r.status === 200 });
  errorRate.add(!filterOk);
  sleep(1);

  response = http.get(`${BASE}/products/${encodeURIComponent(PRODUCT_SLUG)}`);
  record(response, detailTime, "detail");
  sleep(2);
}
