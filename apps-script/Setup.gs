/**
 * ============================================================================
 *  AI Lead Vetter — One-time setup helpers
 * ============================================================================
 *  Run these ONCE from the Apps Script editor (pick the function in the
 *  toolbar dropdown and press Run). They are safe to re-run.
 * ============================================================================
 */

/**
 * Store the Anthropic API key in Script Properties (never in source).
 * Paste your key between the quotes, run once, then DELETE the key from here
 * and save — it is now stored securely and this line is no longer needed.
 */
function setApiKey() {
  const KEY = 'PASTE_ANTHROPIC_API_KEY_HERE';
  if (KEY.indexOf('PASTE_') === 0) {
    throw new Error('Edit setApiKey() and paste your real Anthropic key first.');
  }
  PropertiesService.getScriptProperties().setProperty('ANTHROPIC_API_KEY', KEY);
  Logger.log('API key stored. You can now remove it from setApiKey().');
}

/**
 * Create the time-driven trigger that runs vetLeads() automatically.
 * Default: every 5 minutes. Re-running clears any existing vetLeads triggers
 * first so you never end up with duplicates.
 */
function setUpTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'vetLeads') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('vetLeads')
    .timeBased()
    .everyMinutes(5)
    .create();
  Logger.log('Trigger installed: vetLeads() runs every 5 minutes.');
}

/**
 * Dry run: vets the most recent matching lead WITHOUT forwarding or labelling,
 * and prints the AI verdict to the log. Use this to sanity-check your
 * LEAD_SEARCH_QUERY and the model output before going live.
 */
function testVetLatest() {
  const threads = GmailApp.search(CONFIG.LEAD_SEARCH_QUERY, 0, 1);
  if (!threads.length) {
    Logger.log('No thread matches LEAD_SEARCH_QUERY: %s', CONFIG.LEAD_SEARCH_QUERY);
    return;
  }
  const msg = threads[0].getMessages()[0];
  const verdict = vetWithClaude_({
    from: msg.getFrom(),
    subject: msg.getSubject(),
    body: (msg.getPlainBody() || '').slice(0, 6000),
  });
  Logger.log('Subject: %s', msg.getSubject());
  Logger.log('Verdict: %s', JSON.stringify(verdict, null, 2));
  Logger.log('Would %s (threshold %s).',
    verdict.score >= CONFIG.MIN_SCORE_TO_FORWARD ? 'FORWARD' : 'HOLD',
    CONFIG.MIN_SCORE_TO_FORWARD);
}
