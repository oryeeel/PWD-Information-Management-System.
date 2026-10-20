# PWD Information Management System — Frontend Only

React + Vite frontend prototype based on the provided capstone UI and feature descriptions.

## Features

- Admin / Staff demo login
- Dashboard summary
- PWD records search and filtering
- View and edit PWD records
- Add new PWD record
- Automatic PWD ID generation and incrementing (`PWD-0001`, `PWD-0002`, ...)
- PWD ID front/back preview and browser printing
- Reports grouped by disability type, barangay, gender, or status
- CSV export
- User management demo
- Messaging/notification demo
- Settings page
- Responsive layout
- Browser `localStorage` persistence

## Automatic PWD ID behavior

The frontend scans all stored records, finds the highest numeric PWD ID, then generates the next one.

Example:
- Existing highest ID: `PWD-0042`
- New record becomes: `PWD-0043`


> Important: because this is **frontend only**, the ID counter is stored in the user's browser. For a real multi-user production system, ID generation should be enforced by the backend/database to prevent duplicate IDs across different computers.

## Run in VS Code

1. Open this project folder in VS Code.
2. Open **Terminal > New Terminal**.
3. Install dependencies:

   `npm install`

4. Start the Vite development server:

   `npm run dev`

5. Open the shown address, usually `http://localhost:5173`.

### Windows PowerShell execution-policy error

If PowerShell says `npm.ps1 cannot be loaded because running scripts is disabled`, either:

- Use **Command Prompt** as the VS Code terminal and run `npm install` / `npm run dev`, or
- In PowerShell, use `npm.cmd install` and `npm.cmd run dev`.

## Demo accounts

Admin:
- username: `admin`
- password: `admin123`

Staff:
- username: `staff1`
- password: `staff123`

