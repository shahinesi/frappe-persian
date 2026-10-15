import {
	getISODateFromPersianDate,
	getPersianCalendarMonth,
	getPersianDateFromISO,
} from "./persian_calendar.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/** Native Desk calendar UI backed by browser calendar data and ISO dates. */
export default class PersianDatePicker {
	constructor({ input, locale, range = false, minDate, maxDate, disabledDates, onSelect }) {
		this.input = input;
		this.locale = locale;
		this.range = range;
		this.minDate = minDate || "";
		this.maxDate = maxDate || "";
		this.disabledDates = new Set(disabledDates || []);
		this.onSelect = onSelect;
		this.value = null;
		this.rangeStart = null;
		this.visibleDate = null;
		this.wrapper = document.createElement("div");
		this.wrapper.className = "datepicker persian-datepicker";
		this.wrapper.setAttribute("role", "dialog");
		this.wrapper.setAttribute("aria-label", __("Persian calendar"));
		this.wrapper.dir = "rtl";
		this.wrapper.hidden = true;
		document.body.appendChild(this.wrapper);
		this.wrapper.addEventListener("click", (event) => this.handleClick(event));
		this.wrapper.addEventListener("keydown", (event) => this.handleKeydown(event));
		this.onOutsideClick = (event) => {
			if (!this.wrapper.contains(event.target) && !this.input.contains(event.target)) {
				this.hide();
			}
		};
		this.onFocusOutside = (event) => {
			if (!this.wrapper.contains(event.target) && !this.input.contains(event.target)) {
				this.hide();
			}
		};
		this.onFocus = () => {
			if (this.skipOpenOnFocus) {
				this.skipOpenOnFocus = false;
				return;
			}
			this.show(this.value);
		};
		this.onClick = () => {
			if (this.wrapper.hidden) this.show(this.value);
		};
		this.input.addEventListener("focus", this.onFocus);
		this.input.addEventListener("click", this.onClick);
	}

	setValue(value) {
		if (this.range) {
			this.value = Array.isArray(value) ? value.slice(0, 2) : null;
		} else {
			this.value = typeof value === "string" && value ? value : null;
		}
		if (!this.wrapper.hidden) this.render();
	}

	show(value) {
		const initial = Array.isArray(value) ? value[0] : value;
		this.visibleDate = initial || frappe.datetime.get_today();
		this.rangeStart = null;
		this.wrapper.hidden = false;
		this.render();
		this.position();
		document.addEventListener("mousedown", this.onOutsideClick);
		document.addEventListener("focusin", this.onFocusOutside);
		const focusTarget =
			this.wrapper.querySelector(`[data-iso="${this.visibleDate}"]:not([disabled])`) ||
			this.wrapper.querySelector("[data-iso]:not([disabled])");
		focusTarget?.focus();
	}

	hide() {
		this.wrapper.hidden = true;
		document.removeEventListener("mousedown", this.onOutsideClick);
		document.removeEventListener("focusin", this.onFocusOutside);
	}

	focusInput() {
		this.skipOpenOnFocus = true;
		this.input.focus({ preventScroll: true });
		if (document.activeElement === this.input) this.skipOpenOnFocus = false;
	}

	position() {
		const rect = this.input.getBoundingClientRect();
		const pickerWidth = this.wrapper.getBoundingClientRect().width;
		const maxLeft = Math.max(8, window.innerWidth - pickerWidth - 8);
		const left = Math.min(Math.max(8, rect.left), maxLeft);
		this.wrapper.style.top = `${rect.bottom + 4}px`;
		this.wrapper.style.left = `${left}px`;
	}

	changeMonth(offset) {
		const current = getPersianDateFromISO(this.visibleDate);
		let year = current.year;
		let month = current.month + offset;
		if (month < 1) {
			month = 12;
			year -= 1;
		} else if (month > 12) {
			month = 1;
			year += 1;
		}
		this.visibleDate = getISODateFromPersianDate({ year, month, day: 1 });
		this.render();
		const title = this.wrapper.querySelector(".datepicker--nav-title");
		title?.focus();
	}

	render() {
		const date = getPersianDateFromISO(this.visibleDate);
		const month = getPersianCalendarMonth(date.year, date.month, this.locale);
		const digits = new Intl.NumberFormat(this.locale, { useGrouping: false });
		const title = `${month.monthName} ${month.yearLabel}`;
		const nav = document.createElement("div");
		nav.className = "datepicker--nav";
		const previous = this.createNavButton("prev", "‹", "Previous month");
		const next = this.createNavButton("next", "›", "Next month");
		const titleElement = document.createElement("div");
		titleElement.className = "datepicker--nav-title";
		titleElement.tabIndex = -1;
		titleElement.setAttribute("aria-live", "polite");
		titleElement.textContent = title;
		nav.append(next, titleElement, previous);

		const names = document.createElement("div");
		names.className = "datepicker--days-names";
		month.weekdayLabels.forEach((label, index) => {
			const dayName = document.createElement("span");
			dayName.className = "datepicker--day-name";
			dayName.textContent = label;
			dayName.setAttribute("aria-label", month.weekdayAriaLabels[index]);
			dayName.title = month.weekdayAriaLabels[index];
			names.appendChild(dayName);
		});

		const cells = document.createElement("div");
		cells.className = "datepicker--cells datepicker--days";
		const range = this.range ? this.value : null;
		month.weeks.flat().forEach((cell) => {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "datepicker--cell -day-";
			button.dataset.iso = cell.isoDate;
			button.textContent = cell.dayLabel || digits.format(cell.persianDate.day);
			button.setAttribute(
				"aria-label",
				`${month.weekdayAriaLabels[cell.weekday]} ${button.textContent} ${
					month.monthName
				} ${month.yearLabel}`
			);
			button.setAttribute("aria-pressed", String(this.isSelected(cell.isoDate)));
			if (!cell.isCurrentMonth) button.classList.add("-other-month-");
			if (cell.isoDate === frappe.datetime.get_today()) button.classList.add("-current-");
			if (this.isSelected(cell.isoDate)) button.classList.add("-selected-");
			if (range?.length === 2 && cell.isoDate > range[0] && cell.isoDate < range[1]) {
				button.classList.add("-in-range-");
			}
			if (cell.isoDate === range?.[0]) button.classList.add("-range-from-");
			if (cell.isoDate === range?.[1]) button.classList.add("-range-to-");
			button.disabled = this.isDisabled(cell.isoDate);
			cells.appendChild(button);
		});

		const footer = document.createElement("div");
		footer.className = "datepicker--buttons";
		const today = document.createElement("button");
		today.type = "button";
		today.className = "datepicker--button";
		today.dataset.action = "today";
		today.textContent = __("Today");
		footer.appendChild(today);

		this.wrapper.replaceChildren(nav, names, cells, footer);
	}

	createNavButton(action, label, accessibleLabel) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "datepicker--nav-action";
		button.dataset.action = action;
		button.setAttribute("aria-label", __(accessibleLabel));
		button.textContent = label;
		return button;
	}

	isSelected(isoDate) {
		return this.range
			? Boolean(this.value?.includes(isoDate) || this.rangeStart === isoDate)
			: this.value === isoDate;
	}

	isDisabled(isoDate) {
		return (
			(this.minDate && isoDate < this.minDate) ||
			(this.maxDate && isoDate > this.maxDate) ||
			this.disabledDates.has(isoDate)
		);
	}

	handleClick(event) {
		const action = event.target.closest("[data-action]")?.dataset.action;
		if (action === "prev" || action === "next") {
			this.changeMonth(action === "prev" ? -1 : 1);
			return;
		}
		if (action === "today") {
			this.select(frappe.datetime.get_today());
			return;
		}
		const isoDate = event.target.closest("[data-iso]")?.dataset.iso;
		if (isoDate && !this.isDisabled(isoDate)) this.select(isoDate);
	}

	handleKeydown(event) {
		if (event.key === "Escape") {
			event.preventDefault();
			event.stopPropagation();
			this.hide();
			this.focusInput();
			return;
		}
		const current = event.target.closest("[data-iso]")?.dataset.iso;
		const offset = { ArrowRight: -1, ArrowLeft: 1, ArrowDown: 7, ArrowUp: -7 }[event.key];
		if (!current || !offset) return;
		event.preventDefault();
		const [year, month, day] = current.split("-").map(Number);
		const date = new Date(Date.UTC(year, month - 1, day) + offset * DAY_IN_MS);
		const isoDate = date.toISOString().slice(0, 10);
		if (
			getPersianDateFromISO(isoDate).month !== getPersianDateFromISO(this.visibleDate).month
		) {
			this.visibleDate = isoDate;
			this.render();
		}
		this.wrapper.querySelector(`[data-iso="${isoDate}"]`)?.focus();
	}

	select(isoDate) {
		if (this.range) {
			if (!this.rangeStart) {
				this.rangeStart = isoDate;
				this.render();
				this.wrapper.querySelector(`[data-iso="${isoDate}"]`)?.focus();
				return;
			}
			const values = [this.rangeStart, isoDate].sort();
			this.value = values;
			this.rangeStart = null;
			this.onSelect(values);
			this.hide();
			this.focusInput();
			return;
		}
		this.value = isoDate;
		this.onSelect(isoDate);
		this.hide();
		this.focusInput();
	}

	destroy() {
		this.hide();
		this.input.removeEventListener("focus", this.onFocus);
		this.input.removeEventListener("click", this.onClick);
		this.wrapper.remove();
	}
}
