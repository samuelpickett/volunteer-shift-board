/* This file contains AI-generated code. */
import type { ActionHandler } from "deepspace/worker";
import type { Env } from "../../worker";
import type { Shift } from "../schemas/shifts-schema";

/** Verify the opening server-side before creating its one allowed signup. */
const claimShift: ActionHandler<Env> = async ({ params, tools, userId }) => {
  const shiftId = typeof params.shiftId === "string" ? params.shiftId : "";
  if (!shiftId) return { success: false, error: "Choose a shift to claim." };

  const result = await tools.get("shifts", shiftId);
  if (!result.success)
    return { success: false, error: "This shift is no longer available." };

  const shift = result.data.record.data as unknown as Shift;
  if (shift.status !== "open" || Date.parse(shift.startsAt) <= Date.now()) {
    return { success: false, error: "This shift is no longer open." };
  }

  const remindMe = params.remindMe === true;
  const created = await tools.create("signups", { shiftId, userId, remindMe });
  if (!created.success)
    return {
      success: false,
      error: "This opening was just claimed. Choose another.",
    };
  return { success: true, data: { signupId: created.data.recordId } };
};

export const actions: Record<string, ActionHandler<Env>> = { claimShift };
