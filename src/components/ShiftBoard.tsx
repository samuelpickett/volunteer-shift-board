// AI-generated code
import { useState, type FormEvent } from "react";
import { CalendarDays, Check, Clock3, MapPin, Plus, Users } from "lucide-react";
import {
  getAuthToken,
  useAuthProfileReady,
  useMutations,
  useQuery,
  useUsers,
} from "deepspace";
import { Button, Input, Textarea, useToast } from "./ui";
import type { Shift, Signup } from "../schemas/shifts-schema";

/** Display an ISO timestamp in the viewer's local timezone. */
function displayTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

/** Render live openings, volunteer actions, and the coordinator's posting form. */
export default function ShiftBoard() {
  const { isSignedIn, userId, user } = useAuthProfileReady({
    requireUser: true,
  });
  const {
    records: shifts,
    status,
    error: queryError,
  } = useQuery<Shift>("shifts", { orderBy: "startsAt", orderDir: "asc" });
  const {
    records: signups,
    status: signupsStatus,
    error: signupsError,
  } = useQuery<Signup>("signups");
  const { users } = useUsers();
  const shiftWrites = useMutations<Shift>("shifts");
  const signupWrites = useMutations<Signup>("signups");
  const toast = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [remindMe, setRemindMe] = useState(true);
  const [form, setForm] = useState({
    title: "",
    organization: "",
    location: "",
    description: "",
    startsAt: "",
    endsAt: "",
  });
  const canOrganize = isSignedIn;
  const boardReady = status === "ready" && signupsStatus === "ready";
  const upcoming = shifts.filter(
    (shift) =>
      shift.data.status === "open" &&
      Date.parse(shift.data.startsAt) > Date.now(),
  );
  const signupByShift = new Map(
    signups.map((signup) => [signup.data.shiftId, signup]),
  );
  const mine = signups.filter((signup) => signup.data.userId === userId).length;
  const available = upcoming.filter(
    (shift) => !signupByShift.has(shift.recordId),
  ).length;

  /** Validate and publish a single opening with a confirmed server write. */
  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const start = new Date(form.startsAt);
    const end = new Date(form.endsAt);
    if (
      !form.title.trim() ||
      !form.organization.trim() ||
      !form.location.trim() ||
      !Number.isFinite(start.getTime()) ||
      start.getTime() <= Date.now() ||
      !Number.isFinite(end.getTime()) ||
      end <= start
    ) {
      toast.error(
        "Check the shift details",
        "Enter a future start and an end after it.",
      );
      return;
    }
    setSaving(true);
    try {
      await shiftWrites.createConfirmed({
        title: form.title.trim(),
        organization: form.organization.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        status: "open",
      });
      setForm({
        title: "",
        organization: "",
        location: "",
        description: "",
        startsAt: "",
        endsAt: "",
      });
      setFormOpen(false);
      toast.success("Opening published");
    } catch (error) {
      toast.error("Could not publish opening", String(error));
    } finally {
      setSaving(false);
    }
  }

  /** Ask the worker to verify the opening before creating its signup. */
  async function claim(shiftId: string) {
    setBusyId(shiftId);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Sign in to claim an opening.");
      const response = await fetch("/api/actions/claimShift", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shiftId, remindMe }),
      });
      const result = (await response.json()) as {
        success: boolean;
        error?: string;
      };
      if (!response.ok || !result.success)
        throw new Error(result.error ?? "The opening could not be claimed.");
      toast.success("You’re on the roster");
    } catch (error) {
      toast.error("Claim failed", String(error));
    } finally {
      setBusyId(null);
    }
  }

  /** Release the caller's own signup; collection permissions enforce ownership. */
  async function release(signupId: string, shiftId: string) {
    setBusyId(shiftId);
    try {
      await signupWrites.removeConfirmed(signupId);
      toast.success("Opening released");
    } catch (error) {
      toast.error("Could not release opening", String(error));
    } finally {
      setBusyId(null);
    }
  }

  /** Cancel an opening without erasing its prior signup from the record history. */
  async function cancel(shiftId: string) {
    setBusyId(shiftId);
    try {
      await shiftWrites.putConfirmed(shiftId, { status: "cancelled" });
      toast.success("Opening cancelled");
    } catch (error) {
      toast.error("Could not cancel opening", String(error));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-border pb-10">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[.22em] text-primary">
              Goodturn / Volunteer shifts
            </p>
            <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-6xl">
              A little time.
              <br />
              <span className="text-primary">A lot of good.</span>
            </h1>
            <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
              Find an opening that fits your day. Claim it in one click, and the
              roster updates for everyone.
            </p>
          </div>
          {canOrganize && (
            <Button onClick={() => setFormOpen((open) => !open)}>
              <Plus /> Post an opening
            </Button>
          )}
        </header>
        <section
          aria-label="Board summary"
          className="mb-10 grid gap-3 sm:grid-cols-3"
        >
          <Stat
            icon={<CalendarDays />}
            label="Upcoming openings"
            value={upcoming.length}
          />
          <Stat icon={<Users />} label="Still available" value={available} />
          <Stat icon={<Check />} label="Your commitments" value={mine} />
        </section>
        {canOrganize && formOpen && (
          <form
            onSubmit={(event) => void publish(event)}
            className="mb-10 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
          >
            <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
              Organizer desk
            </p>
            <h2 className="mb-2 mt-2 font-serif text-2xl">
              Post one volunteer opening
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Need three people? Post three openings, one for each spot.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Role or task
                <Input
                  required
                  maxLength={100}
                  className="mt-2"
                  placeholder="Food pantry sorting"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>
              <label className="text-sm font-medium">
                Organization
                <Input
                  required
                  maxLength={100}
                  className="mt-2"
                  placeholder="Neighborhood Pantry"
                  value={form.organization}
                  onChange={(e) =>
                    setForm({ ...form, organization: e.target.value })
                  }
                />
              </label>
              <label className="text-sm font-medium">
                Starts
                <Input
                  required
                  type="datetime-local"
                  className="mt-2"
                  value={form.startsAt}
                  onChange={(e) =>
                    setForm({ ...form, startsAt: e.target.value })
                  }
                />
              </label>
              <label className="text-sm font-medium">
                Ends
                <Input
                  required
                  type="datetime-local"
                  className="mt-2"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Location
                <Input
                  required
                  maxLength={160}
                  className="mt-2"
                  placeholder="123 Main St, community entrance"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Helpful details
                <Textarea
                  maxLength={500}
                  className="mt-2"
                  placeholder="What should volunteers bring or know?"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button
                type="submit"
                loading={saving}
                disabled={!shiftWrites.ready}
              >
                Publish opening
              </Button>
              <span className="text-xs text-muted-foreground">
                Times use your local timezone.
              </span>
            </div>
          </form>
        )}
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
              The board
            </p>
            <h2 className="mt-1 font-serif text-3xl">Upcoming shifts</h2>
          </div>
          <span className="text-sm text-muted-foreground">Live roster</span>
        </div>
        {(status === "loading" || signupsStatus === "loading") && (
          <p className="rounded-xl border border-border bg-card p-8">
            Loading openings…
          </p>
        )}
        {status === "error" && (
          <p
            role="alert"
            className="rounded-xl border border-border bg-card p-8 text-destructive"
          >
            Could not load shifts: {queryError}
          </p>
        )}
        {signupsStatus === "error" && (
          <p
            role="alert"
            className="rounded-xl border border-border bg-card p-8 text-destructive"
          >
            Could not load the roster: {signupsError}
          </p>
        )}
        {boardReady && upcoming.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card px-8 py-16 text-center">
            <CalendarDays className="mx-auto mb-4 text-primary" />
            <h3 className="font-serif text-2xl">The board is clear for now</h3>
            <p className="mt-2 text-muted-foreground">
              New openings appear here when a coordinator posts them.
            </p>
          </div>
        )}
        {boardReady && isSignedIn && (
          <label className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={remindMe}
              onChange={(event) => setRemindMe(event.target.checked)}
              className="accent-primary"
            />
            Email me one reminder before a shift I claim
          </label>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {boardReady &&
            upcoming.map((shift) => {
              const signup = signupByShift.get(shift.recordId);
              const isMine = signup?.data.userId === userId;
              const volunteerName = users.find(
                (person) => person.id === signup?.data.userId,
              )?.name;
              return (
                <article
                  key={shift.recordId}
                  data-testid="shift-card"
                  className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                      {shift.data.organization}
                    </span>
                    <span
                      className={`text-xs font-semibold ${signup ? "text-muted-foreground" : "text-primary"}`}
                    >
                      {signup ? "Spot filled" : "Open spot"}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl leading-tight">
                    {shift.data.title}
                  </h3>
                  <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Clock3 size={16} className="shrink-0 text-primary" />
                      {displayTime(shift.data.startsAt)} –{" "}
                      {new Intl.DateTimeFormat(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(new Date(shift.data.endsAt))}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin size={16} className="shrink-0 text-primary" />
                      {shift.data.location}
                    </p>
                  </div>
                  {shift.data.description && (
                    <p className="mt-4 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
                      {shift.data.description}
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
                    <span className="text-sm text-muted-foreground">
                      {isMine
                        ? "You’re on the roster"
                        : signup
                          ? `${volunteerName ?? "A volunteer"} claimed this spot`
                          : "Be the first to help"}
                    </span>
                    <div className="flex items-center gap-2">
                      {isMine && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            !signupWrites.ready || busyId === shift.recordId
                          }
                          onClick={() =>
                            void release(signup!.recordId, shift.recordId)
                          }
                        >
                          Release
                        </Button>
                      )}
                      {!signup && isSignedIn && (
                        <Button
                          size="sm"
                          loading={busyId === shift.recordId}
                          onClick={() => void claim(shift.recordId)}
                        >
                          Claim opening
                        </Button>
                      )}
                      {!signup && !isSignedIn && (
                        <span className="text-xs text-muted-foreground">
                          Sign in above to claim
                        </span>
                      )}
                      {(user?.role === "admin" ||
                        shift.createdBy === userId) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={
                            !shiftWrites.ready || busyId === shift.recordId
                          }
                          onClick={() => void cancel(shift.recordId)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          Each opening is one spot. Claims are first come, first served and
          checked on the server.
        </p>
      </div>
    </div>
  );
}

/** Summarize the current live board counts. */
function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-5 text-primary [&_svg]:size-5">{icon}</div>
      <div className="font-serif text-3xl">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
