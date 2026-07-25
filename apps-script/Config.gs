/**
 * ============================================================================
 *  AI Lead Vetter — Configuration
 * ============================================================================
 *  Central place to tune the vetter for a single client. Everything an
 *  operator would reasonably change lives here; the logic lives in Code.gs.
 *
 *  Secrets (API key) do NOT go here — they live in Script Properties so they
 *  are never committed to git. See README for the one-time setup.
 * ============================================================================
 */

const CONFIG = {
  // -------------------------------------------------------------------------
  //  Which client is this instance for? (used in labels, logs, subject tags)
  // -------------------------------------------------------------------------
  CLIENT_NAME: 'CLIENT_NAME_HERE',

  // -------------------------------------------------------------------------
  //  How do we recognise an incoming lead in the mailbox?
  //  This is a normal Gmail search query. Narrow it to THIS client's leads
  //  so we never touch anything else in leads@syte.co.za.
  //
  //  Examples:
  //    'subject:("New Lead" OR "Contact Form") newer_than:2d'
  //    'from:(wordpress@theirdomain.com) newer_than:2d'
  //    'to:(leads+clientname@syte.co.za) newer_than:2d'
  //
  //  The script automatically appends `-label:<PROCESSED_LABEL>` so a lead is
  //  never vetted twice. Keep `newer_than:` in as a safety net.
  // -------------------------------------------------------------------------
  LEAD_SEARCH_QUERY: 'subject:("New Lead") newer_than:2d',

  // -------------------------------------------------------------------------
  //  Where do CLEAN (qualified) leads get forwarded to?
  //  Typically the client's own address. Add leads@ back here too if you want
  //  an internal clean copy. Junk is NEVER forwarded — it just gets labelled
  //  and logged.
  // -------------------------------------------------------------------------
  FORWARD_TO: ['client@theirdomain.com'],

  // Optional: BCC an internal address on every forwarded clean lead.
  FORWARD_BCC: 'leads@syte.co.za',

  // -------------------------------------------------------------------------
  //  Scoring threshold. Leads scoring >= this are treated as CLEAN and
  //  forwarded. Below it they are held (labelled + logged only).
  // -------------------------------------------------------------------------
  MIN_SCORE_TO_FORWARD: 55,

  // -------------------------------------------------------------------------
  //  Google Sheet to log every lead + verdict into.
  //  Paste the Sheet ID from its URL: docs.google.com/spreadsheets/d/<THIS>/edit
  //  Leave blank ('') to auto-create a sheet on first run (ID is then printed
  //  to the execution log — paste it back here to reuse it).
  // -------------------------------------------------------------------------
  LOG_SHEET_ID: '',
  LOG_SHEET_TAB: 'Lead Log',

  // -------------------------------------------------------------------------
  //  Anthropic / Claude settings.
  //  Haiku is fast + cheap and plenty for lead vetting. Bump to Sonnet if you
  //  want sharper judgement on borderline cases.
  // -------------------------------------------------------------------------
  MODEL: 'claude-haiku-4-5-20251001',
  MAX_TOKENS: 700,

  // -------------------------------------------------------------------------
  //  Gmail labels used for state. Created automatically if missing.
  // -------------------------------------------------------------------------
  LABEL_PROCESSED: 'AI-Vetter/Processed',
  LABEL_GOOD:      'AI-Vetter/Qualified',
  LABEL_JUNK:      'AI-Vetter/Junk',

  // Safety cap: max leads to handle per run (avoids runaway / quota blowups).
  MAX_PER_RUN: 25,
};
