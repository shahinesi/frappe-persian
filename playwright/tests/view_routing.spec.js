import { test, expect, TEST_USER } from "../support";

const pathname = (page) => new URL(page.url()).pathname;

async function expect_list_view(page, view_name) {
	await expect.poll(() => page.evaluate(() => window.cur_list?.view_name)).toBe(view_name);
}

function setup_default_view(api, args) {
	return api.call("frappe.tests.ui_test_helpers.setup_default_view", args);
}

function list_loaded(page) {
	return page.waitForResponse(
		(res) =>
			res.request().method() === "POST" &&
			res.url().includes("/api/method/frappe.desk.reportview.get")
	);
}

test.describe("View", () => {
	test.afterAll(async ({ admin }) => {
		await admin.remove_doc("Property Setter", "Event-main-default_view", true);
		await admin.remove_doc(
			"Property Setter",
			"Event-main-force_re_route_to_default_view",
			true
		);
		await admin.update_doc("User", TEST_USER, { user_emails: [] });
		await admin.remove_doc("Email Account", "Email Linking", true);
	});

	test("Route to ToDo List View", async ({ page, desk }) => {
		await page.goto("/desk/todo/view/list");
		await desk.ready();
		await expect_list_view(page, "List");
	});

	test("Route to ToDo Report View", async ({ page, desk }) => {
		await page.goto("/desk/todo/view/report");
		await desk.ready();
		await expect_list_view(page, "Report");
	});

	test("Route to ToDo Dashboard View", async ({ page, desk }) => {
		await page.goto("/desk/todo/view/dashboard");
		await desk.ready();
		await expect_list_view(page, "Dashboard");
	});

	test("Route to ToDo Gantt View", async ({ page, desk }) => {
		await page.goto("/desk/todo/view/gantt");
		await desk.ready();
		await expect_list_view(page, "Gantt");
	});

	test("Route to ToDo Kanban View", async ({ page, desk, api }) => {
		await api.call("frappe.tests.ui_test_helpers.create_kanban");
		await page.goto("/desk/note/view/kanban/_Note _Kanban");
		await desk.ready();
		await expect_list_view(page, "Kanban");
	});

	test("Route to ToDo Calendar View", async ({ page, desk }) => {
		await page.goto("/desk/todo/view/calendar");
		await desk.ready();
		await expect_list_view(page, "Calendar");
	});

	test("Persian Calendar view uses Jalali dates, canonical digits and an RTL Saturday-first locale", async ({
		page,
		desk,
	}) => {
		await page.goto("/desk/todo/view/calendar");
		await desk.ready();

		const options = await page.evaluate(() => {
			const previousLanguage = frappe.boot.lang;
			frappe.boot.lang = "fa-IR";
			try {
				const view = Object.create(frappe.views.Calendar.prototype);
				view.setup_options({ initialView: "dayGridMonth", weekends: true });
				view.fullCalendar = {
					view: { type: "jalaliMonth" },
					getDate: () => new Date(2026, 2, 21),
				};
				const persian = frappe.FullCalendar.Locales.find(
					(locale) => locale.code === frappe.FullCalendar.PersianLocaleCode
				);
				const range = view.cal_options.views.jalaliMonth.visibleRange(
					new Date(2026, 2, 21)
				);
				const localDate = (date) =>
					`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
						2,
						"0"
					)}-${String(date.getDate()).padStart(2, "0")}`;
				return {
					calendarLocale: view.cal_options.locale,
					localeCode: persian?.code,
					direction: persian?.direction,
					firstDay: persian?.week?.dow,
					initialView: view.cal_options.initialView,
					monthRange: [localDate(range.start), localDate(range.end)],
					monthTitle: view.get_calendar_title({ type: "jalaliMonth", title: "unused" }),
					dayText: view.cal_options.dayCellContent({
						date: new Date(2026, 2, 21),
						dayNumberText: "۲۱",
					}),
					monthHeader: view.cal_options.dayHeaderContent({
						date: new Date(2026, 2, 21),
						text: "Sat",
					}),
					weekHeader: (() => {
						view.fullCalendar.view.type = "timeGridWeek";
						return view.cal_options.dayHeaderContent({
							date: new Date(2026, 2, 21),
							text: "Sat 21",
						});
					})(),
					popoverDate: view.cal_options.dayPopoverFormat(new Date(2026, 2, 21)),
					eventNumbering: view.cal_options.eventTimeFormat.numberingSystem,
					english: (() => {
						frappe.boot.lang = "en-US";
						const english = Object.create(frappe.views.Calendar.prototype);
						english.setup_options({ initialView: "dayGridMonth", weekends: true });
						return {
							locale: english.cal_options.locale,
							initialView: english.cal_options.initialView,
							numbering:
								english.cal_options.eventTimeFormat.numberingSystem || "default",
						};
					})(),
				};
			} finally {
				frappe.boot.lang = previousLanguage;
			}
		});

		expect(options).toEqual({
			calendarLocale: "fa-IR-u-ca-gregory-nu-latn",
			localeCode: "fa-IR-u-ca-gregory-nu-latn",
			direction: "rtl",
			firstDay: 6,
			initialView: "jalaliMonth",
			monthRange: ["2026-03-21", "2026-04-25"],
			monthTitle: "فروردین 1405",
			dayText: "1",
			monthHeader: "ش",
			weekHeader: "ش 1",
			popoverDate: "شنبه، 1 فروردین 1405",
			eventNumbering: "latn",
			english: {
				locale: "en-US",
				initialView: "dayGridMonth",
				numbering: "default",
			},
		});
	});

	test("Route to Custom Tree View", async ({ page, desk, api }) => {
		await api.call("frappe.tests.ui_test_helpers.setup_tree_doctype");
		await page.goto("/desk/custom-tree/view/tree");
		await desk.ready();
		await expect.poll(() => page.evaluate(() => window.cur_tree?.view_name)).toBe("Tree");
	});

	test("Route to Custom Image View", async ({ page, desk, api }) => {
		await api.call("frappe.tests.ui_test_helpers.setup_image_doctype");
		await page.goto("/app/custom-image/view/image");
		await desk.ready();
		await expect_list_view(page, "Image");
	});

	test("Route to Communication Inbox View", async ({ page, desk, api }) => {
		await api.call("frappe.tests.ui_test_helpers.setup_inbox");
		await page.goto("/app/communication/view/inbox");
		await desk.ready();
		await expect_list_view(page, "Inbox");
	});

	test("Route to File View", async ({ page }) => {
		let loaded = list_loaded(page);
		await page.goto("/app/file");
		await loaded;
		await expect_list_view(page, "File");
		await expect.poll(() => page.evaluate(() => cur_list.current_folder)).toBe("Home");

		loaded = list_loaded(page);
		await page.goto("/app/file/view/home/Attachments");
		await loaded;
		await expect_list_view(page, "File");
		await expect
			.poll(() => page.evaluate(() => cur_list.current_folder))
			.toBe("Home/Attachments");
	});

	test("Re-route to default view", async ({ page, desk, api }) => {
		await setup_default_view(api, { view: "Report" });
		await page.goto("/app/event");
		await desk.ready();
		await expect_list_view(page, "Report");
	});

	test("Route to default view from app/{doctype}", async ({ page, desk, api }) => {
		await setup_default_view(api, { view: "Report" });
		await page.goto("/desk/event");
		await desk.ready();
		await expect_list_view(page, "Report");
	});

	test("Route to default view from app/{doctype}/view", async ({ page, desk, api }) => {
		await setup_default_view(api, { view: "Report" });
		await page.goto("/desk/event/view");
		await desk.ready();
		await expect_list_view(page, "Report");
	});

	test("Force Route to default view from app/{doctype}", async ({ page, desk, api }) => {
		await setup_default_view(api, { view: "Report", force_reroute: true });
		await page.goto("/desk/event");
		await desk.ready();
		await expect_list_view(page, "Report");
	});

	test("Force Route to default view from app/{doctype}/view", async ({ page, desk, api }) => {
		await setup_default_view(api, { view: "Report", force_reroute: true });
		await page.goto("/desk/event/view");
		await desk.ready();
		await expect_list_view(page, "Report");
	});

	test("Force Route to default view from app/{doctype}/view/list", async ({
		page,
		desk,
		api,
	}) => {
		await setup_default_view(api, { view: "Report", force_reroute: true });
		await page.goto("/desk/event/view/list");
		await desk.ready();
		await expect_list_view(page, "Report");
	});

	test("Validate Route History for Default View", async ({ page, api }) => {
		await setup_default_view(api, { view: "Report" });
		await page.goto("/desk/event");
		await page.goto("/desk/event/view/list");
		await expect.poll(() => pathname(page)).toMatch(/\/event\/view\/list$/);
		await page.goBack();
		await expect.poll(() => pathname(page)).toMatch(/\/event$/);
	});

	test("Route to Form", async ({ page }) => {
		await page.goto(`/desk/user/${TEST_USER}`);
		await expect.poll(() => page.evaluate(() => window.cur_frm?.doc.name)).toBe(TEST_USER);
	});

	test("Route to Website Workspace", async ({ page }) => {
		await page.goto("/desk/website");
		await expect(page.locator(".navbar-breadcrumbs:visible li:last-child")).toContainText(
			"Website"
		);
	});
});
