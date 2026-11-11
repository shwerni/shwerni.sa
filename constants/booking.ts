// earliest bookable time: riyadh now + this many minutes (same as the website's add25Minutes)
export const BOOKING_LEAD_MINUTES = 25;

// bookable days, starting from the lead time's date (same as getDatesAhead(7, lead))
export const BOOKING_WINDOW_DAYS = 7;

// an unpaid (NEW / PROCESSING) order holds its slot this long, on the website and the app; older,
// it no longer blocks the slot, even before the cancel cron (every 20 minutes) cancels it
export const UNPAID_HOLD_MINUTES = 15;
