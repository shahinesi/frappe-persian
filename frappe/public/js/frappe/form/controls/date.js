import { getJalaliMonthGridRange, shiftJalaliMonth } from "../../views/calendar/persian_calendar.js";

frappe.ui.form.ControlDate = class ControlDate extends frappe.ui.form.ControlData {
	static trigger_change_on_input_event = false;
	make_input() {
		super.make_input();
		this.make_picker();
	}
	make_picker() {
		this.set_date_options();
		this.set_datepicker();
		this.set_t_for_today();
	}
	set_formatted_input(value) {
		if (value === "Today") {
			value = this.get_now_date();
		}

		super.set_formatted_input(value);
		if (this.timepicker_only) return;
		if (!this.datepicker) return;
		if (!value) {
			this.datepicker.clear();
			this.datepicker.date = this.get_now_date();
			return;
		}

		let should_refresh = this.last_value && this.last_value !== value;

		if (!should_refresh) {
			if (this.datepicker.selectedDates.length > 0) {
				// if date is selected but different from value, refresh
				const selected_date = moment(this.datepicker.selectedDates[0]).format(
					this.date_format
				);

				should_refresh = selected_date !== value;
			} else {
				// if datepicker has no selected date, refresh
				should_refresh = true;
			}
		}

		if (should_refresh) {
			const date = frappe.datetime.str_to_obj(value);
			this._suppress_change = true;
			this.datepicker.selectDate(date);
			this._suppress_change = false;
			this.datepicker.date = date;
		}
	}
	set_date_options() {
		// webformTODO:
		let sysdefaults = frappe.boot.sysdefaults;

		let lang = frappe.boot.user?.language || frappe.boot.lang || "en";
		this.jalali_calendar = /^fa(?:[-_]|$)/i.test(lang);
		if (!$.fn.datepicker.language[lang]) {
			lang = "en";
		}

		let date_format =
			sysdefaults && sysdefaults.date_format ? sysdefaults.date_format : "yyyy-mm-dd";

		this.today_text = __("Today");
		this.date_format = frappe.defaultDateFormat;
		this.datepicker_options = {
			language: lang,
			// Air Datepicker renders Gregorian months. In Persian, use the
			// shared Jalali FullCalendar view instead of exposing that grid.
			...(this.jalali_calendar ? { showEvent: "frappe-jalali-picker-open" } : {}),
			autoClose: true,
			todayButton: true,
			dateFormat: date_format,
			startDate: this.get_start_date(),
			keyboardNav: false,
			minDate: this.df.min_date,
			maxDate: this.df.max_date,
			firstDay: frappe.datetime.get_first_day_of_the_week_index(),
			onSelect: (formattedDate, selectedDate) => {
				if (!this._suppress_change) {
					if (this.jalali_calendar && selectedDate instanceof Date) {
						const canonicalFormat = this.datepicker_options.timepicker
							? "YYYY-MM-DD HH:mm:ss"
							: "YYYY-MM-DD";
						this.$input.val(
							this.format_for_input(moment(selectedDate).format(canonicalFormat))
						);
					}
					this.$input.trigger("change");
				}
			},
			onShow: () => {
				this.datepicker.$datepicker
					.find(".datepicker--button:visible")
					.text(this.today_text);

				this.update_datepicker_position();
			},
			onRenderCell: (date, cellType) => {
				if (cellType === "day" && this.df.disabled_dates) {
					const formattedDate = moment(date).format("YYYY-MM-DD");
					if (this.df.disabled_dates.includes(formattedDate)) {
						return {
							disabled: true,
							classes: "disabled",
						};
					}
				}
			},
			...this.get_df_options(),
		};
	}

	get_start_date() {
		return this.get_now_date();
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

		// today button didn't work as expected,
		// so explicitly bind the event
		this.datepicker.$datepicker.find('[data-action="today"]').click(() => {
			this.datepicker.selectDate(this.get_now_date());
			this.datepicker.hide();
		});
	}
	show_jalali_datepicker() {
		if (!this.jalali_calendar || this.jalali_picker_loading || this.jalali_picker) return;
		this.jalali_picker_loading = frappe
			.require("calendar.bundle.js")
			.then(() => {
				this.jalali_picker_loading = null;
				if (!this.$input || !document.contains(this.$input.get(0))) return;
				this.make_jalali_datepicker();
			})
			.catch((error) => {
				this.jalali_picker_loading = null;
				console.error("Failed to load the Jalali date picker", error);
			});
	}
	make_jalali_datepicker() {
		if (this.jalali_calendar_range) {
			let selectedDates = this.datepicker.selectedDates || [];
			if (selectedDates.length < 2 && Array.isArray(this.value)) {
				selectedDates = this.value.map((value) => frappe.datetime.str_to_obj(value));
			}
			this.jalali_range_start = selectedDates[0] ? new Date(selectedDates[0]) : null;
			this.jalali_range_end = selectedDates[1] ? new Date(selectedDates[1]) : null;
		}
		const wrapper = document.createElement("div");
		wrapper.className = "frappe-jalali-date-picker";
		wrapper.setAttribute("role", "dialog");
		wrapper.setAttribute("aria-label", __("Select date"));

		const toolbar = document.createElement("div");
		toolbar.className = "frappe-jalali-date-picker__toolbar";
		const previous = this.make_jalali_picker_button("Previous");
		const title = document.createElement("span");
		title.className = "frappe-jalali-date-picker__title";
		title.setAttribute("aria-live", "polite");
		const next = this.make_jalali_picker_button("Next");
		const today = this.make_jalali_picker_button("Today");
		today.classList.add("frappe-jalali-date-picker__today");
		const apply = this.jalali_calendar_range
			? this.make_jalali_picker_button("Apply")
			: null;
		if (apply) {
			apply.disabled = true;
			apply.classList.add("frappe-jalali-date-picker__apply");
		}
		toolbar.append(previous, title, next, today);
		if (apply) toolbar.append(apply);

		const calendarElement = document.createElement("div");
		calendarElement.className = "frappe-jalali-date-picker__calendar";
		wrapper.append(toolbar, calendarElement);
		wrapper.addEventListener("keydown", (event) => {
			if (event.key === "Escape") this.hide_jalali_datepicker();
		});
		document.body.appendChild(wrapper);

		const selectedDate = this.datepicker.selectedDates[0] || this.get_start_date();
		const initialDate =
			selectedDate instanceof Date ? selectedDate : frappe.datetime.str_to_obj(selectedDate);
		const validRange = {};
		if (this.df.min_date) validRange.start = this.df.min_date;
		if (this.df.max_date) {
			const maxDate = frappe.datetime.str_to_obj(this.df.max_date);
			maxDate.setDate(maxDate.getDate() + 1);
			validRange.end = maxDate;
		}

		const calendar = new frappe.FullCalendar(calendarElement, {
			plugins: frappe.FullCalendar.Plugins,
			locales: frappe.FullCalendar.Locales,
			locale: frappe.FullCalendar.PersianLocaleCode,
			initialView: "jalaliMonth",
			initialDate,
			firstDay: frappe.datetime.get_first_day_of_the_week_index(),
			views: {
				jalaliMonth: {
					type: "dayGrid",
					visibleRange: (currentDate) =>
						getJalaliMonthGridRange(
							currentDate,
							frappe.datetime.get_first_day_of_the_week_index()
						),
				},
			},
			headerToolbar: false,
			validRange: Object.keys(validRange).length ? validRange : undefined,
			dayCellContent: (arg) =>
				frappe.datetime.format_persian_calendar(arg.date, "D") || arg.dayNumberText,
			dayHeaderContent: (arg) =>
				frappe.datetime.format_persian_calendar(arg.date, "ddd") || arg.text,
			dayCellDidMount: (arg) => {
				if (this.df.disabled_dates?.includes(moment(arg.date).format("YYYY-MM-DD"))) {
					arg.el.classList.add("fc-day-disabled");
					arg.el.setAttribute("aria-disabled", "true");
				}
			},
			dateClick: (info) => {
				if (this.df.disabled_dates?.includes(moment(info.date).format("YYYY-MM-DD"))) return;
				const date = new Date(
					info.date.getFullYear(),
					info.date.getMonth(),
					info.date.getDate()
				);
				if (this.jalali_calendar_range) {
					if (!this.jalali_range_start || this.jalali_range_end) {
						this.jalali_range_start = date;
						this.jalali_range_end = null;
						apply.disabled = true;
					} else if (date < this.jalali_range_start) {
						this.jalali_range_end = this.jalali_range_start;
						this.jalali_range_start = date;
						apply.disabled = false;
					} else {
						this.jalali_range_end = date;
						apply.disabled = false;
					}
					const end = new Date(this.jalali_range_end || this.jalali_range_start);
					end.setDate(end.getDate() + 1);
					calendar.select({ start: this.jalali_range_start, end });
					return;
				}
				if (this.datepicker.timepicker) {
					const current = this.datepicker.selectedDates[0] || this.get_now_date();
					date.setHours(current.getHours(), current.getMinutes(), current.getSeconds(), 0);
				}
				this.datepicker.selectDate(date);
				this.hide_jalali_datepicker();
			},
			datesSet: () => {
				title.textContent =
					frappe.datetime.format_persian_calendar(calendar.getDate(), "MMMM YYYY") || "";
			},
		});
		this.jalali_picker = { calendar, wrapper };

		previous.addEventListener("click", () => {
			const date = shiftJalaliMonth(calendar.getDate(), -1);
			if (date) calendar.gotoDate(date);
		});
		next.addEventListener("click", () => {
			const date = shiftJalaliMonth(calendar.getDate(), 1);
			if (date) calendar.gotoDate(date);
		});
		today.addEventListener("click", () => {
			if (this.jalali_calendar_range) {
				this.jalali_range_start = null;
				this.jalali_range_end = null;
				apply.disabled = true;
				calendar.unselect();
				calendar.gotoDate(this.get_now_date());
				return;
			}
			this.datepicker.selectDate(this.get_now_date());
			this.hide_jalali_datepicker();
		});
		if (apply) {
			apply.addEventListener("click", () => {
				if (!this.jalali_range_start) return;
				this.datepicker.selectDate([
					this.jalali_range_start,
					this.jalali_range_end || this.jalali_range_start,
				]);
				this.hide_jalali_datepicker();
			});
		}

		this.position_jalali_datepicker();
		calendar.render();
		if (apply && this.jalali_range_start && this.jalali_range_end) {
			const end = new Date(this.jalali_range_end);
			end.setDate(end.getDate() + 1);
			calendar.select({ start: this.jalali_range_start, end });
			apply.disabled = false;
		}
		this.position_jalali_datepicker();
		this.jalali_picker_outside_listener = (event) => {
			if (
				!wrapper.contains(event.target) &&
				!this.$input.get(0).contains(event.target)
			) {
				this.hide_jalali_datepicker();
			}
		};
		document.addEventListener("mousedown", this.jalali_picker_outside_listener);
		this.jalali_picker_position_listener = () => this.position_jalali_datepicker();
		window.addEventListener("resize", this.jalali_picker_position_listener);
		window.addEventListener("scroll", this.jalali_picker_position_listener, true);
	}
	make_jalali_picker_button(label) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "btn btn-xs btn-default";
		button.textContent = __(label);
		button.setAttribute("aria-label", __(label));
		return button;
	}
	position_jalali_datepicker() {
		if (!this.jalali_picker) return;
		const rect = this.$input.get(0).getBoundingClientRect();
		const wrapper = this.jalali_picker.wrapper;
		const left = Math.min(
			window.scrollX + rect.left,
			window.scrollX + window.innerWidth - wrapper.offsetWidth - 8
		);
		const below = rect.bottom + 6;
		const top =
			below + wrapper.offsetHeight > window.innerHeight && rect.top > wrapper.offsetHeight + 6
				? rect.top - wrapper.offsetHeight - 6
				: below;
		wrapper.style.left = `${Math.max(8, left)}px`;
		wrapper.style.top = `${window.scrollY + top}px`;
	}
	hide_jalali_datepicker() {
		if (!this.jalali_picker) return;
		document.removeEventListener("mousedown", this.jalali_picker_outside_listener);
		window.removeEventListener("resize", this.jalali_picker_position_listener);
		window.removeEventListener("scroll", this.jalali_picker_position_listener, true);
		this.jalali_picker.calendar.destroy();
		this.jalali_picker.wrapper.remove();
		this.jalali_picker = null;
	}
	update_datepicker_position() {
		// show datepicker above or below the input

		const $input = this.$input;
		const $datepicker = this.datepicker.$datepicker;

		const input_offset = $input.offset().top;
		const input_height = $input.outerHeight();
		const window_height = $(window).height();
		const scroll_top = $(window).scrollTop();

		const picker_height = $datepicker.outerHeight() + 12; // Add default offset

		const space_below = window_height - (input_offset - scroll_top + input_height);
		const space_above = input_offset - scroll_top;

		let position = "bottom left";

		if (space_below < picker_height && space_above > picker_height) {
			position = "top left";
			if (this.timepicker_only) this.datepicker.opts["offset"] = -30;
		} else {
			position = "bottom left";
			if (this.timepicker_only) this.datepicker.opts["offset"] = 12;
		}

		this.datepicker.update("position", position);
	}
	get_now_date() {
		return frappe.datetime
			.convert_to_system_tz(frappe.datetime.now_date(true), false)
			.toDate();
	}
	set_t_for_today() {
		var me = this;
		this.$input.on("keydown", function (e) {
			if (e.which === 84) {
				// 84 === t
				if (me.df.fieldtype == "Date") {
					me.set_value(frappe.datetime.nowdate());
				}
				if (me.df.fieldtype == "Datetime") {
					me.set_value(frappe.datetime.now_datetime());
				}
				if (me.df.fieldtype == "Time") {
					me.set_value(frappe.datetime.now_time());
				}
				return false;
			}
		});
	}

	eval_expression(value, type) {
		if (!value || !type) {
			return value;
		}
		const parsed_components = value.match(/[\+\-]\s*\d*\.?\d+\s*[a-zA-Z]/g);

		let system_fmt;
		switch (type) {
			case "date":
				system_fmt = "YYYY-MM-DD";
				value = frappe.datetime.user_to_str(value, false);
				break;

			case "time":
				system_fmt = "HH:mm:ss";
				value = frappe.datetime.user_to_str(value, true);
				break;

			case "datetime":
				system_fmt = "YYYY-MM-DD HH:mm:ss";
				value = frappe.datetime.user_to_str(value, false);
				break;
		}

		if (!parsed_components) {
			return value;
		}

		let time_to_add = {};
		parsed_components.forEach((component) => {
			let operator = component.match(/[\+\-]/)[0];
			let number = flt(component.match(/\d*\.?\d+/)[0]);
			let unit = component.match(/[a-zA-Z]+/)[0];
			let period;

			if (operator === "-") {
				number = -number;
			}

			if (["datetime", "date"].includes(type)) {
				if (unit.toLowerCase() === "d") {
					period = "days";
				} else if (unit === "M") {
					period = "months";
				} else if (unit.toLowerCase() === "y") {
					period = "years";
				}
			}

			if (["datetime", "time"].includes(type)) {
				if (unit.toLowerCase() === "h") {
					period = "hours";
				} else if (unit === "m") {
					period = "minutes";
				} else if (unit.toLowerCase() === "s") {
					period = "seconds";
				}
			}

			if (period) {
				time_to_add[period] = (time_to_add[period] || 0) + number;
			}
		});

		if (Object.keys(time_to_add).length) {
			value = moment(value, system_fmt).add(time_to_add).format(system_fmt);
		}

		return value;
	}

	parse(value) {
		if (value) {
			if (value == "Invalid date") {
				return "";
			}
			return this.eval_expression(value, "date");
		}
	}
	format_for_input(value) {
		if (value) {
			return frappe.datetime.str_to_user(value, false, true);
		}
		return "";
	}
	validate(value) {
		if (value && !frappe.datetime.validate(value)) {
			let sysdefaults = frappe.sys_defaults;
			let date_format =
				sysdefaults && sysdefaults.date_format ? sysdefaults.date_format : "yyyy-mm-dd";
			frappe.msgprint(__("Date {0} must be in format: {1}", [value, date_format]));
			return "";
		}
		return value;
	}
	get_df_options() {
		let df_options = this.df.options;
		if (!df_options) return {};

		let options = {};
		if (typeof df_options === "string") {
			try {
				options = JSON.parse(df_options);
			} catch (error) {
				console.warn(`Invalid JSON in options of "${this.df.fieldname}"`);
			}
		} else if (typeof df_options === "object") {
			options = df_options;
		}
		return options;
	}
};
