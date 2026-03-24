> This website was generated with [PageAI](https://pageai.pro).
>
> 1-shot production-ready websites with a design system and AI-powered content generation.
> Get started on **[pageai.pro](https://pageai.pro)**.

Vibe Coding Starter
===================

This starter was created as part of the [Vibe Coding Starter](https://pageai.pro/vibe-coding-starter-guide) tutorial.

See the full video here:

[![Image](https://pageai.pro/static/images/blog/vibe-coding-starter-guide.jpg)](https://www.youtube.com/watch?v=p_q7-iW606U)

- [Installation](#installation)
- [Environment](#environment)
- [Development](#development)
- [Build](#build)

## Installation

```bash
npm i
```

## Environment

The app uses **Postgres** for the CRM and admin SQL. Set the connection string in the environment (never commit real credentials).

- **Local:** Copy [.env.example](.env.example) to `.env.local` and set `DATABASE_URL` to your Neon (or other Postgres) URL.
- **Vercel:** In the project → Settings → Environment Variables, add `DATABASE_URL` with the same connection string (Production / Preview as needed).

After setting `DATABASE_URL`, run CRM migrations once:

```bash
npm run crm:migrate
```

## Development

First, run the development server:

```bash
npm run dev
```

## Build

To build the site for production, run the following command:

```bash
npm run build
```
