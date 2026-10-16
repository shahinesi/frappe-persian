let pickerPromise;

export function loadPersianDatePicker() {
	if (!pickerPromise) {
		pickerPromise = frappe.require("persian_datepicker.bundle.js").then(() => {
			const PersianDatePicker = frappe.ui.form.PersianDatePicker;
			if (!PersianDatePicker) throw new Error("Persian datepicker bundle failed to load");
			return PersianDatePicker;
		});
	}
	return pickerPromise;
}
