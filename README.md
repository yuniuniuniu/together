<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sanctuary

A private, encrypted space for couples to share memories, track anniversaries, and journal together.

## Project Structure

```
together/
├── client/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   ├── components/
│   │   ├── features/
│   │   └── shared/
│   ├── tests/
│   └── package.json
├── server/              # Backend (Express + SQLite)
│   ├── src/
│   ├── tests/
│   └── package.json
├── package.json         # Workspace root
└── openspec/            # Specifications
```

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `client/.env.example` to `client/.env` and set `GEMINI_API_KEY`
   - Copy `server/.env.example` to `server/.env` and configure as needed

3. Run the app:
   ```bash
   # Run frontend only
   npm run dev

   # Run backend only
   npm run dev:server

   # Run both frontend and backend
   npm run dev:all
   ```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server (port 3000) |
| `npm run dev:server` | Start backend dev server (port 3001) |
| `npm run dev:all` | Start both frontend and backend |
| `npm run build` | Build frontend for production |
| `npm run test` | Run all tests (client + server) |
| `npm run test:client` | Run frontend tests only |
| `npm run test:server` | Run backend tests only |

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, React Router
- **Backend:** Express.js, SQLite (sql.js), JWT
- **Testing:** Vitest, Testing Library
