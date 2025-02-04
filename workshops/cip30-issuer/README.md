<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/hyperledger/identus@latest/resources/images/hyperledger-identus.svg" />
</p>

# Typescript demo


This is a [Next.js](https://nextjs.org/) demonstration of the Identus typescript SDK.

## Getting Started

### Prerequisites

- Node.js LTS
- Optional: [Blockfrost  API key](https://blockfrost.io/)

### Configuration

1. Optionally (if you want to issue dids using [cip-30](https://cips.cardano.org/cip/CIP-30)) Create a `.env.local` file and add your Blockfrost API key:

```bash
NEXT_PUBLIC_BLOCKFROST_API_KEY=<your-blockfrost-api-key>
```

First, run the development server:

```bash
npm i 
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
