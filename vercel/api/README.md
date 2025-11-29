# NSS API - Vercel Serverless Backend with Prisma

A serverless backend built with Fastify and Prisma ORM for the NSS (National Service Scheme) management application.

## Tech Stack

- **Fastify** - Fast and low overhead web framework
- **Prisma ORM** - Next-generation database toolkit
- **PostgreSQL** - Database (via Prisma Accelerate)
- **Vercel** - Serverless deployment platform

## Setup

### 1. Install Dependencies

```bash
cd vercel/api
npm install
```

### 2. Configure Environment

Create a `.env` file with your database URL:

```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
```

### 3. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed initial data
npm run prisma:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Server runs at http://localhost:5000

## NPM Scripts

- `npm run dev` - Start development server with watch mode
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:push` - Push schema changes to database
- `npm run prisma:seed` - Seed database with initial data
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run db:setup` - Run all database setup commands
