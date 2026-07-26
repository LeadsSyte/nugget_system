/**
 * ============================================================================
 *  AI Lead Vetter — Main logic
 * ============================================================================
 *  Flow, per incoming lead email:
 *    1. Find candidate lead threads (Config.LEAD_SEARCH_QUERY).
 *    2. Walk EVERY message in each thread (WordPress leads often share the
 *       same subject and collapse into one thread), skipping any message
 *       already recorded in the log sheet.
 *    3. Ask Claude to judge each new message: real sales lead vs
 *       spam/bot/solicitation, with a 0-100 score, reason, and contact fields.
 *    4. CLEAN leads (score >= threshold)  -> forward to the client + log.
 *       JUNK leads  (score <  threshold)  -> hold (label only) + log.
 *
 *  De-duplication is by Gmail MESSAGE id recorded in the log sheet — so a new
 *  lead landing in an already-seen thread is still vetted, and nothing is ever
 *  vetted (or forwarded) twice.
 *
 *  Entry point for the time-driven trigger: vetLeads()
 * ============================================================================
 */

// Subject prefix stamped on every forwarded clean lead. Also used to detect
// (and skip) our own forwards when they land back in the mailbox.
const FORWARD_PREFIX = '[Qualified Lead] ';

/**
 * Main entry point. Point a time-driven trigger at this (see setUpTrigger()).
 */
function vetLeads() {
  const threads = GmailApp.search(CONFIG.LEAD_SEARCH_QUERY, 0, CONFIG.MAX_PER_RUN);
  if (!threads.length) {
    Logger.log('No threads match the query: %s', CONFIG.LEAD_SEARCH_QUERY);
    return;
  }

  const seen = readLoggedMessageIds_(); // message ids already in the log sheet
  const processedLabel = getOrCreateLabel_(CONFIG.LABEL_PROCESSED);
  const goodLabel      = getOrCreateLabel_(CONFIG.LABEL_GOOD);
  const junkLabel      = getOrCreateLabel_(CONFIG.LABEL_JUNK);

  let handled = 0;
  threads.forEach(function (thread) {
    thread.getMessages().forEach(function (msg) {
      if (handled >= CONFIG.MAX_PER_RUN) return;

      const id = msg.getId();
      if (seen[id]) return; // this exact message was already vetted

      // Skip the vetter's own forwarded copies — a forwarded/BCC'd clean lead
      // lands back in this mailbox and would otherwise be re-vetted and
      // re-forwarded in a loop. Every forward carries the FORWARD_PREFIX in its
      // subject, so this reliably catches them without needing extra scopes.
      if ((msg.getSubject() || '').indexOf(FORWARD_PREFIX) === 0) return;

      try {
        const lead = {
          from:    msg.getFrom(),
          subject: msg.getSubject(),
          body:    (msg.getPlainBody() || msg.getBody() || '').slice(0, 6000),
          date:    msg.getDate(),
          permalink: thread.getPermalink(),
          messageId: id,
        };

        const verdict = vetWithClaude_(lead);
        const isClean = verdict.score >= CONFIG.MIN_SCORE_TO_FORWARD;

        if (isClean) {
          forwardLead_(msg, verdict);
          thread.addLabel(goodLabel);
        } else {
          thread.addLabel(junkLabel);
        }

        logLead_(lead, verdict, isClean);
        thread.addLabel(processedLabel);
        seen[id] = 1;
        handled++;

        Logger.log('%s | score=%s | %s',
          isClean ? 'FORWARDED' : 'HELD', verdict.score, lead.subject);
      } catch (err) {
        // Never let one bad message stop the batch. It stays out of the log,
        // so the next run retries it. Surface the error for troubleshooting.
        Logger.log('ERROR vetting a message: %s', err && err.stack ? err.stack : err);
      }
    });
  });

  Logger.log('Done. Vetted %s new message(s).', handled);
}

/**
 * Ask Claude to vet a single lead. Returns a normalised verdict object:
 *   { score, decision, reason, name, email, phone, summary }
 */
function vetWithClaude_(lead) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set in Script Properties. See README.');
  }

  const system =
    'You are a lead-qualification filter for a marketing agency. You judge ' +
    'inbound WordPress contact-form submissions for one client and decide ' +
    'whether a human should see them.\n\n' +
    'CRITICAL: every submission is delivered by the client website\'s own form ' +
    'mailer, so the email\'s From / sender address is ALWAYS the website address ' +
    'and is meaningless. It is NOT the lead\'s identity, and it is NEVER a sign ' +
    'of impersonation or spoofing. Do NOT lower the score because the email ' +
    'comes from the client\'s own domain. Judge ONLY the enquiry itself and the ' +
    'contact details the person typed INTO THE FORM (these appear in the body: ' +
    'name, email, phone, message).\n\n' +
    'GENUINE = a real person or business making a plausible enquiry about the ' +
    "client's products/services, with realistic contact details. " +
    'JUNK = obvious test submissions (placeholder values such as "test", "Tst", ' +
    '"test@test.com", "123..."), spam, bots, gibberish, or messages trying to ' +
    'sell something TO the client. Be strict but fair. ' +
    'Reply with ONLY a JSON object, no prose, no markdown fences.';

  const prompt =
    'Client: ' + CONFIG.CLIENT_NAME + '\n\n' +
    'A new contact-form submission arrived. The sender address shown below is ' +
    'just the website form mailer — IGNORE it. Base your judgement on the ' +
    'message and the contact details captured in the body. Return JSON with ' +
    'exactly these keys:\n' +
    '{\n' +
    '  "score": <integer 0-100, how likely this is a genuine sales lead>,\n' +
    '  "decision": "<GENUINE|JUNK>",\n' +
    '  "reason": "<one short sentence explaining the score>",\n' +
    '  "name": "<lead name from the form, or empty>",\n' +
    '  "email": "<lead email from the form, or empty>",\n' +
    '  "phone": "<lead phone from the form, or empty>",\n' +
    '  "summary": "<one-line summary of what they want, or empty>"\n' +
    '}\n\n' +
    '--- FORM SUBMISSION ---\n' +
    'Form mailer (ignore this address): ' + lead.from + '\n' +
    'Subject: ' + lead.subject + '\n\n' +
    lead.body;

  const payload = {
    model: CONFIG.MODEL,
    max_tokens: CONFIG.MAX_TOKENS,
    system: system,
    messages: [{ role: 'user', content: prompt }],
  };

  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    payload: JSON.stringify(payload),
  });

  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('Claude API error ' + code + ': ' + text);
  }

  const data = JSON.parse(text);
  const raw = (data.content && data.content[0] && data.content[0].text) || '';
  return normaliseVerdict_(raw);
}

/**
 * Parse Claude's JSON reply defensively and clamp/normalise fields.
 */
function normaliseVerdict_(raw) {
  let obj = {};
  try {
    // Strip any accidental code fences, then grab the first {...} block.
    const cleaned = String(raw).replace(/```json/gi, '').replace(/```/g, '');
    const match = cleaned.match(/\{[\s\S]*\}/);
    obj = JSON.parse(match ? match[0] : cleaned);
  } catch (e) {
    // If the model didn't return parseable JSON, fail SAFE: hold the lead
    // for human review rather than silently forwarding or dropping it.
    return {
      score: 0, decision: 'JUNK',
      reason: 'Could not parse AI response; held for manual review.',
      name: '', email: '', phone: '', summary: '',
    };
  }

  let score = parseInt(obj.score, 10);
  if (isNaN(score)) score = 0;
  score = Math.max(0, Math.min(100, score));

  return {
    score: score,
    decision: obj.decision === 'GENUINE' ? 'GENUINE' : 'JUNK',
    reason: obj.reason || '',
    name: obj.name || '',
    email: obj.email || '',
    phone: obj.phone || '',
    summary: obj.summary || '',
  };
}

/**
 * Forward a clean lead to the client, prepending the AI verdict.
 * `manual` = true when a human released it from the dashboard despite the score.
 */
function forwardLead_(msg, verdict, manual) {
  const header = manual
    ? '🔓 MANUALLY RELEASED  ·  AI score ' + verdict.score + '/100'
    : '✅ AI-VETTED LEAD  ·  Score ' + verdict.score + '/100';
  const banner =
    '────────────────────────────────────────\n' +
    header + '\n' +
    (verdict.summary ? 'What they want: ' + verdict.summary + '\n' : '') +
    (verdict.reason ? (manual ? 'AI note: ' : 'Why it passed: ') + verdict.reason + '\n' : '') +
    '────────────────────────────────────────\n\n' +
    '(Original submission below)\n\n';

  const opts = {
    subject: FORWARD_PREFIX + msg.getSubject(),
    htmlBody: banner.replace(/\n/g, '<br>') + (msg.getBody() || ''),
  };
  if (CONFIG.FORWARD_BCC) opts.bcc = CONFIG.FORWARD_BCC;

  msg.forward(CONFIG.FORWARD_TO.join(','), opts);
}

/**
 * Append one row to the log sheet (creating the sheet/headers if needed).
 */
function logLead_(lead, verdict, isClean) {
  const sheet = getLogSheet_();
  sheet.appendRow([
    new Date(),
    CONFIG.CLIENT_NAME,
    lead.from,
    lead.subject,
    verdict.score,
    verdict.decision,
    isClean ? 'FORWARDED' : 'HELD',
    verdict.name,
    verdict.email,
    verdict.phone,
    verdict.summary,
    verdict.reason,
    lead.permalink,
    lead.messageId || '',
  ]);
}

/* ------------------------------------------------------------------------- *
 *  Helpers
 * ------------------------------------------------------------------------- */

function getOrCreateLabel_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

// 1-based column of "Gmail Message ID" in the log sheet (last column).
const LOG_COL_MSG_ID = 14;

/**
 * Read the set of Gmail message ids already recorded in the log sheet.
 * This is our de-dup source of truth — persistent and unbounded, unlike
 * thread labels (which hid new same-subject leads).
 */
function readLoggedMessageIds_() {
  const sheet = getLogSheet_();
  const last = sheet.getLastRow();
  const map = {};
  if (last < 2) return map; // header only / empty
  const vals = sheet.getRange(2, LOG_COL_MSG_ID, last - 1, 1).getValues();
  vals.forEach(function (r) { if (r[0]) map[String(r[0])] = 1; });
  return map;
}

function getLogSheet_() {
  const props = PropertiesService.getScriptProperties();
  // Prefer the explicit config id; otherwise reuse (or create + remember) one.
  const id = CONFIG.LOG_SHEET_ID || props.getProperty('LOG_SHEET_ID_AUTO');
  let ss;
  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    // Create ONCE and store the id so every later call (and the dashboard)
    // uses the same sheet instead of spawning a new empty one each time.
    ss = SpreadsheetApp.create('AI Lead Vetter Log — ' + CONFIG.CLIENT_NAME);
    props.setProperty('LOG_SHEET_ID_AUTO', ss.getId());
    Logger.log('Created log sheet (id remembered automatically): %s', ss.getUrl());
  }

  let sheet = ss.getSheetByName(CONFIG.LOG_SHEET_TAB);
  if (!sheet) sheet = ss.insertSheet(CONFIG.LOG_SHEET_TAB);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Logged At', 'Client', 'From', 'Subject', 'Score', 'AI Decision',
      'Action', 'Name', 'Email', 'Phone', 'Summary', 'Reason', 'Gmail Link',
      'Gmail Message ID',
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold');
  }
  return sheet;
}
