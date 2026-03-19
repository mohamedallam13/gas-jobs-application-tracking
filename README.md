# Gas Jobs Application Tracking

A Google Apps Script automation tool that streamlines the job application process. Pulls job data from Google Sheets and Forms, generates personalised cover letters, bundles documents, and sends application emails — all from a custom Sheets menu.

![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=flat&logo=google&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Sheets%20Add--on-blue)

---

## Features

- Aggregates job application data entered via Google Forms into a Google Sheet
- Generates a starter cover letter based on job title, company industry, and other form inputs
- Bundles cover letter and supporting docs and sends an application email to the hiring manager
- Writes submission dates back to the sheet for tracking
- Saves generated cover letters as Google Docs and PDFs to Google Drive
- All triggered from a custom Google Sheets menu — no coding required to run

---

## Tech Stack

| Layer        | Technology                                  |
|--------------|---------------------------------------------|
| Platform     | Google Apps Script                          |
| Trigger      | Custom Sheets menu (onOpen)                 |
| Integrations | Google Sheets, Docs, Forms, Drive, Gmail    |
| Deploy       | clasp CLI                                   |

---

## Project Structure

```
gas-jobs-application-tracking/
├── README.md
├── AGENT.md
├── .gitignore
├── screenshots/
└── src/
    ├── appsscript.json              # GAS manifest
    ├── Menu Code.js                 # Custom menu registration (onOpen)
    ├── Toolkit.js                   # Shared utility functions
    ├── z-code_Main.js               # Main orchestration
    ├── z-code_UI.js                 # UI and dialog helpers
    ├── z-code_CLHandler.js          # Cover letter handler
    ├── z-code_CLWriter.js           # Cover letter generation
    ├── z-code_Email Handler.js      # Email composition and sending
    ├── z-code_GoogleFormsManager.js # Forms integration
    └── z-code_Sheets Manager.js     # Sheets read/write
```

---

## Getting Started

### Prerequisites

- A Google account with Google Apps Script access
- [clasp](https://github.com/google/clasp) installed globally

```bash
npm install -g @google/clasp
clasp login
```

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/mohamedallam13/gas-jobs-application-tracking.git
   cd gas-jobs-application-tracking
   ```

2. Create and link an Apps Script project bound to your tracking Sheet:
   ```bash
   clasp create --type sheets --title "Jobs Tracker" --rootDir src
   ```

3. Push source files:
   ```bash
   clasp push
   ```

4. Open the linked Google Sheet — the custom menu will appear after reload.

---

## Usage

1. Fill in job details via the linked Google Form
2. Open the tracking Google Sheet
3. Use the custom menu to trigger: cover letter generation → email send → date write-back

---

## Author

**Mohamed Allam** — [GitHub](https://github.com/mohamedallam13) · [Email](mailto:mohamedallam.tu@gmail.com)
