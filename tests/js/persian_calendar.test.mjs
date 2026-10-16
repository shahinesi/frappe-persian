import assert from "node:assert/strict";
import test from "node:test";

import {
  formatPersianDate,
  getISODateFromDate,
  getPersianCalendarMonth,
  parsePersianDate,
} from "../../frappe/public/js/frappe/form/controls/persian_calendar.js";

test("keeps UTC-midnight date-only values canonical", () => {
  assert.equal(getISODateFromDate(new Date("2026-10-01")), "2026-10-01");
});

test("uses the local calendar date for local-midnight Date objects", () => {
  assert.equal(getISODateFromDate(new Date(2026, 9, 1)), "2026-10-01");
});

test("preserves string values and rejects invalid Date objects", () => {
  assert.equal(getISODateFromDate("2026-10-01"), "2026-10-01");
  assert.equal(getISODateFromDate(new Date(Number.NaN)), "");
});

test("parses Jalali dates to canonical Gregorian ISO, including leap-day boundaries", () => {
  assert.equal(parsePersianDate("۱۴۰۵/۰۷/۰۹"), "2026-10-01");
  assert.equal(parsePersianDate("۱۴۰۳/۱۲/۳۰"), "2025-03-20");
  assert.equal(parsePersianDate("۱۴۰۴/۱۲/۳۰"), null);
});

test("builds a Saturday-first Jalali month with localized headings", () => {
  const month = getPersianCalendarMonth(1405, 7, "fa-IR");
  const dates = month.weeks.flat().filter((cell) => cell.isCurrentMonth);

  assert.equal(month.monthName, "مهر");
  assert.equal(month.yearLabel, "۱۴۰۵");
  assert.deepEqual(month.weekdayLabels, ["ش", "ی", "د", "س", "چ", "پ", "ج"]);
  assert.equal(month.weeks[0][0].persianDate.day, 28);
  assert.equal(month.weeks[0][0].isoDate, "2026-09-19");
  assert.equal(dates.length, 30);
  assert.deepEqual(dates[0], {
    isoDate: "2026-09-23",
    persianDate: { year: 1405, month: 7, day: 1 },
    isCurrentMonth: true,
  });
  assert.equal(dates.at(-1).isoDate, "2026-10-22");
});

test("formats the same canonical date in Persian and English locales", () => {
  assert.equal(formatPersianDate("2026-10-01", "fa-IR"), "۱۴۰۵/۰۷/۰۹");
  assert.equal(formatPersianDate("2026-10-01", "en"), "1405/07/09");
});
