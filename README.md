# 🩺 Clinically — Clinic Management System

A fast, responsive staff dashboard for a healthcare clinic. Manage patients,
visits, prescriptions, appointments, billing, services and reports — all in one
place, with role-based access for **admins, doctors and receptionists**.

Built with **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
MongoDB (Mongoose)**.

---

## ✨ Features

- **Authentication & roles** — secure JWT cookie sessions; three roles (admin /
  doctor / receptionist) with granular permissions.
- **Dashboard** — today's appointments, visits, money collected, outstanding
  balances and recent activity at a glance.
- **Patients** — registration, fast search, and a full profile showing complete
  visit history, total paid, outstanding balance, last visit, allergies (with a
  safety banner), chronic conditions and emergency contact.
- **Visits** — record chief complaint, diagnosis, **vitals** (BP, pulse, temp,
  weight, height, SpO₂), **services taken**, **prescriptions** (drug, dosage,
  frequency, duration, instructions), notes and follow-up date. Every visit
  generates a **printable invoice**.
- **Billing** — automatic totals (subtotal, discount, tax, paid, balance),
  payment status, record additional payments, and an outstanding-balances view.
- **Appointments** — day-by-day scheduling with status tracking (scheduled /
  completed / cancelled / no-show) and one-click "start visit".
- **Documents & lab reports** — upload PDFs/images (lab results, scans,
  insurance, etc.) to a patient or a specific visit; access-controlled, never
  public. Image thumbnails, view/download/delete.
- **Follow-ups** — a dedicated view of patients with upcoming follow-up dates,
  grouped into overdue / today / this week / upcoming.
- **Services catalog** — manage the services your clinic offers and their prices.
- **Staff management** (admin) — add/edit staff, assign roles, activate/deactivate.
- **Clinic settings** (admin) — clinic name, address, contacts, default tax rate
  and invoice footer, used across the app and on printed invoices.
- **Reports & CSV export** — revenue by month, visits by doctor, top services,
  payment breakdown; export patients and billing to CSV.
- **My account** — every user can update their profile and change their password.
- **Global patient search** in the top bar, **toast notifications**, a **7-day
  collections chart**, **birthday reminders** and **vitals trends** (weight / BP).
- **Responsive** — works on desktop and mobile with a collapsible sidebar.

---

## 🚀 Getting started

```bash
npm install
cp .env.example .env.local   # optional in development — every setting has a dev default
npm run dev
```

Open **http://localhost:3000** and sign in with a demo account below.

> **Zero database setup required.** If no `MONGODB_URI` is configured, the app
> automatically boots an **embedded MongoDB** (stored in `./.mongo-data`) and
> seeds demo data on first run. The first start downloads a small MongoDB binary.

### Demo accounts

| Role          | Email                       | Password       |
| ------------- | --------------------------- | -------------- |
| Administrator | `admin@clinically.test`     | `admin123`     |
| Doctor        | `doctor@clinically.test`    | `doctor123`    |
| Receptionist  | `reception@clinically.test` | `reception123` |

Demo accounts are only seeded (and listed on the sign-in page) in development,
or in production when `AUTO_SEED=true` is set explicitly.

---

## 🗄️ Using a real MongoDB

Edit `.env.local` and set a connection string:

```env
# Local MongoDB via Docker (see docker-compose.yml)
MONGODB_URI=mongodb://localhost:27017/clinically
# …or MongoDB Atlas
# MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/clinically
```

To run a local MongoDB with Docker:

```bash
docker compose up -d      # starts MongoDB on :27017
npm run dev
```

### Configuration (`.env.local`)

| Variable                  | Purpose                                               |
| ------------------------- | ----------------------------------------------------- |
| `MONGODB_URI`             | MongoDB connection (omit to use the embedded DB).     |
| `AUTH_SECRET`             | Secret used to sign session tokens. **Required in production** (min. 32 chars). |
| `AUTO_SEED`               | Seed demo data when the DB is empty (`true`/`false`). Default: on in dev, off in production. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Creates the first admin on an empty DB when demo mode is off. |
| `NEXT_PUBLIC_CURRENCY`    | Currency symbol shown in the UI (default `₹`).        |
| `NEXT_PUBLIC_CLINIC_NAME` | Clinic name shown in the UI.                          |

Reset the embedded demo database any time:

```bash
npm run db:reset   # wipes ./.mongo-data; re-seeds on next start
```

### Deploying to production

- Set `MONGODB_URI` to a real database — the embedded DB is for development only.
- Set `AUTH_SECRET` to a long random value (`openssl rand -base64 32`). The app
  refuses to start a session without one in production.
- Leave `AUTO_SEED` unset (or `false`) so no demo accounts are created.
- For the first start, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (min. 8 chars).
  If the database has no users, that admin account is created. Remove both
  variables after you've signed in, and add the rest of your staff from
  **Staff**.

---

## 🧱 Project structure

```
app/
  (dashboard)/      Protected pages: dashboard, patients, visits,
                    appointments, billing, services, staff, reports
  api/              Route handlers (auth, patients, visits, …)
  login/            Login screen
components/         Shell, forms, dialogs and shared UI
lib/                db, auth/session, permissions, queries, validation, utils
models/             Mongoose schemas (User, Patient, Service, Appointment, Visit)
proxy.ts            Auth gate (Next.js 16 proxy / formerly middleware)
```

---

## 🔐 Roles & permissions (summary)

| Capability             | Admin | Doctor | Receptionist |
| ---------------------- | :---: | :----: | :----------: |
| View patients          |  ✅   |   ✅   |      ✅      |
| Add/edit patients      |  ✅   |   ✅   |      ✅      |
| Record clinical visits |  ✅   |   ✅   |      —       |
| Collect payments       |  ✅   |   —    |      ✅      |
| Manage services        |  ✅   |   —    |      —       |
| Manage staff           |  ✅   |   —    |      —       |
| View reports           |  ✅   |   ✅   |      ✅      |

Adjust these in `lib/permissions.ts`.
