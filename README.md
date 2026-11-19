# Goodturn

Goodturn is a live volunteer shift board built for the DeepSpace build exercise. A signed-in organizer posts one opening per volunteer spot. Another person claims that spot, and everyone viewing the board sees the change immediately. The volunteer can release it; the organizer or an admin can cancel it.

## Core flow

1. Visit the board to see upcoming openings and current availability.
2. Sign in to post an opening or claim one. A posting includes the role, organization, location, start and end, and optional instructions.
3. Claim an open spot. A server action checks that the shift still exists, is open, and has not started. The `signups` collection has a unique constraint on `shiftId`, so two people cannot claim the same opening.
4. Release your own claim to reopen the spot. Organizers may cancel openings they posted.
5. Optionally receive one email reminder within 24 hours before the shift. The hourly DeepSpace scheduled job checks opted-in signups and records when it sends each reminder.

## DeepSpace features used

- OAuth sign-in and server-enforced record permissions. Members can edit only openings they created and release only their own claims.
- Durable records with live synchronization across clients. A two-browser test checks posting, claiming, release, and the volunteer's inability to cancel someone else's opening.
- A server action for claim validation and a unique record constraint for one claim per opening.
- A scheduled job and the `email/send` integration for opted-in reminders. This is billed to the app owner when reminders are sent.

## Tradeoffs and limits

Each opening is one volunteer spot. An organizer who needs several people posts several openings. This keeps the first version's claim rule simple and enforceable. It does not yet group openings into an event, resolve a volunteer's overlapping commitments, or provide a waitlist. A cancelled opening is hidden from the upcoming board, but its record remains for history.

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
