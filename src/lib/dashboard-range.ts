export type DashboardRangeKey = "7d" | "1m" | "3m" | "custom";

export type DashboardRange = {
  key: DashboardRangeKey;
  start: Date;
  end: Date;
  label: string;
  startInput: string;
  endInput: string;
  interval: "day" | "month";
};

type DashboardRangeParams = {
  range?: string;
  start?: string;
  end?: string;
};

const FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function subMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() - months);
  return next;
}

function parseDateInput(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return startOfDay(parsed);
}

function inputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function countDays(start: Date, end: Date) {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
}

export function resolveDashboardRange(params: DashboardRangeParams = {}, now = new Date()): DashboardRange {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const requested = params.range;
  const key: DashboardRangeKey =
    requested === "1m" || requested === "3m" || requested === "custom" ? requested : "7d";

  let start = addDays(today, -6);
  let end = tomorrow;
  let resolvedKey = key;

  if (key === "1m") {
    start = startOfDay(subMonths(today, 1));
  } else if (key === "3m") {
    start = startOfDay(subMonths(today, 3));
  } else if (key === "custom") {
    const customStart = parseDateInput(params.start);
    const customEnd = parseDateInput(params.end);
    if (customStart && customEnd && customStart <= customEnd) {
      start = customStart;
      end = addDays(customEnd, 1);
    } else {
      resolvedKey = "7d";
    }
  }

  const inclusiveEnd = addDays(end, -1);
  const days = countDays(start, end);

  return {
    key: resolvedKey,
    start,
    end,
    label: `${FORMATTER.format(start)} - ${FORMATTER.format(inclusiveEnd)}`,
    startInput: inputValue(start),
    endInput: inputValue(inclusiveEnd),
    interval: days > 120 ? "month" : "day",
  };
}
