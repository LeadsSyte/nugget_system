/**
 * ============================================================================
 *  AI Lead Vetter — Dashboard (Apps Script web app)
 * ============================================================================
 *  A self-contained front end served straight from this project. Reads the
 *  log sheet and shows every vetted lead with live stats, filtering, and a
 *  one-click "Forward to client" override for leads the AI held.
 *
 *  Deploy:  Apps Script editor -> Deploy -> New deployment -> Web app.
 *           Execute as: Me (leads@syte.co.za).  Access: your Workspace domain
 *           (or specific people). Open the resulting URL — that's the dashboard.
 * ============================================================================
 */

// Sheet column order (0-based) — must match logLead_() / getLogSheet_() headers.
const COL = {
  LOGGED_AT: 0, CLIENT: 1, FROM: 2, SUBJECT: 3, SCORE: 4, DECISION: 5,
  ACTION: 6, NAME: 7, EMAIL: 8, PHONE: 9, SUMMARY: 10, REASON: 11,
  LINK: 12, MSG_ID: 13,
};

/** Serve the dashboard HTML. */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Dashboard')
    .setTitle('AI Lead Vetter — ' + CONFIG.CLIENT_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Return everything the front end needs: rolled-up stats + the lead rows
 * (newest first, capped for responsiveness).
 */
function getDashboardData() {
  const sheet = getLogSheet_();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1); // drop header

  const leads = rows.map(function (r) {
    return {
      loggedAt: r[COL.LOGGED_AT] ? new Date(r[COL.LOGGED_AT]).toISOString() : '',
      from:     String(r[COL.FROM] || ''),
      subject:  String(r[COL.SUBJECT] || ''),
      score:    Number(r[COL.SCORE] || 0),
      decision: String(r[COL.DECISION] || ''),
      action:   String(r[COL.ACTION] || ''),
      name:     String(r[COL.NAME] || ''),
      email:    String(r[COL.EMAIL] || ''),
      phone:    String(r[COL.PHONE] || ''),
      summary:  String(r[COL.SUMMARY] || ''),
      reason:   String(r[COL.REASON] || ''),
      link:     String(r[COL.LINK] || ''),
      messageId: String(r[COL.MSG_ID] || ''),
    };
  }).reverse(); // newest first

  const total = leads.length;
  const forwarded = leads.filter(function (l) { return /FORWARDED/i.test(l.action); }).length;
  const held = total - forwarded;

  return {
    client: CONFIG.CLIENT_NAME,
    threshold: CONFIG.MIN_SCORE_TO_FORWARD,
    stats: {
      total: total,
      forwarded: forwarded,
      held: held,
      forwardRate: total ? Math.round((forwarded / total) * 100) : 0,
    },
    leads: leads.slice(0, 500),
  };
}

/**
 * Human override: forward a lead the AI held. Called from the dashboard via
 * google.script.run. Fetches the original message, forwards it to the client,
 * and flips its Action cell to "FORWARDED (manual)".
 */
function releaseLead(messageId) {
  if (!messageId) throw new Error('No message id supplied.');

  const msg = GmailApp.getMessageById(messageId);
  if (!msg) throw new Error('Could not find that email (it may have been deleted).');

  // Rebuild a minimal verdict from the logged row so the banner still reads well.
  const row = findRowByMessageId_(messageId);
  const verdict = row
    ? {
        score:   Number(row.values[COL.SCORE] || 0),
        summary: String(row.values[COL.SUMMARY] || ''),
        reason:  String(row.values[COL.REASON] || ''),
      }
    : { score: 0, summary: '', reason: '' };

  forwardLead_(msg, verdict, true /* manual */);

  // Relabel the thread and update the log so the dashboard reflects it.
  const thread = msg.getThread();
  thread.removeLabel(getOrCreateLabel_(CONFIG.LABEL_JUNK));
  thread.addLabel(getOrCreateLabel_(CONFIG.LABEL_GOOD));
  if (row) {
    getLogSheet_().getRange(row.rowIndex, COL.ACTION + 1).setValue('FORWARDED (manual)');
  }

  return { ok: true };
}

/** Find a log row by its stored Gmail message id. Returns {rowIndex, values} or null. */
function findRowByMessageId_(messageId) {
  const sheet = getLogSheet_();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][COL.MSG_ID]) === String(messageId)) {
      return { rowIndex: i + 1, values: values[i] }; // 1-based sheet row
    }
  }
  return null;
}
