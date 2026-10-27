export function formatLocalizedNumber(
	value: number,
	locale = document.documentElement.lang || "en"
) {
	return new Intl.NumberFormat(locale, { numberingSystem: "latn" }).format(value);
}
