import { test, expect } from "../support";

test.describe("Date Control", () => {
	test.beforeEach(async ({ page, desk }) => {
		await page.goto("/desk");
		await desk.ready();
	});

	function get_dialog(desk, date_field_options) {
		return desk.dialog({
			title: "Date",
			animate: false,
			fields: [
				{
					label: "Date",
					fieldname: "date",
					fieldtype: "Date",
					in_list_view: 1,
					...date_field_options,
				},
			],
		});
	}

	function get_date_value(page) {
		return page.evaluate(() => cur_dialog.fields_dict.date.value);
	}

	test("Selecting a date from the datepicker & check prev & next button", async ({
		page,
		desk,
	}) => {
		await get_dialog(desk);
		const input = desk.get_field("date", "Date");
		await input.click();
		await page.locator(".datepicker--nav-title").click();
		await page.locator(".datepicker--nav-title").click();

		await page
			.locator(
				'.datepicker--years > .datepicker--cells > .datepicker--cell[data-year="2020"]'
			)
			.click();
		await page
			.locator(
				'.datepicker--months > .datepicker--cells > .datepicker--cell[data-month="0"]'
			)
			.click();
		await page
			.locator('.datepicker--days > .datepicker--cells > .datepicker--cell[data-date="15"]')
			.click();

		await expect.poll(() => get_date_value(page)).toBe("2020-01-15");

		await input.click();
		await page.locator(".datepicker--nav-action[data-action=next]").click();
		await page.locator('.datepicker--cell[data-date="15"]').click();

		await expect.poll(() => get_date_value(page)).toBe("2020-02-15");

		await input.click();
		await page.locator(".datepicker--nav-action[data-action=prev]").click();
		await page.locator('.datepicker--cell[data-date="15"]').click();

		await expect.poll(() => get_date_value(page)).toBe("2020-01-15");
	});

	test('Clicking on "Today" button gives todays date', async ({ page, desk }) => {
		await get_dialog(desk);
		await desk.get_field("date", "Date").click();

		await page.locator(".datepicker--button").click();

		const today = await page.evaluate(() => frappe.datetime.get_today());
		await expect.poll(() => get_date_value(page)).toBe(today);
	});

	test("Persian Desk datepicker presents Jalali dates and keeps ISO values", async ({
		page,
		desk,
	}) => {
		await page.evaluate(() => {
			frappe.boot.user.language = "fa";
		});
		await get_dialog(desk);
		await page.evaluate(() => {
			cur_dialog.fields_dict.date.set_value("2026-10-01");
		});
		await expect.poll(() => get_date_value(page)).toBe("2026-10-01");

		const input = desk.get_field("date", "Date");
		await expect(input).toHaveValue("۱۴۰۵/۰۷/۰۹");
		await input.click();
		await expect(page.locator(".persian-datepicker .datepicker--nav-title")).toHaveText(
			"مهر ۱۴۰۵"
		);
		await expect(page.locator(".persian-datepicker .datepicker--day-name")).toHaveText([
			"ش",
			"ی",
			"د",
			"س",
			"چ",
			"پ",
			"ج",
		]);
		const selectedDay = page.locator('.persian-datepicker [data-iso="2026-10-01"]');
		await selectedDay.focus();
		await selectedDay.press("ArrowLeft");
		await expect(page.locator(".persian-datepicker :focus")).toHaveAttribute(
			"data-iso",
			"2026-10-02"
		);
		await page.keyboard.press("Enter");

		await expect.poll(() => get_date_value(page)).toBe("2026-10-02");
		await expect(page.locator(".persian-datepicker")).toBeHidden();
		await expect(input).toBeFocused();
		await input.click();
		await expect(page.locator(".persian-datepicker")).toBeVisible();
		await page.keyboard.press("Escape");
		await expect(page.locator(".persian-datepicker")).toBeHidden();
		await expect(input).toBeFocused();
		await input.fill("۱۴۰۵/۰۷/۰۹");
		await input.dispatchEvent("change");
		await expect.poll(() => get_date_value(page)).toBe("2026-10-01");
		await page.evaluate(() => {
			cur_dialog.fields_dict.date.set_value("2025-03-20");
		});
		await expect.poll(() => get_date_value(page)).toBe("2025-03-20");
		await expect(input).toHaveValue("۱۴۰۳/۱۲/۳۰");
		await input.click();
		await page.locator('.persian-datepicker [data-action="next"]').click();
		await expect(page.locator(".persian-datepicker .datepicker--nav-title")).toHaveText(
			"فروردین ۱۴۰۴"
		);
		await page.locator('.persian-datepicker [data-action="prev"]').click();
		await expect(page.locator(".persian-datepicker .datepicker--nav-title")).toHaveText(
			"اسفند ۱۴۰۳"
		);
	});

	test("English Desk datepicker stays Gregorian", async ({ page, desk }) => {
		await page.evaluate(() => {
			frappe.boot.user.language = "en";
		});
		await get_dialog(desk);
		await page.evaluate(() => {
			cur_dialog.fields_dict.date.set_value("2026-10-01");
		});
		await expect.poll(() => get_date_value(page)).toBe("2026-10-01");
		await desk.get_field("date", "Date").click();

		await expect(page.locator(".persian-datepicker")).toHaveCount(0);
		await expect(page.locator(".datepicker--nav-title")).toContainText("October");
		await page.locator('.datepicker--days .datepicker--cell[data-date="2"]').click();
		await expect.poll(() => get_date_value(page)).toBe("2026-10-02");
	});

	test("Persian date filters use the Jalali control and retain ISO values", async ({ page }) => {
		await page.goto("/desk/website");
		await page.evaluate(async () => {
			frappe.boot.user.language = "fa";
			await frappe.model.with_doctype("ToDo");
			const parent = $("<div>").appendTo("body");
			window.persian_date_filter_group = new frappe.ui.FilterGroup({
				parent,
				doctype: "ToDo",
				on_change: () => {},
			});
			await window.persian_date_filter_group.add_filter("ToDo", "date", "=", "2026-10-01");
		});

		const input = page.locator(".filter-field input").first();
		await expect(input).toHaveValue("۱۴۰۵/۰۷/۰۹");
		await input.click();
		await expect(page.locator(".persian-datepicker .datepicker--nav-title")).toHaveText(
			"مهر ۱۴۰۵"
		);
		await page.locator('.persian-datepicker [data-iso="2026-10-02"]').click();

		const filters = await page.evaluate(() => window.persian_date_filter_group.get_filters());
		expect(filters).toEqual([["ToDo", "date", "=", "2026-10-02"]]);
	});
});
