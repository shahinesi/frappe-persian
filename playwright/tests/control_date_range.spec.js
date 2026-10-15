import { test, expect } from "../support";

test.describe("Date Range Control", () => {
	test("Selecting a date range from the datepicker", async ({ page, desk }) => {
		await page.goto("/desk");
		await desk.ready();
		await page.evaluate(() => {
			frappe.boot.user.language = "en";
		});

		await desk.dialog({
			title: "Date Range",
			fields: [
				{
					label: "Date Range",
					fieldname: "date_range",
					fieldtype: "Date Range",
				},
			],
		});
		await desk.get_field("date_range", "Date Range").click();
		await expect(page.locator(".persian-datepicker")).toHaveCount(0);
		await expect(page.locator(".datepicker.active")).toBeVisible();
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
		await page.locator('.datepicker--cell[data-date="1"]').first().click();
		await page.locator('.datepicker--cell[data-date="15"]').first().click();

		await expect
			.poll(() => page.evaluate(() => cur_dialog.get_value("date_range")))
			.toEqual(["2020-01-01", "2020-01-15"]);
	});

	test("Persian date range displays Jalali dates and returns ISO values", async ({
		page,
		desk,
	}) => {
		await page.goto("/desk");
		await desk.ready();
		await page.evaluate(() => {
			frappe.boot.user.language = "fa_IR";
		});
		await desk.dialog({
			title: "Persian Date Range",
			fields: [{ label: "Date Range", fieldname: "date_range", fieldtype: "Date Range" }],
		});
		await page.evaluate(() => {
			cur_dialog.fields_dict.date_range.set_value(["2026-10-01", "2026-10-02"]);
		});
		await expect
			.poll(() => page.evaluate(() => cur_dialog.get_value("date_range")))
			.toEqual(["2026-10-01", "2026-10-02"]);
		await expect(desk.get_field("date_range", "Date Range")).toHaveValue(
			/۱۴۰۵\/۰۷\/۰۹.*۱۴۰۵\/۰۷\/۱۰/
		);
		await desk.get_field("date_range", "Date Range").click();
		await expect(page.locator(".persian-datepicker .datepicker--nav-title")).toHaveText(
			/مهر ۱۴۰۵/
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
		await expect(page.locator('.persian-datepicker [data-iso="2026-09-22"]')).toHaveAttribute(
			"aria-label",
			/۳۱ شهریور ۱۴۰۵/
		);
		await expect(page.locator('.persian-datepicker [data-iso="2026-10-23"]')).toHaveAttribute(
			"aria-label",
			/۱ آبان ۱۴۰۵/
		);
		await page.locator('.persian-datepicker [data-iso="2026-10-01"]').click();
		await page.locator('.persian-datepicker [data-iso="2026-10-02"]').click();

		await expect
			.poll(() => page.evaluate(() => cur_dialog.get_value("date_range")))
			.toEqual(["2026-10-01", "2026-10-02"]);
	});
});
