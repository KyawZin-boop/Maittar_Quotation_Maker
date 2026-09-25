# Maittar Quotation Maker

A mobile-first, installable quotation maker for Maittar Engineering Air-Con. It stores data locally on the device and creates an A4 PDF matching the supplied quotation format.

## Run locally

```bash
pnpm install
pnpm dev
```

Open the local URL on a phone connected to the same network, or use the browser's responsive device mode.

## Production build

```bash
pnpm build
pnpm preview
```

The `dist` folder can be deployed to Vercel, Netlify, or Cloudflare Pages.

## Data and privacy

Company details and the current quotation are saved in the browser's local storage. There is no account, server, analytics, or external database. Clearing browser site data will remove the saved draft.
