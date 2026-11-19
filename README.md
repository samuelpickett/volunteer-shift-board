# Goodturn

Goodturn is a live volunteer shift board built for the DeepSpace build exercise. A signed-in organizer posts a shift with 1 to 20 volunteer spots. Volunteers claim spots, and everyone viewing the board sees availability change immediately. A volunteer can release a spot; the organizer or an admin can cancel the shift.

## Core flow

1. Visit the board to see upcoming shifts and current availability.
2. Sign in to post a shift or claim a spot. A posting includes the role, organization, location, start and end, number of spots, and optional instructions.
3. Claim an open spot. A server action checks that the shift still exists, is open, and has not started. The `signups` collection has a unique constraint on `shiftId`, so two people cannot claim the same spot.
4. Release your own claim to reopen the spot. Organizers may cancel shifts they posted.
5. Optionally receive one email reminder within 24 hours before the shift. The hourly DeepSpace scheduled job checks opted-in signups and records when it sends each reminder.

## DeepSpace features used

- OAuth sign-in and server-enforced record permissions. Members can edit only openings they created and release only their own claims.
- Durable records with live synchronization across clients. Two-browser tests check posting, claiming, release, multi-spot availability, and the volunteer's inability to cancel someone else's shift.
- A server action for claim validation and a unique record constraint for one claim per spot.
- A scheduled job and the `email/send` integration for opted-in reminders. This is billed to the app owner when reminders are sent.

## Tradeoffs and limits

One posting creates a group of individual spot records, displayed as one shift. This preserves the existing one-person-per-spot claim rule and lets older one-spot shifts continue to work. The app does not yet let organizers change the spot count after posting, resolve overlapping commitments, or manage a waitlist. A cancelled shift is hidden from the upcoming board, but its records remain for history.

Reminders are sent in the timezone captured when the organizer posts the opening. The board displays times in each visitor's local timezone. A reminder job is designed to mark each delivered email, though an email delivered just before a worker failure could be retried; delivery is not exactly once.

## Run and verify

Use Node 24 and npm 11.6 or newer. Sign in to the DeepSpace CLI under the intended app owner before starting the app.

```bash
npm install
npx deepspace auth whoami
npx deepspace dev start
npx deepspace test run all
npm run type-check
npm run lint
npm run build
```

The full test suite uses two DeepSpace test accounts for its collaborative flow. The app is deployed with `npx deepspace deploy` from the GitHub-backed checkout.
