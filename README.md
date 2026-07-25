# nugget_system

Home for small Syte automation tools.

## AI Lead Vetter

A single-client, mailbox-based AI lead filter built as a Google Apps Script.
Incoming WordPress leads landing in `leads@syte.co.za` are vetted by Claude
first — genuine leads are forwarded to the client, junk is held, and every lead
is logged to a Google Sheet.

See [`apps-script/README.md`](apps-script/README.md) for setup.
