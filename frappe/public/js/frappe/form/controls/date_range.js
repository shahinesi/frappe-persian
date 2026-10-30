frappe.ui.form.ControlDateRange = class ControlDateRange extends frappe.ui.form.ControlDate {
	make_input() {
		super.make_input();
		this.refresh();
	}

	make_picker() {
		this.set_date_options();
		this.set_datepicker();
	}

	set_date_options() {
		var me = this;

		let lang = frappe.boot?.user?.language || frappe.boot?.lang || "en";
		this.jalali_calendar = /^fa(?:[-_]|$)/i.test(lang);
		this.jalali_calendar_range = this.jalali_calendar;
		this.datepicker_options = {
			language: $.fn.datepicker.language[lang] ? lang : "en",
			...(this.jalali_calendar ? { showEvent: "frappe-jalali-picker-open" } : {}),
			range: true,
			autoClose: true,
			toggleSelected: false,
			minDate: this.df.min_date,
			maxDate: this.df.max_date,
			firstDay: frappe.datetime.get_first_day_of_the_week_index(),
		};
		this.datepicker_options.dateFormat = frappe.boot.sysdefaults.date_format || "yyyy-mm-dd";
		this.datepicker_options.onSelect = (formattedDate, selectedDates) => {
			if (this.jalali_calendar && selectedDates?.length === 2) {
				const from = moment(selectedDates[0]).format("YYYY-MM-DD");
				const to = moment(selectedDates[1]).format("YYYY-MM-DD");
				this.$input.val(this.format_for_input(from, to));
			}
			me.$input.trigger("change");
		};
	}
	set_datepicker() {
		this.$input.datepicker(this.datepicker_options);
		this.datepicker = this.$input.data("datepicker");
		if (this.jalali_calendar) {
			this.$input.on("focus.frappe-jalali-datepicker", () => this.show_jalali_datepicker());
			this.$input.on("keydown.frappe-jalali-datepicker", (event) => {
				if (event.key === "Escape") this.hide_jalali_datepicker();
			});
		}
	}
	set_input(value, value2) {
		this.last_value = this.value;
		if (value && value2) {
			this.value = [value, value2];
		} else {
			this.value = value;
		}
		if (this.value) {
			let formatted = this.format_for_input(this.value[0], this.value[1]);
			this.$input && this.$input.val(formatted);
		} else {
			this.$input && this.$input.val("");
		}
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
			var from_date = moment(frappe.datetime.user_to_obj(vals[0])).format("YYYY-MM-DD");
			var to_date = moment(frappe.datetime.user_to_obj(vals[vals.length - 1])).format(
				"YYYY-MM-DD"
			);
			return [from_date, to_date];
		}
	}
	format_for_input(value1, value2) {
		if (value1 && value2) {
			value1 = frappe.datetime.str_to_user(value1, false, true);
			value2 = frappe.datetime.str_to_user(value2, false, true);
			return __("{0} to {1}", [value1, value2]);
		}
		return "";
	}
};
