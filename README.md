# DCBL Gate Management System (TMS)

A web application for managing plant gate operations: RFID vehicle tracking, weighbridges, bulker loading and reporting. It is built with Next.js and React, and signs users in with Microsoft SSO.

## Features

- **Microsoft SSO login** using the Entra ID (Azure AD) authorization code flow, with a signed session cookie
- **Plant selection** after login, so each session works against one plant
- **Gate RFID**: live gate records and gate status
- **Weighbridges**: weighbridge status, records and list
- **Bulker**: controller status and last records
- **Truck registration**: read an RFID tag and register a truck
- **Device status**: connectivity of the plant devices
- **Reports**: weighbridge-wise, WB-wise, raw WB-wise, bulker-wise, location-wise, RFID sense, auto yard-in, transaction logs and API logs

## Tech Stack

| Area | Tools |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Data | MySQL (`mysql2`), SQL Server (`mssql`) |
| Auth | Microsoft Entra ID OAuth 2.0, `jose` for signed tokens |
| UI data | SWR, Chart.js / react-chartjs-2, ExcelJS |

## Getting Started

**Prerequisites:** Node.js 20+, access to the plant MySQL database, and a Microsoft Entra ID app registration.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env.local` file in the project root:

```dotenv
# Database
MYSQL_HOST=
MYSQL_PORT=3306
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DATABASE=

# Microsoft SSO
AD_TENANT=
AD_CLIENT_ID=
AD_CLIENT_SECRET=
AD_REDIRECT_URI=http://localhost:3000/api/sso/callback
APP_URL=http://localhost:3000

# Signs the state and session tokens (use a long random string)
AUTH_SECRET=

# Optional label shown next to the title
NEXT_PUBLIC_TMS_MODE=
```

Never commit `.env.local`.

## How the Microsoft Login Works

1. The user clicks **Sign in with Microsoft**, which opens `/api/sso/login`.
2. The app redirects to Microsoft with a signed `state` and `response_mode=form_post`.
3. After login, Microsoft POSTs the result to `/api/sso/callback`.
4. The server checks the `state`, exchanges the code for tokens (the client secret stays on the server), reads the user's email and name, and sets an httpOnly `tms_user` cookie.
5. App pages under `app/(app)` require that cookie. `/logout` clears it.

In Azure, add the redirect URI under **Authentication → Web → Redirect URIs**.

## Project Structure

```
app/
  page.tsx            Login and plant selection
  (app)/              Protected pages (gate, weighbridges, bulker, reports...)
  api/                Route handlers (sso, gate, weighbridge, bulker, reports...)
  logout/             Clears the session cookies
components/           Header, AppShell
lib/
  auth.ts             Token signing and verification
  db.ts               Database access
  plant.ts            Plant session helpers
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm run lint` | Run ESLint |

---
Designed and developed by Accsys Electronics, Chennai.
