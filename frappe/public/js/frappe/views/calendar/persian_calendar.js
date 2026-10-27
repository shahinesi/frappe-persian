import { jalaaliMonthLength, toGregorian, toJalaali } from "jalaali-js";

function toJalaliParts(date) {
	if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
	return toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function getJalaliDay(date) {
	const parts = toJalaliParts(date);
	return parts ? String(parts.jd) : "";
}

export function shiftJalaliMonth(date, offset) {
	const parts = toJalaliParts(date);
	if (!parts || !Number.isInteger(offset)) return null;

	const monthIndex = parts.jy * 12 + parts.jm - 1 + offset;
	const jy = Math.floor(monthIndex / 12);
	const jm = (((monthIndex % 12) + 12) % 12) + 1;
	const jd = Math.min(parts.jd, jalaaliMonthLength(jy, jm));
	const gregorian = toGregorian(jy, jm, jd);
	return new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd);
}

export function getJalaliMonthGridRange(date, firstDay = 6) {
	const parts = toJalaliParts(date);
	if (!parts) return null;
	if (!Number.isInteger(firstDay) || firstDay < 0 || firstDay > 6) firstDay = 6;

	const monthStart = toGregorian(parts.jy, parts.jm, 1);
	const monthEnd = toGregorian(parts.jy, parts.jm, jalaaliMonthLength(parts.jy, parts.jm));
	const start = new Date(monthStart.gy, monthStart.gm - 1, monthStart.gd);
	const end = new Date(monthEnd.gy, monthEnd.gm - 1, monthEnd.gd + 1);
	start.setDate(start.getDate() - ((start.getDay() - firstDay + 7) % 7));
	end.setDate(end.getDate() + ((firstDay - end.getDay() + 7) % 7));
	return { start, end };
}
