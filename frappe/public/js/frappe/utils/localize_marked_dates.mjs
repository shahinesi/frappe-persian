/**
 * Format server-rendered date markers with Frappe's locale-aware formatter.
 * The callback is the existing Gregorian-to-Jalali/date-time presentation path.
 */
export function localizeMarkedDates(root, language, formatDate) {
	const languageCode = String(language || "").toLowerCase().split(/[-_]/)[0];
	if (languageCode !== "fa" || !root?.querySelectorAll) return;

	root.querySelectorAll("[data-frappe-date]").forEach((element) => {
		const value = element.getAttribute("data-frappe-date");
		const onlyDate = element.getAttribute("data-frappe-date-type") !== "datetime";
		const formatted = value ? formatDate(value, onlyDate) : "";
		if (formatted) element.textContent = formatted;
	});

	root.querySelectorAll("[data-frappe-date-title]").forEach((element) => {
		const value = element.getAttribute("data-frappe-date-title");
		const formatted = value ? formatDate(value, false) : "";
		if (formatted) element.setAttribute("title", formatted);
	});
}
