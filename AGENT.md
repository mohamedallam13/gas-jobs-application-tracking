# AGENT.md — gas-jobs-application-tracking

## Purpose
A Google Apps Script automation tool that streamlines job applications based on entries from Google Sheets, Docs, and Forms. Generates cover letters, tracks application status, and sends email notifications.

## Structure
```
gas-jobs-application-tracking/
├── README.md
├── AGENT.md
├── .gitignore
├── screenshots/
└── src/
    ├── appsscript.json           ← GAS manifest
    ├── Menu Code.js              ← custom menu registration
    ├── Toolkit.js                ← shared utility functions
    ├── z-code_Main.js            ← main orchestration
    ├── z-code_UI.js              ← UI / dialog helpers
    ├── z-code_CLHandler.js       ← cover letter handler
    ├── z-code_CLWriter.js        ← cover letter writer
    ├── z-code_Email Handler.js   ← email sending logic
    ├── z-code_GoogleFormsManager.js ← Forms integration
    └── z-code_Sheets Manager.js  ← Sheets read/write
```

## Key Facts
- **Platform:** Google Apps Script (Sheets Add-on / standalone script)
- **Integrations:** Google Sheets, Google Docs, Google Forms, Gmail
- **Pattern:** Menu-driven automation; `z-code_` prefix = core modules
- **Entry point:** `Menu Code.js` registers the custom menu; `z-code_Main.js` orchestrates

## Development Notes
- All source files live under `src/` — push with clasp from that directory
- No Node/npm at runtime; ES5-compatible GAS code only
