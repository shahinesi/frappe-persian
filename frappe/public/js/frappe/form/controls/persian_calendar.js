const DAY_IN_MS = 24 * 60 * 60 * 1000;
const PERSIAN_PARTS = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
	calendar: "persian",
	day: "numeric",
	month: "numeric",
	year: "numeric",
	timeZone: "UTC",
});

const PERSIAN_DIGITS = new Intl.NumberFormat("fa-IR-u-nu-arabext", {
	useGrouping: false,
});

function parseISODate(isoDate) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || "");
	if (!match) throw new RangeError(`Invalid ISO date: ${isoDate}`);
	const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
	if (date.toISOString().slice(0, 10) !== isoDate) {
		throw new RangeError(`Invalid ISO date: ${isoDate}`);
	}
	return date;
}

function toISODate(date) {
	return date.toISOString().slice(0, 10);
}

function getPersianDateFromISO(isoDate) {
	const parts = PERSIAN_PARTS.formatToParts(parseISODate(isoDate));
	const getPart = (type) => Number(parts.find((part) => part.type === type)?.value);
	const result = { year: getPart("year"), month: getPart("month"), day: getPart("day") };
	if (!Object.values(result).every(Number.isInteger)) {
		throw new RangeError(`Cannot convert ISO date to Persian calendar: ${isoDate}`);
	}
	return result;
}

function getISODateFromPersianDate({ year, month, day }) {
	if (
		!Number.isInteger(year) ||
		year < 1200 ||
		year > 1600 ||
		!Number.isInteger(month) ||
		month < 1 ||
		month > 12 ||
		!Number.isInteger(day) ||
		day < 1 ||
		day > 31
	) {
		throw new RangeError("Persian date is outside the supported calendar range");
	}

	const start = Date.UTC(year + 621, 2, 1);
	for (let offset = 0; offset < 400; offset++) {
		const isoDate = toISODate(new Date(start + offset * DAY_IN_MS));
		const candidate = getPersianDateFromISO(isoDate);
		if (candidate.year === year && candidate.month === month && candidate.day === day) {
			return isoDate;
		}
	}
	throw new RangeError("Persian date does not exist in the supported calendar");
}

function getPersianCalendarMonth(year, month, locale) {
	const firstISO = getISODateFromPersianDate({ year, month, day: 1 });
	const first = parseISODate(firstISO);
	const firstWeekday = (first.getUTCDay() + 1) % 7;
	const gridStart = new Date(first.getTime() - firstWeekday * DAY_IN_MS);
	const monthName = new Intl.DateTimeFormat(locale, {
		calendar: "persian",
		month: "long",
		timeZone: "UTC",
	}).format(first);
	const yearLabel = PERSIAN_DIGITS.format(year);
	const weekdayFormatter = new Intl.DateTimeFormat(locale, {
		weekday: "long",
		timeZone: "UTC",
	});
	const weekdayLabels = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
	const weekdayAriaLabels = [];
	for (let index = 0; index < 7; index++) {
		const date = new Date(Date.UTC(2023, 0, 7 + index));
		const label = weekdayFormatter.format(date);
		weekdayAriaLabels.push(label);
	}

	const weeks = Array.from({ length: 6 }, (_, weekIndex) =>
		Array.from({ length: 7 }, (_, dayIndex) => {
			const date = new Date(gridStart.getTime() + (weekIndex * 7 + dayIndex) * DAY_IN_MS);
			const isoDate = toISODate(date);
			const persianDate = getPersianDateFromISO(isoDate);
			return {
				isoDate,
				persianDate,
				dayLabel: PERSIAN_DIGITS.format(persianDate.day),
				weekday: (date.getUTCDay() + 1) % 7,
				isCurrentMonth: persianDate.year === year && persianDate.month === month,
			};
		})
	);

	return { year, month, monthName, yearLabel, weekdayLabels, weekdayAriaLabels, weeks };
}

function formatPersianDate(isoDate, locale) {
	if (!isoDate) return "";
	const date = getPersianDateFromISO(isoDate);
	const digits = new Intl.NumberFormat(locale, { useGrouping: false });
	const pad = (value) => digits.format(value).padStart(2, digits.format(0));
	return `${digits.format(date.year)}/${pad(date.month)}/${pad(date.day)}`;
}

function parsePersianDate(value) {
	const normalized = value
		.trim()
		.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
		.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
	const match = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(normalized);
	if (!match) return null;
	try {
		const isoDate = getISODateFromPersianDate({
			year: Number(match[1]),
			month: Number(match[2]),
			day: Number(match[3]),
		});
		const roundTrip = getPersianDateFromISO(isoDate);
		return roundTrip.year === Number(match[1]) &&
			roundTrip.month === Number(match[2]) &&
			roundTrip.day === Number(match[3])
			? isoDate
			: null;
	} catch {
		return null;
	}
}

function isPersianLocale(locale) {
	return /^fa(?:[-_]|$)/i.test(locale || "");
}

export {
	formatPersianDate,
	getISODateFromPersianDate,
	getPersianCalendarMonth,
	getPersianDateFromISO,
	isPersianLocale,
	parsePersianDate,
};
