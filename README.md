# Tasty Tidbits Bot

Tasty Tidbits Bot is our human-friendly real-time food ordering bot. You will like it.
Its store is persisted on Redis and it's super fast!
Although not powered by any AI engine, Tasty Tidbits Bot is build to emulate Chat gpt. You would notice from the UI.

## Installation

#### Clone and Install dependencies
I'd assume you have node (npm, or yarn or npm or bun) installed

```bash
$ git clone https://github.com/odelolajosh/tasty_tidbits-bot
$ cd tasty_tidbits-bot
$ npm install
```

#### Setup environment variables
Create an .env file with these variables.

```env
REDIS_PASSWORD=xxx
REDIS_HOST=xxx
REDIS_PORT=xxx
# Session secret
SESSION_SECRET=xxx
```

#### Run in development mode
```bash
npm run dev
```

Tasty Tidbits Bot should be up in your local port 3000.
