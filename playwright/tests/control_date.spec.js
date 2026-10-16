import { test, expect, TEST_USER } from "../support";

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

	test("removes the Persian datepicker when its form control is detached", async ({
		page,
		desk,
	}) => {
		await page.evaluate(() => {
			frappe.boot.user.language = "fa";
		});
		await get_dialog(desk);
		await desk.get_field("date", "Date").click();
		await expect(page.locator(".persian-datepicker")).toHaveCount(1);

		await page.evaluate(() => cur_dialog.$wrapper.remove());
		await expect(page.locator(".persian-datepicker")).toHaveCount(0);
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
		const picker = page.locator(".persian-datepicker:visible");
		await expect(picker.locator(".datepicker--nav-title")).toHaveText("مهر ۱۴۰۵");
		const pickerBounds = await picker.boundingBox();
		const viewport = page.viewportSize();
		expect(pickerBounds.x).toBeGreaterThanOrEqual(0);
		expect(pickerBounds.x + pickerBounds.width).toBeLessThanOrEqual(viewport.width);
		await picker.locator('[data-iso="2026-10-02"]').click();

		const filters = await page.evaluate(() => window.persian_date_filter_group.get_filters());
		expect(filters).toEqual([["ToDo", "date", "=", "2026-10-02"]]);
	});

	test("Persian calendar works in the standard ToDo Desk form", async ({
		page,
		desk,
		admin,
	}) => {
		const user = await admin.get_doc("User", TEST_USER);
		const originalLanguage = user.data.language;

		try {
			await admin.set_value("User", TEST_USER, { language: "fa" });
			await desk.new_form("ToDo");

			const input = desk.get_field("date", "Date");
			await page.evaluate(() => cur_frm.set_value("date", "2026-10-01"));
			await expect.poll(() => page.evaluate(() => cur_frm.doc.date)).toBe("2026-10-01");
			await expect(input).toHaveValue("۱۴۰۵/۰۷/۰۹");

			await input.click();
			const picker = page.locator(".persian-datepicker:visible");
			await expect(picker.locator(".datepicker--nav-title")).toHaveText("مهر ۱۴۰۵");
			await picker.locator('[data-iso="2026-10-02"]').click();
			await expect.poll(() => page.evaluate(() => cur_frm.doc.date)).toBe("2026-10-02");
			await expect(input).toHaveValue("۱۴۰۵/۰۷/۱۰");

			await page.evaluate(() =>
				cur_frm.set_value("description", "Persian date persistence check")
			);
			await desk.save();
			const savedDate = await page.evaluate(async () => {
				const response = await frappe.call({
					method: "frappe.client.get_value",
					args: {
						doctype: "ToDo",
						filters: { name: cur_frm.doc.name },
						fieldname: "date",
					},
				});
				return response.message.date;
			});
			expect(savedDate).toBe("2026-10-02");
		} finally {
			await admin.set_value("User", TEST_USER, { language: originalLanguage });
		}
	});
});
