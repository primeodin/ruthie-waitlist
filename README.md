# RUTHIE waitlist

Public type-only waitlist for working name **RUTHIE**.

Live: https://primeodin.github.io/ruthie-waitlist/

This repo is static HTML/CSS/JS on GitHub Pages. No Next.js. No Vercel. No secrets.

Copy is locked in the private company OS (`primeodin/ruthie-co` → `brand/waitlist.md`).

## Capture

The form collects **email + ISO timestamp + source** only (utm / ref / referrer, else `direct`). No public count. No name, size, or extra fields.

Storage uses [Web3Forms](https://web3forms.com) (free, no card). The access key is meant to be public in client HTML — it aliases an inbox, it is not a server secret.

1. Create a key at https://web3forms.com (email verify).
2. Paste it into `config.js` as `web3formsKey`.
3. Push to `main`. Pages rebuilds.

Until a key is present, the page is live and the form UI works, but submit will not pretend to save.

## Local

Open `index.html` or serve the folder. No build step.
