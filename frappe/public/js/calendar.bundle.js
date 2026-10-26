import { Calendar as FullCalendar } from "@fullcalendar/core";
import persianLocale from "@fullcalendar/core/locales/fa";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

frappe.FullCalendar = FullCalendar;
frappe.FullCalendar.Plugins = [listPlugin, dayGridPlugin, timeGridPlugin, interactionPlugin];
frappe.FullCalendar.Locales = [persianLocale];
