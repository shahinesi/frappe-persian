# Persian Frappe Ecosystem Localization Status

Updated: 2026-10-26. This file tracks the existing Workspace repositories and deployed sites. `NOT RUN` means no result is available.

| Project | Branch / revision | Work and evidence | Tests | Build / deploy | Remaining / next action |
|---|---|---|---|---|---|
| Frappe Framework | `custom/develop-fa` / `352cb44` (local, ahead 1) | Full source clone created from the observed `shahinesi/frappe-persian` remote. Filled 11 common Persian UI messages; active empty PO entries fell from 1,566 to 1,555. Original sparse checkout remains untouched. | PO syntax parser PASS; pre-commit NOT RUN (not installed). | NOT RUN | Audit Desk date/number paths, RTL, translations; resolve GitHub write credentials before Push. |
| Frappe UI | `codex/jalali-datepicker` / `e85a545` + 19 modified files | Existing changes retained and attached to a local branch named after the existing remote branch. `git diff --check` PASS. | Unit/component suite NOT RUN; dependencies unavailable. | NOT RUN | Obtain locked dependencies once, run tests/build, then commit and push the existing remote branch. |
| ERPNext | `custom/develop-fa` / `86532b1` (local, ahead 2) | 20 active translations added in `315c99d`; six subcontracting terms aligned in `86532b1`; active empty Persian strings: 0 of 10,832 entries. | PO syntax parser PASS; application tests NOT RUN. | NOT RUN | Full UI audit and staging build/deploy remain. Push failed with HTTP 403 because the Windows Git credential is `rezzmokk-ux`, which lacks write access. |
| Helpdesk | `feat/persian-setup-wizard` / `ebaf0cd5` (aligned with origin) | Prior verified work retained: 28 routes, 13/13 localization tests, 3/3 Python tests, browser verification and test deployment. | Prior results PASS. | Prior build/deploy PASS. | Continue only on newly found issues; PR #1 is already merged. |
| Insights | `custom/develop-fa` / `ee07f56` (local, ahead 1) | Central number formatter now delegates NaN to locale-aware `Intl`; translation/date-number work from prior commits retained. | 9 direct assertions PASS with `TZ=Asia/Tehran`, including midnight boundary and English output; Vitest suite NOT RUN. | NOT RUN | Fix custom Gregorian calendar grid, complete charts/RTL/font audit, then build and verify on staging. |
| Telephony | Server app `develop` / `039cf39` | Installed source inspected in `helpdesk-persian-test-backend-1`; checkout clean, remote is `frappe/telephony`. No Workspace source checkout found. | NOT RUN | NOT RUN | Acquire a managed source checkout before changing or deploying it. |
| Jalali Shamsi Datepicker | Installed version `1.0.0`; public source `Atshan/jalali_shamsi_datepicker`, `main` / `27d6eda` | Actual source matches version 1.0.0. `togregorian_date.js` explicitly forces Latin digits. Connected GitHub permission is pull-only. | NOT RUN | NOT RUN | Requires a maintainer-owned fork or upstream authorization before a durable fix; no branch or PR created. |

## Runtime environments

- `office-staging.localhost`: Frappe 17.0.0-dev, ERPNext 17.0.0-dev, Helpdesk 1.22.2, Insights 4.0.0-dev, Telephony 0.0.1.
- `erp-stage.ircarpet-r.com`: Frappe 16.33.0, ERPNext 16.34.1, Jalali Shamsi Datepicker 1.0.0.
- No deployment was made in this run. The staging images expose apps as `UNVERSIONED` and do not contain Git checkouts; deploy only after source changes can be built from versioned repositories.
- PR #1 is closed and merged at `19e7d85b4ef4e23f284939a74005de824326d78e`. New local commits are not part of that merge. New merge: NO.

## Next actions

1. Run Frappe UI locked tests/build without repeating the previously failed registry download route; preserve its 19 changes.
2. Complete Insights date/calendar and chart localization, then run its suite/build.
3. Complete framework/ERPNext shared and app-specific UI audits; validate both on their existing staging sites after versioned code is available.
4. Resolve authorized Git push credentials for the `shahinesi` repositories; do not create a branch, PR, or merge.
