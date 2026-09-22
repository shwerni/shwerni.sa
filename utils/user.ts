// days a user must wait between phone / password changes
export const cooldown = 10;

const DAY_MS = 86_400_000;

/**
 * days left before a sensitive field can be changed again
 * @param changedAt last change date, null if never changed
 * @returns whole days left (rounded up), 0 when a change is allowed
 */
export const cooldownDays = (changedAt: Date | null) => {
  if (!changedAt) return 0;
  const left = changedAt.getTime() + cooldown * DAY_MS - Date.now();
  return left > 0 ? Math.ceil(left / DAY_MS) : 0;
};

// oldest last-change date that still allows a new change
export const cooldownThreshold = () => new Date(Date.now() - cooldown * DAY_MS);

// arabic label for 1-10 days
const daysLabel = (n: number) =>
  n === 1 ? "يوم واحد" : n === 2 ? "يومين" : `${n} أيام`;

/**
 * user facing message when a change is locked
 * @param label field name in arabic
 * @param days days left
 */
export const cooldownMessage = (label: string, days: number) =>
  `لا يمكن تغيير ${label} إلا مرة كل ${cooldown} أيام، يمكنك التغيير بعد ${daysLabel(Math.max(days, 1))}`;
