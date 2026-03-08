# Dark Fabrik Client Portal

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
4. Run migrations:
   ```bash
   npm run prisma:migrate
   ```
5. Seed the database:
   ```bash
   npm run prisma:seed
   ```
6. Start development server:
   ```bash
   npm run dev
   ```

## Testing

```bash
npm test
```

## Auth

The app uses NextAuth credentials authentication with Prisma-backed sessions.

Seeded demo credentials:
- Email: `admin@darkfabrik.com`
- Password: `password123`
