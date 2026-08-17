export type BusinessHoursDay = {
  day: number; // 0 = Sonntag ... 6 = Samstag (entspricht Date#getDay())
  closed: boolean;
  open: string; // "HH:MM"
  close: string; // "HH:MM"
};

export const BUSINESS_HOURS_TIMEZONE = "Europe/Berlin";

export function getDefaultBusinessHours(): BusinessHoursDay[] {
  return [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    closed: day === 0,
    open: "08:00",
    close: "18:00",
  }));
}

function isValidTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function normalizeBusinessHours(value: unknown): BusinessHoursDay[] {
  const defaults = getDefaultBusinessHours();

  if (!Array.isArray(value)) {
    return defaults;
  }

  return defaults.map((fallback) => {
    const match = value.find(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        Number((entry as { day?: unknown }).day) === fallback.day,
    ) as Partial<BusinessHoursDay> | undefined;

    if (!match) {
      return fallback;
    }

    return {
      day: fallback.day,
      closed: typeof match.closed === "boolean" ? match.closed : fallback.closed,
      open: isValidTime(match.open) ? match.open : fallback.open,
      close: isValidTime(match.close) ? match.close : fallback.close,
    };
  });
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getLocalParts(now: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const weekdayShort = parts.find((part) => part.type === "weekday")?.value || "Sun";
  const hour = Number(parts.find((part) => part.type === "hour")?.value || "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value || "0");

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    day: weekdayMap[weekdayShort] ?? 0,
    minutesSinceMidnight: (hour === 24 ? 0 : hour) * 60 + minute,
  };
}

export type NextOpening = {
  day: number;
  open: string;
};

export type ShopOpenStatus = {
  isOpen: boolean;
  currentDay: number;
  nextOpening: NextOpening | null;
};

export function getShopOpenStatus(
  businessHoursEnabled: boolean,
  businessHoursRaw: unknown,
  now: Date = new Date(),
  timeZone: string = BUSINESS_HOURS_TIMEZONE,
): ShopOpenStatus {
  const { day, minutesSinceMidnight } = getLocalParts(now, timeZone);

  if (!businessHoursEnabled) {
    return { isOpen: true, currentDay: day, nextOpening: null };
  }

  const schedule = normalizeBusinessHours(businessHoursRaw);
  const today = schedule.find((entry) => entry.day === day);

  if (
    today &&
    !today.closed &&
    minutesSinceMidnight >= timeToMinutes(today.open) &&
    minutesSinceMidnight < timeToMinutes(today.close)
  ) {
    return { isOpen: true, currentDay: day, nextOpening: null };
  }

  for (let offset = 0; offset <= 7; offset++) {
    const candidateDay = (day + offset) % 7;
    const entry = schedule.find((item) => item.day === candidateDay);

    if (!entry || entry.closed) {
      continue;
    }

    if (offset === 0) {
      if (timeToMinutes(entry.open) > minutesSinceMidnight) {
        return {
          isOpen: false,
          currentDay: day,
          nextOpening: { day: candidateDay, open: entry.open },
        };
      }

      continue;
    }

    return {
      isOpen: false,
      currentDay: day,
      nextOpening: { day: candidateDay, open: entry.open },
    };
  }

  return { isOpen: false, currentDay: day, nextOpening: null };
}

export const weekdayLabels: Record<number, { de: string; tr: string }> = {
  0: { de: "Sonntag", tr: "Pazar" },
  1: { de: "Montag", tr: "Pazartesi" },
  2: { de: "Dienstag", tr: "Salı" },
  3: { de: "Mittwoch", tr: "Çarşamba" },
  4: { de: "Donnerstag", tr: "Perşembe" },
  5: { de: "Freitag", tr: "Cuma" },
  6: { de: "Samstag", tr: "Cumartesi" },
};

export function formatNextOpening(
  status: ShopOpenStatus,
  language: "de" | "tr",
): string {
  if (!status.nextOpening) {
    return "";
  }

  const dayLabel =
    status.nextOpening.day === status.currentDay
      ? language === "de"
        ? "heute"
        : "bugün"
      : weekdayLabels[status.nextOpening.day][language];

  return `${dayLabel}, ${status.nextOpening.open} ${language === "de" ? "Uhr" : ""}`.trim();
}
