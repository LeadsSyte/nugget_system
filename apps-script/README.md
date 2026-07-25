# AI Lead Vetter (Google Apps Script)

A lightweight, single-client AI lead filter that lives **inside the mailbox**.
When a WordPress lead lands in `leads@syte.co.za`, it is vetted by Claude
**before** a human sees it:

- ✅ **Genuine leads** are forwarded to the client (with the AI's score + summary).
- 🛑 **Junk** (spam, bots, SEO/link-building pitches, test submissions) is held
  back — labelled and logged, but never forwarded.
- 📊 **Every** lead + verdict is appended to a Google Sheet for review.

No servers, no infra — a time-driven trigger inside the Google account does the
work.

---

## How the pieces fit

| File | Purpose |
|------|---------|
| `Config.gs` | Everything you tune per client (search query, forward address, threshold, model). |
| `Code.gs`   | The vetting logic. Entry point: `vetLeads()`. |
| `Setup.gs`  | One-time helpers: store API key, install the trigger, dry-run test. |
| `Dashboard.gs` + `Dashboard.html` | The web-app front end (lead table, stats, manual-forward override). |
| `appsscript.json` | Manifest + OAuth scopes + web-app config. |

---

## Recommended lead flow

For the AI to act as a true **gatekeeper**, point the WordPress form at
`leads@syte.co.za` **only**, and let the vetter forward clean leads onward to
the client. (If WordPress also emails the client directly, they'll still see
every raw lead and the filter adds no value.)

```
WordPress form ──▶ leads@syte.co.za ──▶ [AI Vetter] ──▶ client (clean only)
                                             └────────▶ Google Sheet (all)
```

---

## Setup (about 10 minutes)

1. **Create the Apps Script project**
   Sign in as `leads@syte.co.za` → <https://script.google.com> → **New project**.
   Create four files matching this folder (`Config.gs`, `Code.gs`, `Setup.gs`,
   and the manifest `appsscript.json` — enable *Project Settings → Show
   "appsscript.json" manifest file*) and paste in the contents.
   *(Or use [`clasp`](https://github.com/google/clasp) to push this folder directly.)*

2. **Fill in `Config.gs`**
   - `CLIENT_NAME`
   - `LEAD_SEARCH_QUERY` — narrow it to this client's leads only
     (e.g. `from:(wordpress@theirdomain.com)` or `subject:("New Lead")`).
   - `FORWARD_TO` — the client's address.
   - `MIN_SCORE_TO_FORWARD` — start at `55`, tune after watching the log.

3. **Store the Anthropic API key** (kept out of source)
   Open `Setup.gs`, paste your key into `setApiKey()`, run it once, then remove
   the key and save. It now lives in **Script Properties**.

4. **Dry-run it**
   Run `testVetLatest()` and check **Executions / Logs**. It vets your most
   recent matching lead *without* forwarding — confirm the query matches and the
   score looks right. Adjust `LEAD_SEARCH_QUERY` / threshold as needed.

5. **Go live**
   Run `setUpTrigger()` once. `vetLeads()` now runs **every 5 minutes**.
   On first real run a log sheet is auto-created if `LOG_SHEET_ID` is blank —
   grab the printed ID from the log and paste it into `Config.gs`.

6. **Deploy the dashboard** (the front end)
   **Deploy → New deployment → Web app**.
   - *Execute as:* **Me** (`leads@syte.co.za`) — so it can read the sheet and
     forward on your behalf.
   - *Who has access:* your **Workspace domain** (or specific people).

   Open the deployment URL — that's the dashboard. Bookmark/share it with the
   client. Re-deploy (**Manage deployments → edit → new version**) whenever you
   change the code.

---

## The dashboard

A single page served from this same project (no Lovable, no extra hosting):

- **Stat cards** — total leads, forwarded, held, forward-rate.
- **Filterable list** — All / Forwarded / Held, plus free-text search over
  name, email, subject and sender.
- **Per-lead detail** — AI score, decision, one-line summary, the reason, and
  extracted contact fields, with an *Open in Gmail* link.
- **Manual override** — a **Forward to client** button on any held lead. It
  re-sends the original email to the client (marked *manually released*),
  re-labels the thread, and updates the log — for the occasional false negative.

> Because it's an Apps Script web app, only people you grant access to can open
> it, and it always reflects the live log sheet.

---

## Notes & safety

- **Fail-safe by design.** If Claude's response can't be parsed, the lead is
  **held for manual review**, never silently forwarded or dropped.
- **No double-processing.** Every handled thread gets the `AI-Vetter/Processed`
  label; the search query excludes it on the next run.
- **Cost.** Defaults to `claude-haiku-4-5` — fast and cheap, ample for vetting.
  Bump `CONFIG.MODEL` to a Sonnet model for sharper judgement on borderline leads.
- **Tuning.** Watch the Google Sheet for a few days. If good leads are being
  held, lower `MIN_SCORE_TO_FORWARD`; if junk slips through, raise it or sharpen
  the system prompt in `Code.gs`.
