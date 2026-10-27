import { test, expect } from "../support";

const TEST_CASES = [
	{
		number_format: "#.###,##",
		values: [
			{
				input: "364.87,334",
				blur_expected: "36.487,334",
				focus_expected: "36.487,334",
			},
			{
				input: "36487,335",
				blur_expected: "36.487,335",
				focus_expected: "36.487,335",
			},
			{
				input: "2*(2+47)+1,5+1",
				blur_expected: "100,500",
				focus_expected: "100,500",
			},
		],
	},
	{
		number_format: "#,###.##",
		values: [
			{
				input: "464,87.334",
				blur_expected: "46,487.334",
				focus_expected: "46,487.334",
			},
			{
				input: "46487.335",
				blur_expected: "46,487.335",
				focus_expected: "46,487.335",
			},
			{
				input: "3*(2+47)+1.5+1",
				blur_expected: "149.500",
				focus_expected: "149.500",
			},
		],
	},
	{
		number_format: "#.###,##",
		values: [
			{
				input: "12.345",
				blur_expected: "12.345,000",
				focus_expected: "12.345,000",
			},
			{
				input: "12.340",
				blur_expected: "12.340,000",
				focus_expected: "12.340,000",
			},
		],
	},
];

test.describe("Control Float", () => {
	test("check value changes", async ({ page, desk }) => {
		await page.goto("/desk/website");
		await desk.ready();
		await desk.dialog({
			title: "Float Check",
			animate: false,
			fields: [
				{
					fieldname: "float_number",
					fieldtype: "Float",
					Label: "Float",
				},
			],
		});

		const input = desk.get_field("float_number", "Float");
		for (const { number_format, values } of TEST_CASES) {
			await page.evaluate((number_format) => {
				frappe.boot.sysdefaults.number_format = number_format;
			}, number_format);

			for (const d of values) {
				await input.clear();
				await desk.fill_field("float_number", d.input, "Float");
				await input.blur();
				await expect(input).toHaveValue(d.blur_expected);
				await input.focus();
				await input.blur();
				await input.focus();
				await expect(input).toHaveValue(d.focus_expected);
			}
		}
	});

	test("accepts Persian and Arabic-Indic digits at numeric input boundaries", async ({ page, desk }) => {
		await page.goto("/desk/website");
		await desk.ready();
		await desk.dialog({
			title: "Localized Numeric Input",
			animate: false,
			fields: [
				{ fieldname: "float_number", fieldtype: "Float", label: "Float", precision: 3 },
				{ fieldname: "int_number", fieldtype: "Int", label: "Integer" },
			],
		});

		await page.evaluate(() => {
			frappe.boot.lang = "fa";
			frappe.boot.sysdefaults.number_format = "#,###.##";
		});

		const floatInput = desk.get_field("float_number", "Float");
		await floatInput.fill("۱۲۳۴.۵");
		await floatInput.blur();
		await expect(floatInput).toHaveValue("1,234.500");

		const intInput = desk.get_field("int_number", "Int");
		await intInput.fill("١٢٣٤");
		await intInput.blur();
		await expect(intInput).toHaveValue("1,234");
	});
});
