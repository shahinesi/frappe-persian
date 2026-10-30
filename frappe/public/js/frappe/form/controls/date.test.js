import assert from "node:assert/strict";
import { describe, it } from "node:test";

globalThis.frappe = {
	ui: {
		form: {
			ControlData: class {
				set_formatted_input(value) {
					this.formatted_value = value;
				}
			},
		},
	},
	datetime: {
		str_to_obj: () => new Date(2026, 2, 21),
	},
};

globalThis.moment = () => ({ format: () => "2026-03-21" });

await import("./date.js");

function makeControl(language) {
	const values = [];
	const control = new frappe.ui.form.ControlDate();
	control.jalali_calendar = language === "fa";
	control.datepicker_options = {};
	control.last_value = "previous";
	control.$input = {
		val(value) {
			if (value !== undefined) values.push(value);
			return values.at(-1);
		},
	};
	control.datepicker = {
		selectedDates: [],
		selectDate() {
			control.$input.val("03/21/2026");
		},
	};
	control.format_for_input = (value) => `localized:${value}`;
	return { control, values };
}

describe("Frappe date control localization", () => {
	it("restores the locale-formatted value after a Persian date refresh", () => {
		const { control, values } = makeControl("fa");

		control.set_formatted_input("2026-03-21");

		assert.equal(values.at(-1), "localized:2026-03-21");
	});

	it("leaves the Gregorian Air Datepicker value untouched for English", () => {
		const { control, values } = makeControl("en");

		control.set_formatted_input("2026-03-21");

		assert.equal(values.at(-1), "03/21/2026");
	});
});
