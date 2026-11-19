// AI-generated code
import { buildCronContext, type CronTask } from "deepspace/worker";
import type { Env } from "../worker";
import type { Shift, Signup } from "./schemas/shifts-schema";

type Row<T> = { recordId: string; data: T };
type Member = { email?: string; name?: string };

export const tasks: CronTask[] = [
  { name: "shift-reminders", schedule: "0 * * * *", timezone: "UTC" },
];

/** Send an opted-in volunteer one reminder during the day before a shift. */
export async function runTask(name: string, env: Env): Promise<void> {
  if (name !== "shift-reminders") return;
  const context = buildCronContext(
    env,
    env.OWNER_USER_ID,
    `app:${env.DEEPSPACE_APP_ID}`,
  );
  const [rawSignups, rawShifts, rawMembers] = await Promise.all([
    context.records.query("signups", { limit: 500 }),
    context.records.query("shifts", { limit: 500 }),
    context.records.query("users", { limit: 500 }),
  ]);
  const signups = rawSignups as Row<Signup>[];
  const shifts = new Map(
    (rawShifts as Row<Shift>[]).map((row) => [row.recordId, row.data]),
  );
  const members = new Map(
    (rawMembers as Row<Member>[]).map((row) => [row.recordId, row.data]),
  );
  const now = Date.now();

  for (const signup of signups) {
    if (!signup.data.remindMe || signup.data.remindedAt) continue;
    const shift = shifts.get(signup.data.shiftId);
    const member = members.get(signup.data.userId);
    if (!shift || shift.status !== "open" || !member?.email) continue;
    const hoursUntil = (Date.parse(shift.startsAt) - now) / 3_600_000;
    if (hoursUntil <= 0 || hoursUntil > 24) continue;

    const when = new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: shift.timeZone,
    }).format(new Date(shift.startsAt));
    const response = (await context.integrations.call("email/send", {
      to: member.email,
      subject: `Your Goodturn shift is coming up: ${shift.title}`,
      text: `Hi ${member.name || "volunteer"},\n\nYour shift with ${shift.organization} starts ${when} (${shift.timeZone}) at ${shift.location}.\n\nOpen the board to see your commitment or release your spot: https://volunteer-shift-board.app.space/home\n\nThank you for showing up.`,
    })) as { success?: boolean; error?: string };
    if (response.success === false)
      throw new Error(response.error ?? "Reminder email failed");
    await context.records.update("signups", signup.recordId, {
      remindedAt: new Date().toISOString(),
    });
  }
}
