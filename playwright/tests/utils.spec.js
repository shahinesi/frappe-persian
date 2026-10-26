import { test, expect } from "../support";

test.describe("Utils", () => {
	test.beforeEach(async ({ page, desk }) => {
		await page.goto("/desk");
		await desk.ready();
	});

	function run_util(page, name, ...args) {
		return page.evaluate(([name, args]) => frappe.utils[name](...args), [name, args]);
	}

	test("formats Persian dates after converting datetimes to the user timezone", async ({ page }) => {
		const values = await page.evaluate(() => {
			const previousLanguage = frappe.boot.lang;
			const previousTimeZone = frappe.boot.time_zone;
			const previousDateFormat = frappe.sys_defaults.date_format;
			const previousTimeFormat = frappe.sys_defaults.time_format;
			frappe.boot.lang = "fa-IR";
			frappe.boot.time_zone = { system: "UTC", user: "Asia/Tehran" };
			frappe.sys_defaults.date_format = "yyyy-mm-dd";
			frappe.sys_defaults.time_format = "HH:mm:ss";

			try {
				return {
					date: frappe.datetime.str_to_user("2026-03-21", false, true),
					datetime: frappe.datetime.str_to_user("2026-03-21 20:30:00"),
					datetimeCell: frappe.form.formatters.Datetime("2026-03-21 20:30:00"),
					persianGlobalDate: frappe.datetime.global_date_format("2026-03-21"),
					parsedPersianInput: frappe.datetime.user_to_str("۱۴۰۵-۰۱-۰۱"),
					parsedArabicInput: frappe.datetime.user_to_str("١٤٠٥-٠١-٠١"),
					englishDate: (() => {
						frappe.boot.lang = "en";
						return {
							date: frappe.datetime.str_to_user("2026-03-21", false, true),
							datetimeCell: frappe.form.formatters.Datetime("2026-03-21 20:30:00"),
							globalDate: frappe.datetime.global_date_format("2026-03-21"),
						};
					})(),
				};
			} finally {
				frappe.boot.lang = previousLanguage;
				frappe.boot.time_zone = previousTimeZone;
				frappe.sys_defaults.date_format = previousDateFormat;
				frappe.sys_defaults.time_format = previousTimeFormat;
			}
		});

		expect(values).toEqual({
			date: "1405-01-01",
			datetime: "1405-01-02 00:00:00",
			datetimeCell: "1405-01-02 00:00:00",
			parsedPersianInput: "2026-03-21",
			parsedArabicInput: "2026-03-21",
			persianGlobalDate: "1 فروردین 1405",
			englishDate: {
				date: "2026-03-21",
				datetimeCell: "2026-03-22 00:00:00",
				globalDate: "21st March 2026",
			},
		});
	});

	test("normalizes Persian digits only on input and keeps displayed numbers canonical", async ({ page }) => {
		const values = await page.evaluate(() => {
			const previousLanguage = frappe.boot.lang;
			frappe.boot.lang = "fa-IR";
			try {
				const persianDisplay = format_number(1234.5, "#,###.##", 2);
				const persianInput = frappe.utils.eval_expression("۱۲۳۴ + ۵");
				const arabicInput = frappe.utils.eval_expression("١٢٣٤ + ٥");
				frappe.boot.lang = "en";
				return {
					persianInput,
					arabicInput,
					persianDisplay,
					englishDisplay: format_number(1234.5, "#,###.##", 2),
				};
			} finally {
				frappe.boot.lang = previousLanguage;
			}
		});

		expect(values).toEqual({
			persianInput: 1239,
			arabicInput: 1239,
			persianDisplay: "1,234.50",
			englishDisplay: "1,234.50",
		});
	});

	test("keeps relative-time digits canonical in Persian", async ({ page }) => {
		const value = await page.evaluate(() => {
			const previousLanguage = frappe.boot.lang;
			const previousTranslate = window.__;
			const previousNow = frappe.datetime.now_datetime;
			frappe.boot.lang = "fa-IR";
			frappe.datetime.now_datetime = () => "2026-04-03 12:00:00";
			window.__ = (message, args) => (args ? message.replace("{0}", args[0]) : message);
			try {
				return frappe.datetime.prettyDate(new Date(2026, 3, 2, 12), true);
			} finally {
				frappe.boot.lang = previousLanguage;
				frappe.datetime.now_datetime = previousNow;
				window.__ = previousTranslate;
			}
		});

		expect(value).toBe("1 d");
	});

	test("should round hidden seconds to minutes", async ({ page }) => {
		expect(await run_util(page, "seconds_to_duration", 89, { hide_seconds: 1 })).toEqual({
			days: 0,
			hours: 0,
			minutes: 1,
			seconds: 0,
		});

		expect(await run_util(page, "seconds_to_duration", -89, { hide_seconds: 1 })).toEqual({
			days: -0,
			hours: -0,
			minutes: -1,
			seconds: 0,
		});

		expect(await run_util(page, "seconds_to_duration", 91, { hide_seconds: 1 })).toEqual({
			days: 0,
			hours: 0,
			minutes: 2,
			seconds: 0,
		});

		expect(await run_util(page, "seconds_to_duration", -91, { hide_seconds: 1 })).toEqual({
			days: -0,
			hours: -0,
			minutes: -2,
			seconds: 0,
		});

		expect(await run_util(page, "seconds_to_duration", 60 * 60, { hide_seconds: 1 })).toEqual({
			days: 0,
			hours: 1,
			minutes: 0,
			seconds: 0,
		});

		expect(await run_util(page, "seconds_to_duration", 15 * 60, { hide_seconds: 1 })).toEqual({
			days: 0,
			hours: 0,
			minutes: 15,
			seconds: 0,
		});
	});

	test("formats duration units with Persian words and canonical digits without changing English", async ({ page }) => {
		const values = await page.evaluate(() => {
			const previousLanguage = frappe.boot.lang;
			const previousTranslate = window.__;
			frappe.boot.lang = "fa-IR";
			window.__ = (message, _args, context) => {
				if (!(frappe.boot.lang || "").toLowerCase().startsWith("fa")) return message;
				return context === "Days (Field: Duration)"
					? "روز"
					: context === "Hours (Field: Duration)"
						? "ساعت"
						: context === "Minutes (Field: Duration)"
							? "دقیقه"
							: context === "Seconds (Field: Duration)"
								? "ثانیه"
								: message;
			};

			try {
				const persian = frappe.utils.get_formatted_duration(90061, { hide_seconds: 1 });
				frappe.boot.lang = "en";
				const english = frappe.utils.get_formatted_duration(90061, { hide_seconds: 1 });
				return { persian, english };
			} finally {
				frappe.boot.lang = previousLanguage;
				window.__ = previousTranslate;
			}
		});

		expect(values).toEqual({ persian: "1 روز 1 ساعت 1 دقیقه", english: "1d 1h 1m" });
	});

	test("should escape the docname when it is used as the link text", async ({ page }) => {
		const link = await run_util(
			page,
			"get_form_link",
			"ToDo",
			"<img src=x onerror=alert(1)>",
			true
		);
		expect(link).toBe(
			'<a href="/desk/todo/%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E">' +
				"&lt;img src&#x3D;x onerror&#x3D;alert(1)&gt;</a>"
		);
	});

	test("should not escape display text passed by the caller", async ({ page }) => {
		const link = await run_util(
			page,
			"get_form_link",
			"ToDo",
			"TODO-0001",
			true,
			"<b>Open item</b>"
		);
		expect(link).toBe('<a href="/desk/todo/TODO-0001"><b>Open item</b></a>');
	});

	test("should keep zero when shortening a number", async ({ page }) => {
		expect(await run_util(page, "shorten_number", 0)).toBe("0");
	});

	test("should parse days, hours, minutes and seconds", async ({ page }) => {
		const seconds = 60 * 60 * 24 + 60 * 60 + 60 + 1;

		expect(await run_util(page, "seconds_to_duration", seconds)).toEqual({
			days: 1,
			hours: 1,
			minutes: 1,
			seconds: 1,
		});

		expect(await run_util(page, "seconds_to_duration", seconds * -1)).toEqual({
			days: -1,
			hours: -1,
			minutes: -1,
			seconds: -1,
		});

		expect(
			await run_util(page, "seconds_to_duration", seconds, {
				hide_days: 1,
				hide_seconds: 1,
			})
		).toEqual({
			days: 0,
			hours: 25,
			minutes: 1,
			seconds: 0,
		});

		expect(
			await run_util(page, "seconds_to_duration", seconds * -1, {
				hide_days: 1,
				hide_seconds: 1,
			})
		).toEqual({
			days: 0,
			hours: -25,
			minutes: -1,
			seconds: 0,
		});
	});
});
