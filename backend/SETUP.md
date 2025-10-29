# BlackBow Backend Setup Instructions

## Prerequisites

1. **PostgreSQL** must be installed and running
2. **Node.js 18+** installed
3. **npm** installed

## Database Setup (REQUIRED BEFORE FIRST RUN)

The PostgreSQL database must be created manually. Run this SQL script:

```bash
sudo -u postgres psql -f create_database.sql
```

Or manually:

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE blackbow;
CREATE USER blackbow_user WITH ENCRYPTED PASSWORD 'Ji8cKXf6eWJOrOKA4ZUKFyDFUPhvpm5g';
GRANT ALL PRIVILEGES ON DATABASE blackbow TO blackbow_user;
\c blackbow
GRANT ALL ON SCHEMA public TO blackbow_user;
ALTER DATABASE blackbow OWNER TO blackbow_user;
\q
```

## After Database Creation

1. **Run Prisma Migrations:**
```bash
npx prisma migrate deploy
```

2. **Generate Prisma Client:**
```bash
npx prisma generate
```

3. **Configure Environment Variables:**
   - Copy `.env.example` to `.env`
   - Fill in your API keys (Clerk, Stripe, Pipedrive)

4. **Test Database Connection:**
```bash
node -e "require('dotenv').config(); const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.\$connect().then(() => console.log('✅ Database connected!')).catch(e => console.error('❌ Connection failed:', e))"
```

## Development

```bash
npm run dev
```

## Production Deployment

```bash
bash scripts/deploy.sh
```

## Credentials

- **Database Password:** `Ji8cKXf6eWJOrOKA4ZUKFyDFUPhvpm5g`
- **Admin Verification Code:** `JOM13vMi6aUHeCOUQPpioTrZI1U835O3`

**⚠️ IMPORTANT:** Change these in production!
