import { formatPersianDate, isPersianLocale, parsePersianDate } from "./persian_calendar.js";
import { loadPersianDatePicker } from "./load_persian_datepicker.js";

frappe.ui.form.ControlDateRange = class ControlDateRange extends frappe.ui.form.ControlData {
	make_input() {
		super.make_input();
		this.make_picker();
		this.refresh();
	}

	make_picker() {
		this.set_date_options();
		this.set_datepicker();
	}

	set_date_options() {
		var me = this;

		let lang = frappe.boot?.user?.language;
		this.locale = (lang || "en").replace("_", "-");
		if (this.locale.toLowerCase() === "fa") this.locale = "fa-IR";
		this.usePersianCalendar = isPersianLocale(this.locale);
		this.datepicker_options = {
			language: $.fn.datepicker.language[lang] ? lang : "en",
			range: true,
			autoClose: true,
			toggleSelected: false,
			minDate: this.df.min_date,
			maxDate: this.df.max_date,
			firstDay: frappe.datetime.get_first_day_of_the_week_index(),
		};
		this.datepicker_options.dateFormat = frappe.boot.sysdefaults.date_format || "yyyy-mm-dd";
		this.datepicker_options.onSelect = function () {
			me.$input.trigger("change");
		};
	}
	set_datepicker() {
		if (this.usePersianCalendar) {
			this.persianDatePickerPromise = loadPersianDatePicker().then((PersianDatePicker) => {
				if (!this.input.isConnected) return;
				this.persianDatePicker = new PersianDatePicker({
					input: this.input,
					locale: this.locale,
					range: true,
					minDate: this.df.min_date,
					maxDate: this.df.max_date,
					onSelect: ([fromDate, toDate]) => {
						this.$input.val(this.format_for_input(fromDate, toDate)).trigger("change");
					},
				});
				this.refresh();
				if (document.activeElement === this.input) this.persianDatePicker.show(this.value);
			});
			return;
		}
		this.$input.datepicker(this.datepicker_options);
		this.datepicker = this.$input.data("datepicker");
	}
	set_input(value, value2) {
		this.last_value = this.value;
		if (value && value2) {
			this.value = [value, value2];
		} else {
			this.value = value;
		}
		const range = Array.isArray(this.value) ? this.value : null;
		this.$input?.val(range ? this.format_for_input(...range) : "");
		this.persianDatePicker?.setValue(range);
		this.set_disp_area(value || "");
		this.set_mandatory && this.set_mandatory(value);
	}
	parse(value) {
		if (value == undefined || typeof value == "object") return value;

		// replace the separator (which can be in user language) with comma
		const to = __("{0} to {1}").replace("{0}", "").replace("{1}", "");
		value = value && value.replace(to, ",");

		if (value && value.includes(",")) {
			var vals = value.split(",");
			if (this.usePersianCalendar) {
				const fromDate = parsePersianDate(vals[0].trim());
				const toDate = parsePersianDate(vals[vals.length - 1].trim());
				return fromDate && toDate ? [fromDate, toDate] : undefined;
			}
			var from_date = moment(frappe.datetime.user_to_obj(vals[0])).format("YYYY-MM-DD");
			var to_date = moment(frappe.datetime.user_to_obj(vals[vals.length - 1])).format(
				"YYYY-MM-DD"
			);
			return [from_date, to_date];
		}
	}
	format_for_input(value1, value2) {
		if (!value1 || !value2) return "";
		const formatted = this.usePersianCalendar
			? [formatPersianDate(value1, this.locale), formatPersianDate(value2, this.locale)]
			: [
					frappe.datetime.str_to_user(value1, false, true),
					frappe.datetime.str_to_user(value2, false, true),
			  ];
		return __("{0} to {1}", formatted);
	}
};
