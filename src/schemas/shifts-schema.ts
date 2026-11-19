// AI-generated code
import type { CollectionSchema } from "deepspace/schema";

export interface Shift {
  title: string;
  organization: string;
  location: string;
  description: string;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  status: "open" | "cancelled";
}

export interface Signup {
  shiftId: string;
  userId: string;
  remindMe: boolean;
  remindedAt?: string;
}

/** Each signed-in organizer owns the openings they post; admins may moderate any. */
export const shiftsSchema: CollectionSchema = {
  name: "shifts",
  columns: [
    { name: "title", storage: "text", interpretation: "plain", required: true },
    {
      name: "organization",
      storage: "text",
      interpretation: "plain",
      required: true,
    },
    {
      name: "location",
      storage: "text",
      interpretation: "plain",
      required: true,
    },
    { name: "description", storage: "text", interpretation: "plain" },
    {
      name: "startsAt",
      storage: "text",
      interpretation: "datetime",
      required: true,
    },
    {
      name: "endsAt",
      storage: "text",
      interpretation: "datetime",
      required: true,
    },
    {
      name: "timeZone",
      storage: "text",
      interpretation: "plain",
      required: true,
    },
    {
      name: "status",
      storage: "text",
      interpretation: { kind: "select", options: ["open", "cancelled"] },
      default: "open",
    },
  ],
  permissions: {
    viewer: { read: true, create: false, update: false, delete: false },
    member: { read: true, create: true, update: "own", delete: "own" },
    admin: { read: true, create: true, update: true, delete: true },
  },
};

/** A unique shift ID makes each opening claimable by exactly one person. */
export const signupsSchema: CollectionSchema = {
  name: "signups",
  columns: [
    {
      name: "shiftId",
      storage: "text",
      interpretation: "plain",
      required: true,
      immutable: true,
    },
    {
      name: "userId",
      storage: "text",
      interpretation: "plain",
      required: true,
      immutable: true,
    },
    {
      name: "remindMe",
      storage: "number",
      interpretation: "boolean",
      default: false,
    },
    { name: "remindedAt", storage: "text", interpretation: "datetime" },
  ],
  uniqueOn: ["shiftId"],
  ownerField: "userId",
  permissions: {
    viewer: { read: true, create: false, update: false, delete: false },
    member: { read: true, create: false, update: false, delete: "own" },
    admin: { read: true, create: false, update: false, delete: true },
  },
};
