import assert from "node:assert/strict";
import test from "node:test";
import { formatLocalizedNumber } from "./formatLocalizedNumber.ts";

test("Persian onboarding numbers stay ASCII for Vazirmatn ss01", () => {
	assert.equal(formatLocalizedNumber(12345.6, "fa-IR"), "12,345.6");
	assert.doesNotMatch(formatLocalizedNumber(12345.6, "fa-IR"), /[۰-۹٠-٩]/);
});

test("English onboarding numbers keep their existing formatting", () => {
	assert.equal(formatLocalizedNumber(12345.6, "en"), "12,345.6");
});
