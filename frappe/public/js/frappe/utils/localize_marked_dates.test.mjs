import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { localizeMarkedDates } from "./localize_marked_dates.mjs";

function marker(attributes = {}) {
	const values = new Map(Object.entries(attributes));
	return {
		textContent: attributes.text || "server fallback",
		getAttribute: (name) => values.get(name) ?? null,
		setAttribute: (name, value) => values.set(name, value),
		attribute: (name) => values.get(name) ?? null,
	};
}

function rootFor(dates = [], titles = []) {
	return {
		querySelectorAll: (selector) =>
			selector === "[data-frappe-date]" ? dates : titles,
	};
}

describe("localizeMarkedDates", () => {
	it("formats Persian date and datetime markers without changing canonical values", () => {
		const date = marker({ "data-frappe-date": "2026-03-21", "data-frappe-date-type": "date" });
		const datetime = marker({ "data-frappe-date": "2026-03-21 20:30:00", "data-frappe-date-type": "datetime" });
		const title = marker({ "data-frappe-date-title": "2026-03-21 20:30:00", title: "Gregorian fallback" });
		const calls = [];
		const formatDate = (value, onlyDate) => {
			calls.push([value, onlyDate]);
			return `${onlyDate ? "date" : "datetime"}:${value}`;
		};

		localizeMarkedDates(rootFor([date, datetime], [title]), "fa-IR", formatDate);

		assert.equal(date.textContent, "date:2026-03-21");
		assert.equal(datetime.textContent, "datetime:2026-03-21 20:30:00");
		assert.equal(date.attribute("data-frappe-date"), "2026-03-21");
		assert.equal(title.attribute("title"), "datetime:2026-03-21 20:30:00");
		assert.deepEqual(calls, [
			["2026-03-21", true],
			["2026-03-21 20:30:00", false],
			["2026-03-21 20:30:00", false],
		]);
	});

	it("leaves English output and server fallback text unchanged", () => {
		const date = marker({ "data-frappe-date": "2026-03-21", text: "March 21, 2026" });
		let called = false;

		localizeMarkedDates(rootFor([date]), "en", () => (called = true));

		assert.equal(date.textContent, "March 21, 2026");
		assert.equal(called, false);
	});

	it("keeps the server fallback when a date cannot be formatted", () => {
		const date = marker({ "data-frappe-date": "invalid", text: "unformatted fallback" });

		localizeMarkedDates(rootFor([date]), "fa", () => "");

		assert.equal(date.textContent, "unformatted fallback");
	});
});
