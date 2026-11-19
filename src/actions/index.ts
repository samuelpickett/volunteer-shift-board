/* This file contains AI-generated code. */
import type { ActionHandler } from "deepspace/worker";
import type { Env } from "../../worker";
import type { Shift, Signup } from "../schemas/shifts-schema";

/** Claim one available spot in a shift while preserving the per-spot unique rule. */
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

  const grouped = shift.groupId
    ? await tools.query("shifts", {
        where: { groupId: shift.groupId },
        limit: 50,
      })
    : null;
  if (grouped && !grouped.success)
    return { success: false, error: "Could not check the available spots." };

  const spots = (
    grouped?.success ? grouped.data.records : [result.data.record]
  ) as unknown as {
    recordId: string;
    createdBy: string;
    data: Shift;
  }[];
  const activeSpots = spots.filter(
    (spot) =>
      spot.createdBy === result.data.record.createdBy &&
      spot.data.status === "open" &&
      Date.parse(spot.data.startsAt) > Date.now(),
  );
  const occupied = new Set<string>();
  for (const spot of activeSpots) {
    const roster = await tools.query("signups", {
      where: { shiftId: spot.recordId },
      limit: 1,
    });
    if (!roster.success)
      return { success: false, error: "Could not check the roster." };
    if (
      roster.data.records.some(
        (signup) => (signup.data as unknown as Signup).userId === userId,
      )
    ) {
      return { success: false, error: "You already claimed this shift." };
    }
    if (roster.data.records.length > 0) occupied.add(spot.recordId);
  }

  const remindMe = params.remindMe === true;
  const claimId = `claim_${result.data.record.createdBy}_${shift.groupId ?? shiftId}_${userId}`;
  for (const spot of activeSpots) {
    if (occupied.has(spot.recordId)) continue;
    // The stable ID prevents simultaneous requests from one person taking two spots.
    const created = await tools.create(
      "signups",
      { shiftId: spot.recordId, userId, remindMe },
      claimId,
    );
    if (created.success)
      return { success: true, data: { signupId: created.data.recordId } };
    const existing = await tools.get("signups", claimId);
    if (
      existing.success &&
      (existing.data.record.data as unknown as Signup).userId === userId
    ) {
      return { success: false, error: "You already claimed this shift." };
    }
    if (!created.error.startsWith("Duplicate:")) {
      return { success: false, error: "Could not claim this shift." };
    }
  }
  return { success: false, error: "All spots have been claimed." };
};

export const actions: Record<string, ActionHandler<Env>> = { claimShift };
