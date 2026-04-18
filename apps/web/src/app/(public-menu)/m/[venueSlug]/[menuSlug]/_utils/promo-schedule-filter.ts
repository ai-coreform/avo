import type { PublicMenuPromotion } from "@/api/public-menu/types";

type PromotionSchedule = PublicMenuPromotion["schedules"][number];

function getNowInTimezone(timezone: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

function getWeekdayKey(timezone: string, now: Date): string {
  const weekdayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(now);

  const map: Record<string, string> = {
    Sun: "sun",
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
  };
  return map[weekdayStr] ?? "mon";
}

function isTimeInRange(
  currentTime: string,
  startTime: string | null,
  endTime: string | null
): boolean {
  if (!(startTime && endTime)) {
    return true;
  }
  return (
    currentTime >= startTime.slice(0, 5) && currentTime <= endTime.slice(0, 5)
  );
}

function isRecurringActive(
  schedule: PromotionSchedule,
  tz: string,
  now: Date
): boolean {
  const currentWeekday = getWeekdayKey(tz, now);
  if (currentWeekday !== schedule.weekday) {
    return false;
  }
  const { time } = getNowInTimezone(tz, now);
  return isTimeInRange(time, schedule.startTime, schedule.endTime);
}

function isDateRangeActive(
  schedule: PromotionSchedule,
  tz: string,
  now: Date
): boolean {
  const { date, time } = getNowInTimezone(tz, now);
  const currentDateTime = `${date}T${time}`;

  if (schedule.startDate) {
    const startSuffix = schedule.startTime
      ? `T${schedule.startTime.slice(0, 5)}`
      : "T00:00";
    if (currentDateTime < schedule.startDate + startSuffix) {
      return false;
    }
  }

  if (schedule.endDate) {
    const endSuffix = schedule.endTime
      ? `T${schedule.endTime.slice(0, 5)}`
      : "T23:59";
    if (currentDateTime > schedule.endDate + endSuffix) {
      return false;
    }
  }

  return true;
}

function isScheduleActive(schedule: PromotionSchedule, now: Date): boolean {
  const tz = schedule.timezone;

  if (schedule.weekday !== null) {
    return isRecurringActive(schedule, tz, now);
  }

  if (schedule.startDate || schedule.endDate) {
    return isDateRangeActive(schedule, tz, now);
  }

  return true;
}

/**
 * Determines if a promotion should be visible right now based on its schedules.
 * No schedules = always visible. Has schedules = visible if ANY is active.
 */
export function isPromotionVisible(
  promotion: PublicMenuPromotion,
  now: Date = new Date()
): boolean {
  if (promotion.schedules.length === 0) {
    return true;
  }
  return promotion.schedules.some((s) => isScheduleActive(s, now));
}
