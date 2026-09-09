# RupeeWise — Expense Tracker

Production-ready full-stack expense tracking app with React, Express, and MongoDB. Includes working CRUD, search/category filters, monthly analytics, charts, INR formatting, validation, responsive UI, security headers, and a production static build.

## Local development

```bash
cp .env.example .env
docker compose up -d mongo
npm install
npm run dev
```
Open `http://localhost:5173`.

For a quick ephemeral demo without MongoDB, set `ALLOW_MEMORY_DB=true` and leave `MONGODB_URI` empty. This mode is intentionally disabled in production.

## Production

Set `MONGODB_URI` and optionally `CLIENT_ORIGIN`, then:

```bash
npm ci
npm run build
NODE_ENV=production npm start
```

The Express process serves both the API and compiled React client. Deploy to Render, Railway, Fly.io, or a Node host and use MongoDB Atlas. Health check: `/api/health`.

## GitHub

```bash
git init
git add .
git commit -m "Build RupeeWise expense tracker"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/rupeewise.git
git push -u origin main
```

Never commit `.env`. Configure environment variables in your hosting provider.
