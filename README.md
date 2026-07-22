# FundsRoom Backend

A production-ready backend starter kit for a Mini ERP + CRM portal built with Node.js, TypeScript, Express, Prisma, PostgreSQL, JWT, bcrypt, and Zod.

## Setup

1. Copy `.env.example` to `.env` and adjust values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
4. Run migrations and seed the database:
   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Project structure

- `src/` - application source code
- `prisma/` - schema and seed files
- `dist/` - compiled output

## API structure

- `src/app.ts` - Express application setup
- `src/server.ts` - Startup logic
- `src/config/` - configuration and environment bootstrap
- `src/routes/` - route definitions
- `src/middlewares/` - reusable middleware
- `src/utils/` - helpers and response utilities
