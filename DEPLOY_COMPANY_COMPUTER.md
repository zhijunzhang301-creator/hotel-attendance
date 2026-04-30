# Company LAN Deployment

This project can run as an internal company attendance system without any paid hosting, but it must live on a company computer that stays powered on during working hours.

## What to copy

Copy the whole project folder to the company computer, including both:

- `backend/`
- `frontend/`

Do not rely on copying only one edited file. The backend now serves the built frontend, so both folders are required.

## What the company computer needs

Install these free components on the company computer:

- Node.js
- npm
- PostgreSQL

The app will not work with code alone. It also needs the database.

## Database requirement

Your current local database URL points to:

- `postgresql://postgres:...@localhost:5432/hotel_attendance`

That means the company computer must have:

- PostgreSQL running locally, or
- a reachable shared PostgreSQL server with a new `DATABASE_URL`

If you move to a new computer and keep `localhost`, then the database data must also be migrated there.

## Environment file

In `backend/`, create `.env` from `.env.example` and fill in the real values.

Recommended internal-LAN settings:

```env
PORT=3001
HOST=0.0.0.0
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/hotel_attendance
JWT_SECRET=replace_with_a_long_random_secret
ALLOWED_IP=127.0.0.1,::1
ADMIN_BYPASS=true
```

`HOST=0.0.0.0` is important. It allows other devices on the company network to reach the app.

## First-time setup

Run these commands on the company computer:

```bash
cd /path/to/hotel-attendance/frontend
npm install
npm run build

cd /path/to/hotel-attendance/backend
npm install
cp .env.example .env
# edit .env with the real values
npm run start:lan
```

Once the backend is running, it will serve both:

- the API
- the built frontend

So users only need one address:

```text
http://COMPANY_COMPUTER_IP:3001
```

Example:

```text
http://192.168.1.50:3001
```

## How staff will use it

- Staff connected to company Wi-Fi open the company computer IP in a browser.
- Managers/admins on the same company network can open the same link.

## Important limitation

This is an internal-LAN deployment only.

- Staff inside company Wi-Fi: supported
- Admins outside the company: not supported unless you later add VPN, port forwarding, or public hosting

If admins must access it from anywhere, you will eventually need a public server or secure remote access solution.

## Keeping the app available

If the company computer is shut down, sleeping, or the Node process stops, the attendance system becomes unavailable.

For a more stable in-office setup, use:

- a dedicated office computer
- sleep disabled during business hours
- automatic startup/login for the app process if your IT policy allows it

## Quick health check

After launch, test these URLs from another device on the same network:

- `http://COMPANY_COMPUTER_IP:3001/`
- `http://COMPANY_COMPUTER_IP:3001/api/health`

## Git status marks

Common `git status` marks:

- `M`: modified file
- `??`: untracked new file
- `U`: unmerged conflict that still needs to be resolved

Right now your repo shows many `M` files and some `??` files. I do not see any `U` conflict in the current status output.

## Should you push first?

Recommended: yes, after you review the changes.

Reasons:

- You keep a backup before moving machines.
- It is easier to clone on the company computer instead of manually copying files.
- You avoid missing hidden files or new files.

Be careful with `backend/.env`:

- do not push it to a public repo
- even in a private repo, check whether you want DB passwords and JWT secrets stored there

Safer pattern:

- commit code
- keep real `.env` only on each machine
- use `.env.example` as the template
