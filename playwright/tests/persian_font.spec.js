import { test, expect } from "../support";

test("Desk loads Vazirmatn for Persian and keeps the default stack for English", async ({ page, desk }) => {
	await page.goto("/desk/website");
	await desk.ready();

	const body = page.locator("body");
	await page.locator("html").evaluate((element) => {
		element.lang = "fa";
	});
	await expect(body).toHaveCSS("font-family", /Vazirmatn/);

	const font_loaded = await page.evaluate(async () => {
		const faces = await document.fonts.load('16px "Vazirmatn"', "فارسی");
		return faces.some((face) => face.family === "Vazirmatn" && face.status === "loaded");
	});
	expect(font_loaded).toBe(true);

	await page.locator("html").evaluate((element) => {
		element.lang = "en";
	});
	await expect(body).not.toHaveCSS("font-family", /Vazirmatn/);
});
