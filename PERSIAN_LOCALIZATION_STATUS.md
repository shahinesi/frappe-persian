# Persian Frappe Ecosystem Localization Status

Updated: 2026-10-26. This file tracks the existing Workspace repositories and deployed sites. `NOT RUN` means no result is available.

| Project | Branch / revision | Work and evidence | Tests | Build / deploy | Remaining / next action |
|---|---|---|---|---|---|
| Frappe Framework | `custom/develop-fa` / `4872f83` (local, ahead 25; unpushed) | Full source clone from observed `shahinesi/frappe-persian`. Shared date, relative-time, number and Persian digit changes retained. `frappe.utils.get_formatted_duration` now localizes digits and unit spacing for Persian; duration context translations corrected (`روز`، `ساعت`، `دقیقه`، `ثانیه`). English duration output remains unchanged. Original sparse checkout remains untouched. | Targeted Node VM checks for Persian and English duration PASS; prior date/number/relative-time VM checks PASS; `node --check` and `git diff --check` PASS. Playwright regression added but NOT RUN; pre-commit/build NOT RUN (`node_modules` absent). | NOT RUN | Continue Desk/RTL audit. Git CLI push previously failed HTTP 403 under the configured Windows credential. |
| Frappe UI | `codex/jalali-datepicker` / `87c39de9` (local, ahead 2; remote remains `e85a5450`) | Existing date/calendar and Vazirmatn changes retained. Added Persian fallbacks for shared Combobox defaults `Select option` and `No results`, with a locale-switch regression test. | Node syntax checks and `git diff --check` PASS. Vitest/Component suite NOT RUN (`node_modules` absent). | Build/deploy NOT RUN. | Push not attempted this turn; prior Windows Git credential `rezzmokk-ux` received HTTP 403. Bundled dependencies unavailable in local cache. |
| ERPNext | `custom/develop-fa` / `33ba1d8` (local, ahead 5) | Previous active translations retained. SLA labels/statuses are localized; Persian SLA remaining and on-hold durations use the shared Framework duration formatter, while English keeps Moment humanization. Indicator state remains independent from translated text. Date cells continue through the shared date formatter. | `node --check erpnext/public/js/utils.js` and `git diff --check` PASS; Framework duration source VM and translation catalog checks PASS; ERPNext application tests NOT RUN. | NOT RUN | Full UI audit and staging build/deploy remain. Git CLI push previously failed HTTP 403 under `rezzmokk-ux`. |
| Helpdesk | `feat/persian-setup-wizard` / `ebaf0cd5` (aligned with origin; 28 commits after PR merge) | Prior verified work retained: 28 routes, 13/13 localization tests, 3/3 Python tests, browser verification and test deployment. The current branch has 28 commits after merge commit `19e7d85`; they are not part of PR #1. | Prior results PASS; not rerun this turn. | Prior build/deploy PASS; not rerun this turn. | Continue only on newly found issues. GitHub confirms PR #1 is closed and merged; no new PR or merge. |
| Insights | `custom/develop-fa` / `beffaa9` (local, ahead 9; remote remains `30e30b7`) | Previous locale/date/chart work retained; 149 active UI translations filled. Added translated Copy Link / Copy iFrame / Copy Embed tooltips to chart and dashboard share dialogs; added fa.po and main.pot entries plus a regression test. Five remaining referenced blank entries are product/technical names: ClickHouse, DuckDB, MariaDB, PostgreSQL, Cron. | Existing Node localization suite 6/6 PASS, including Asia/Tehran midnight boundary. Source/catalog assertions PASS; `git diff --check` PASS. New Vitest component-source test NOT RUN (`node_modules` absent). | Build/deploy NOT RUN; registry fetch failed `ERR_PNPM_META_FETCH_FAIL`. | Continue chart/RTL/font/runtime audit. Git CLI push previously failed HTTP 403 under Windows credential `rezzmokk-ux`. |
| Telephony | Server app `develop` / `039cf39` | Installed source inspected in `helpdesk-persian-test-backend-1`; checkout clean, remote is `frappe/telephony`. No Workspace source checkout found. | NOT RUN | NOT RUN | Acquire a managed source checkout before changing or deploying it. |
| Jalali Shamsi Datepicker | Installed version `1.0.0`; public source `Atshan/jalali_shamsi_datepicker`, local `main` / `3db5079` (ahead 3) | Removed the Persian-storage converter gate/path so Jalali calendar input retains Gregorian model/API values. Removed custom `persianToGregorian` and digit parsing; input parsing now delegates to bundled `persian-datepicker`, calendar conversion to bundled `persian-date`, and DateTime uses Frappe system-timezone conversion. Invalid input blocks Save; existing wildcard form handlers and Gregorian ISO preservation remain. | Node built-in integration regression suite 5/5 PASS; JS syntax checks and `git diff --check` PASS. | NOT RUN | Commit `3db5079` is local and unpushed. GitHub metadata confirms pull-only (`push: false`); prior `git push origin main` received HTTP 403 for `rezzmokk-ux`. No branch or PR created. |

## Runtime environments

- `office-staging.localhost`: Frappe 17.0.0-dev, ERPNext 17.0.0-dev, Helpdesk 1.22.2, Insights 4.0.0-dev, Telephony 0.0.1.
- `erp-stage.ircarpet-r.com`: Frappe 16.33.0, ERPNext 16.34.1, Jalali Shamsi Datepicker 1.0.0.
- No deployment was made in this run. The staging images expose apps as `UNVERSIONED` and do not contain Git checkouts; deploy only after source changes can be built from versioned repositories.
- PR #1 is closed and merged at `19e7d85b4ef4e23f284939a74005de824326d78e` (verified through GitHub). The current Helpdesk branch is at `ebaf0cd5e838e3b6b2b2938ea9100e5b721f158a`, 28 commits after that merge; those commits are not merged into `develop`. New merge: NO.

## Next actions

1. Obtain the locked Frappe UI toolchain from a valid cache or CI; current pnpm store has only 13 unrelated package entries. Run the component suite and build before deployment.
2. Continue Insights chart/RTL/font audit, then run Vitest/build when the frontend toolchain is available.
3. Complete framework/ERPNext shared and app-specific UI audits; validate both on their existing staging sites after versioned code is available.
4. Publish only tested commits to their existing refs when authorized credentials are available; do not create a branch, PR, or merge.

## Continuation — 2026-10-27

- Numeric display rule recorded in the Frappe Persian localization Skill and persistent memory: keep canonical ASCII digits and rely on Vazirmatn; only normalize accepted Persian/Arabic text input with `@persian-tools/persian-tools` (`digitsFaToEn`, with `digitsFaToEn(digitsArToFa(input))` for Arabic-Indic input). Calendar conversion uses `jalaali-js`; no handwritten Gregorian/Jalali conversion or `Intl` Persian-calendar conversion.
- Helpdesk: repaired `desk/patches/frappe-ui+1.0.0-rc.1.patch`; its unified diff parses with `git apply --numstat`, and `git diff --check` passes. Chart dates now use the shared patched `jalaali-js` DatePicker helpers, display digit conversion was removed, and numeric formatting explicitly selects `latn`. Focused Node run: 5 tests PASS; 2 date tests FAIL to load because `jalaali-js` is not installed in the checkout. Full suite, build, deploy, commit and push NOT RUN.
- Frappe Framework audit checkout (`custom/develop-fa`, `fdeca46`): changed JS files pass `node --check`; `playwright/tests/utils.spec.js` syntax and `git diff --check` pass. Runtime tests/build NOT RUN (`node_modules` absent). Sparse `frappe-framework` checkout's 4,277 deleted index entries remain untouched.
- Frappe UI (`codex/jalali-datepicker`, `87c39de9`) and Insights (`custom/develop-fa`, `beffaa9`): source audit found no display digit conversion in the inspected formatter paths; `git diff --check` passes. Tests/build NOT RUN because dependencies are absent. ERPNext (`custom/develop-fa`, `33ba1d8`) is unchanged in this continuation.
- No commit, push, deployment, branch, PR, or merge was created. PR #1 remains reported as merged based on the prior GitHub verification; it was not re-queried in this continuation.

### ERPNext continuation — 2026-10-27

- Found direct Gregorian Moment display in `erpnext/manufacturing/doctype/production_plan/production_plan.js` for schedule/completion datetimes and past relative time. Persian output now routes through Framework `frappe.datetime.str_to_user` / `frappe.datetime.prettyDate`; English retains its existing Moment output.
- Found selected date/time display in `erpnext/www/book_appointment/index.js`; Persian confirmation and timezone-adjusted slot labels now route through the same Framework formatter, while English retains the prior Moment formats. Gregorian values submitted to the API remain unchanged.
- Added `erpnext/tests/js/persian_date_display.test.mjs`, covering Persian shared-format routing and English regression. Full existing Node JS suite `node --test erpnext/tests/js/*.test.mjs`: 17/17 PASS. Changed JS files pass `node --check`; `git diff --check` PASS.
- Build and browser tests NOT RUN (`yarn` is unavailable). Commit `9a60a69` is local on `custom/develop-fa`. Push failed with HTTP 403 for authenticated account `rezzmokk-ux`; earlier branch history remains five commits ahead of origin. Deploy NOT RUN. No branch, PR, or merge created.

### Insights continuation — 2026-10-27

- Found a Gregorian fiscal-year chart label in `frontend/src2/query/helpers.ts`. Persian labels now derive the configured fiscal-year start/end from the unchanged Gregorian site setting, then format the span through `formatLocaleDateRange` (which delegates Gregorian→Jalali fields to `jalaali-js`). English `FY YYYY-YY` behavior stays unchanged.
- Added Persian catalog entries for `Fiscal Year` (`سال مالی`) and `Fiscal Year Start` (`آغاز سال مالی`) to `insights/locale/fa.po` and source template `main.pot`; added Persian and English fiscal-label regressions to `query/helpers.test.ts`.
- Changed TypeScript source passes `node --check`; `git diff --check` passes. `node --test scripts/localization.test.mjs` is BLOCKED at module loading because `@persian-tools/persian-tools` is not installed. Vitest/build/deploy NOT RUN (`frontend/node_modules` absent). No new commit or push.

### Insights continuation — 2026-10-27 (Query Builder calendar locale)

- Query Builder DatePicker was formatting typed values from `session.user.locale` while relying on the shared calendar's implicit `auto` choice. Explicitly pass `persian` or `gregorian` from the same Insights locale to both `DateCalendar` and `DateRangeCalendar`, so calendar mode cannot diverge from the typed display locale. API/model date values remain Gregorian ISO.
- Added `getDatePickerCalendar` coverage for `fa-IR`, case-insensitive `FA`, and `en-US`. The pinned Frappe UI commit `e85a5450` exposes the `calendar` prop on both calendar controls.
- `node --experimental-strip-types --check` on changed TS sources/tests and `git diff --check`: PASS. Unit/Component tests, Build, Browser/E2E, and Deploy: NOT RUN. Dependency bootstrap via `pnpm dlx yarn@1.22.22` could not reach `registry.npmjs.org` (`UND_ERR_SOCKET`); `yarn` remains unavailable and `frontend/node_modules` absent. No commit/push/deploy performed.

### Frappe Framework continuation — 2026-10-27 (Communication date)

- Traced `frappe/public/js/frappe/views/communication.js` → `frappe.datetime.global_date_format` and found its date-only display bypassed the shared Persian formatter. The function now routes Persian dates through the existing `jalaali-js` formatter (ASCII digits retained); its English Moment output is unchanged. Timed Persian output uses a 24-hour clock to avoid English AM/PM text.
- Added Persian/English regression assertions to the existing Playwright utils suite. Changed JS and test source pass `node --check`; `git diff --check` passes. Playwright, app tests, build, and deploy remain NOT RUN because this checkout has no `node_modules` and the package registry request failed earlier. No commit/push made.

### Jalali Shamsi Datepicker continuation — 2026-10-27

- Confirmed the actual version-controlled app source is `jalali_shamsi_datepicker-audit` on `main` at `3db5079`, ahead 3 of its origin with a clean worktree. The active hook loads the saved-input conversion path and intentionally excludes the legacy `topersian_date.js` storage path.
- Ran `node --test tests/date-conversion.test.cjs`: 5/5 PASS. Coverage checks persian-datepicker parsing, persian-date conversion to canonical Gregorian storage, Frappe timezone conversion for datetimes, invalid-date rejection, preservation of Gregorian ISO values, and exclusion of the legacy path. `git diff --check` PASS; no files changed.
- The bundled workspace Yarn artifacts are truncated/corrupt, so they cannot enable the missing Insights/Frappe UI test dependencies. Registry bootstrapping already failed with a socket error. Continue with source work and avoid repeated package fetch attempts until network state changes.

### Frappe UI continuation — 2026-10-27 (DateTimePicker input validation)

- Found that invalid Jalali DateTimePicker input fell through to the permissive Gregorian Day.js parser. In Persian calendar mode (without a caller-specified format), invalid Jalali text is now rejected; explicit Gregorian ISO input remains accepted through a strict, calendar-day/time-validated parser. Persian/Arabic digits are normalized only at these text-input boundaries through `@persian-tools/persian-tools`.
- Added component regressions for invalid Esfand 30 in a non-leap Jalali year and valid canonical Gregorian ISO input under a Persian locale.
- `node --experimental-strip-types --check` for the changed Cypress spec and `git diff --check`: PASS. Cypress/Vitest, build, and browser suite: NOT RUN (`node_modules` absent; Yarn bootstrap unavailable). No commit/push/deploy performed.

### Frappe UI continuation — 2026-10-27 (Custom DateTimePicker formats)

- Found the DateTimePicker `format` override bypassed Jalali presentation and typed Jalali parsing. Persian-calendar mode now formats custom date/time tokens through the existing `jalaali-js` date formatter while preserving Day.js time tokens, bracket literals, locale-specific weekday names, ASCII numeric display, and canonical ISO models. Custom Persian input is parsed by its supplied date/time pattern; Gregorian ISO fallback is strict. English/custom Gregorian behavior remains on the existing Day.js path.
- Added a component regression using `MMMM D, YYYY [at] h:mm A`, Persian month/day/year and Persian numerals at the text-input boundary, expecting canonical `2026-10-02 12:31:00` output.
- Extracted Vue script and Cypress spec pass Node syntax checks; `git diff --check` PASS. Cypress/Vitest, build, browser verification, and deploy are NOT RUN because dependencies are absent and registry/Yarn bootstrap is unavailable. No commit/push performed.

### Frappe UI continuation — 2026-10-27 (Custom DateTimePicker format follow-up)

- Moved custom Jalali date-time rendering/parsing into `src/components/DatePicker/dateTimeFormat.ts` instead of keeping token processing in the Vue component. It uses the existing `jalaali-js`-backed date formatter and `@persian-tools/persian-tools` only at accepted input boundaries; custom format examples with weekday/month/day/year, bracket literals, 12-hour markers and Persian numeral input are covered by new Vitest tests plus a Cypress regression.
- Extracted Vue script, helper, Vitest spec, Cypress spec syntax checks and `git diff --check`: PASS. Automated Vitest/Cypress suites, Build, and Deploy: NOT RUN (dependencies absent; registry/Yarn bootstrap unavailable). No commit/push/deploy performed.

### Localization continuation — 2026-10-27 (shared Frappe date paths and UI translations)

- Frappe Framework: added and locally committed `d739a4e`, `07e88df`, `f63836a`, `c193271`, `a0325ba`, `99eb7fa`, and `e60164a` on the existing `custom/develop-fa` branch. The latest translation batch adds 65 source-backed UI strings; the active blank count is 1,321 (15 empty references point to missing source files). PO syntax validation and per-batch placeholder, HTML-tag, and canonical-digit checks pass.
- Shared date display: Persian Datetime cells and Gantt popup dates now use the Framework Jalali formatter; `obj_to_user` also formats Date objects through `jalaali-js`. The FullCalendar Persian locale is loaded for Persian labels/RTL and Saturday-first week starts. Its view still uses Gregorian calendar boundaries, so this is not complete Jalali calendar support.
- `node --check` and `git diff --check` pass for changed Framework JS/spec files. Framework Playwright tests, full Build, and Deploy are NOT RUN because dependencies are absent and package registry access failed. Framework branch is ahead 38; no push or deploy was made.
- ERPNext: `customer_overview.js` period dates now use the shared Framework Jalali formatter in Persian and preserve the English Moment format. Existing JS suite: 19/19 PASS; commit `718dee5` on the existing `custom/develop-fa` branch (ahead 7). Build, Deploy, and Push NOT RUN.
- No new branch, PR, or merge was created. Other uncommitted Framework files remain preserved.

### Frappe Framework continuation — 2026-10-27 (settings, workspace and DocType UI translations)

- Added 98 active, source-referenced Persian translations for creation flows, permissions, settings, automation, print/layout controls, destructive confirmations, and notification preferences in `frappe/locale/fa.po`.
- Active empty entries decreased from 1,321 to 1,223; 15 remaining empty references are stale because their referenced source files no longer exist. No fuzzy entries were added.
- Translation-map placeholder/HTML-tag/canonical-digit checks, PO syntax validation, and `git diff --check`: PASS. UI/translation runtime tests, Build, and Deploy: NOT RUN (`node_modules` absent).

### Frappe Framework continuation — 2026-10-27 (failures, filters, display settings and help text)

- Added 95 active Persian UI translations for error states, filters, display preferences, automation fields, print builder controls, login flows, and supporting help text.
- Source-backed empty entries decreased from 1,223 to 1,128. The 15 source-missing references remain classified as stale; fuzzy count remains 0.
- PO syntax, per-map placeholder/HTML-tag/canonical-digit checks, and `git diff --check`: PASS. Runtime translation tests and Build: NOT RUN (`node_modules` absent).
