# Kingdom Scaling Principles — Business Lunch (landing page)

Static landing page + RSVP form for the Rise Up Kings "Kingdom Scaling Principles
Business Lunch" event. Live on Vercel (project `businesslunch`, Rise Up Kings team) at
**https://businesslunch.riseupkings.com**.

## Stack
- Static `index.html` + `css/` + `js/` + `assets/`
- `api/rsvp.js` — Vercel serverless function; posts each RSVP to GoHighLevel + Ontraport
- Node `22.x` (pinned in `package.json`)

## Deploy workflow (read before merging)
Vercel **blocks any deployment whose Git commit author is not a member of the Rise Up
Kings Vercel team.** That is why contributor pushes do not deploy, and it is also what
broke production in June 2026 when a contributor-authored squash commit landed on `main`.

To keep production deploying:

- **Merge to `main` with "Create a merge commit"** (squash and rebase are disabled), so the
  commit that lands on `main` is authored by whoever merges.
- **Only a Vercel-team member (Justin) merges to `main`.** Contributor branch pushes will
  appear as "Blocked" previews in Vercel. That is expected and harmless, not a build error.
- Production auto-deploys from `main`. For an on-demand rebuild without a code change, use
  the project's **Deploy Hook** (Vercel → Settings → Git → Deploy Hooks).

## Local preview
Any static server works, e.g. `npx serve .` then open the printed URL. The `/api/rsvp`
function only runs on Vercel (or via `vercel dev`).
