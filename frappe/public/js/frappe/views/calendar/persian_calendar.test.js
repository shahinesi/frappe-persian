import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toJalaali } from "jalaali-js";
import { getJalaliDay, getJalaliMonthGridRange, shiftJalaliMonth } from "./persian_calendar.js";

function localDateString(date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
		date.getDate()
	).padStart(2, "0")}`;
}

describe("Jalali FullCalendar date ranges", () => {
	it("builds a complete Saturday-first grid for the Jalali month", () => {
		const range = getJalaliMonthGridRange(new Date(2026, 2, 21));
		assert.equal(localDateString(range.start), "2026-03-21");
		assert.equal(localDateString(range.end), "2026-04-25");
		assert.equal(getJalaliDay(new Date(2026, 2, 21)), "1");
	});

	it("uses the configured week start and preserves the Gregorian range contract", () => {
		const range = getJalaliMonthGridRange(new Date(2026, 2, 21), 0);
		assert.equal(range.start.getDay(), 0);
		assert.equal(range.end.getDay(), 0);
		assert.ok(range.start < new Date(2026, 2, 21));
		assert.ok(range.end > new Date(2026, 3, 20));
	});

	it("keeps the Jalali day correct at Tehran midnight", () => {
		const tehranMidnight = new Date(Date.UTC(2026, 2, 20, 20, 30));
		assert.deepEqual(
			toJalaali(
				tehranMidnight.getFullYear(),
				tehranMidnight.getMonth() + 1,
				tehranMidnight.getDate()
			),
			{ jy: 1405, jm: 1, jd: 1 }
		);
	});

	it("shifts months with jalaali-js and clamps a 31-day month to 30 days", () => {
		const shifted = shiftJalaliMonth(new Date(2025, 8, 22), 1);
		assert.deepEqual(
			toJalaali(shifted.getFullYear(), shifted.getMonth() + 1, shifted.getDate()),
			{
				jy: 1404,
				jm: 7,
				jd: 30,
			}
		);
		assert.equal(getJalaliDay(new Date(Number.NaN)), "");
	});
});
