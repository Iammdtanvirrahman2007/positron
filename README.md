# Positron AI

A lightweight private chat UI for the Tokens.bd Anthropic-compatible Messages API.

## Requirements
- Node.js 20+
- A Tokens.bd API key with access to at least one model

## Run locally

```bash
git clone https://github.com/Iammdtanvirrahman2007/positron.git
cd positron
npm install
cp .env.example .env
```

Open `.env` and set `TOKENS_API_KEY` to your private Tokens.bd key. Do not commit this file.

```bash
npm start
```

Open http://localhost:3000.

## How it works
- The browser talks only to the local Express backend.
- The backend loads the models available to your key from `GET https://tokens.bd/v1/models`.
- Chat requests are forwarded server-side to `POST https://tokens.bd/v1/messages`.
- Your API key is never sent to the browser and `.env` is ignored by Git.

## Notes
- Model availability is determined by your Tokens.bd key, not by hard-coded model names.
- A 402 response is a Tokens.bd billing/credit restriction; this app does not bypass it.
- This is a local app. GitHub Pages cannot run the Node backend. Deploy to a Node-capable host only after configuring a private server-side environment variable.
