import assert from "node:assert/strict";
import test from "node:test";

import {
	getISODateFromDate,
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
