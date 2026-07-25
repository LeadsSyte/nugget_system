/**
 * ============================================================================
 *  AI Lead Vetter — Main logic
 * ============================================================================
 *  Flow, per incoming lead email:
 *    1. Find un-processed lead threads (Config.LEAD_SEARCH_QUERY).
 *    2. Ask Claude to judge: real sales lead vs spam/bot/solicitation,
 *       with a 0-100 score, a reason, and the extracted contact fields.
 *    3. CLEAN leads (score >= threshold)  -> forward to the client + log.
 *       JUNK leads  (score <  threshold)  -> hold (label only) + log.
 *    4. Label the thread Processed so it is never vetted twice.
 *
 *  Entry point for the time-driven trigger: vetLeads()
 * ============================================================================
 */

/**
 * Main entry point. Point a time-driven trigger at this (see setUpTrigger()).
 */
function vetLeads() {
  const query = CONFIG.LEAD_SEARCH_QUERY + ' -label:"' + CONFIG.LABEL_PROCESSED + '"';
  const threads = GmailApp.search(query, 0, CONFIG.MAX_PER_RUN);

  if (!threads.length) {
    Logger.log('No new leads to vet.');
    return;
  }
  Logger.log('Found %s lead thread(s) to vet.', threads.length);

  const processedLabel = getOrCreateLabel_(CONFIG.LABEL_PROCESSED);
  const goodLabel      = getOrCreateLabel_(CONFIG.LABEL_GOOD);
  const junkLabel      = getOrCreateLabel_(CONFIG.LABEL_JUNK);

  threads.forEach(function (thread) {
    try {
      const msg = thread.getMessages()[0]; // the original lead
      const lead = {
        from:    msg.getFrom(),
        subject: msg.getSubject(),
        body:    (msg.getPlainBody() || msg.getBody() || '').slice(0, 6000),
        date:    msg.getDate(),
        permalink: thread.getPermalink(),
        messageId: msg.getId(), // lets the dashboard re-forward a held lead
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

      Logger.log('%s | score=%s | %s',
        isClean ? 'FORWARDED' : 'HELD', verdict.score, lead.subject);
    } catch (err) {
      // Never let one bad email stop the batch. Leave it un-processed so the
      // next run retries it, and surface the error in the log.
      Logger.log('ERROR vetting a lead: %s', err && err.stack ? err.stack : err);
    }
  });
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
    'inbound web-form leads for one client and decide whether a human should ' +
    'see them. GENUINE leads are real people or businesses enquiring about the ' +
    "client's products/services. JUNK is: spam, bots, SEO/marketing/link-building " +
    'solicitations, obvious test submissions, gibberish, or pitches selling ' +
    'something TO the client. Be strict but fair. Reply with ONLY a JSON object, ' +
    'no prose, no markdown fences.';

  const prompt =
    'Client: ' + CONFIG.CLIENT_NAME + '\n\n' +
    'Evaluate this inbound lead and return JSON with exactly these keys:\n' +
    '{\n' +
    '  "score": <integer 0-100, how likely this is a genuine sales lead>,\n' +
    '  "decision": "<GENUINE|JUNK>",\n' +
    '  "reason": "<one short sentence explaining the score>",\n' +
    '  "name": "<lead name or empty>",\n' +
    '  "email": "<lead email or empty>",\n' +
    '  "phone": "<lead phone or empty>",\n' +
    '  "summary": "<one-line summary of what they want, or empty>"\n' +
    '}\n\n' +
    '--- LEAD EMAIL ---\n' +
    'From: ' + lead.from + '\n' +
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
    subject: '[Qualified Lead] ' + msg.getSubject(),
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

function getLogSheet_() {
  let ss;
  if (CONFIG.LOG_SHEET_ID) {
    ss = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID);
  } else {
    // Auto-create once, then tell the operator to paste the ID into Config.
    ss = SpreadsheetApp.create('AI Lead Vetter Log — ' + CONFIG.CLIENT_NAME);
    Logger.log('Created log sheet. Paste this ID into CONFIG.LOG_SHEET_ID: %s', ss.getId());
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
