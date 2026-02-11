# PiggyVerse

The decentralized gaming hub for PiggyDAO. A platform for tournaments, betting, and community engagement.

## Features

- **Competitive Hub**: Host and join tournaments with customizable rules.
- **Betting System**: Multi-market betting with parimutuel support.
- **Game Library**: Curated collection of web3 games.
- **Watch to Earn**: Earn rewards by watching tournament streams.
- **Social Integration**: Login with Discord and Twitter.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Auth**: NextAuth.js
- **Web3**: Wagmi + Viem

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Atteng/Piggyverse.git
   cd Piggyverse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

4. **Initialize Database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## Environment Variables

The application requires several environment variables to function correctly. See `.env.example` for the full list. Key variables include:

- `DATABASE_URL`: Connection string for PostgreSQL.
- `NEXTAUTH_SECRET`: Secret key for session encryption.
- `DISCORD_CLIENT_ID` / `SECRET`: For Discord authentication.
- `NEXT_PUBLIC_CONTRACT_...`: Smart contract addresses for the PiggyVerse ecosystem.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
