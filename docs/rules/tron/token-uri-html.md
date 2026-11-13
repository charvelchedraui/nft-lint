# tron/token-uri-html

**Severity:** see the rule pack. **Network:** required

## What it checks

Whether tokenURI bytes are HTML.

## Why it matters

A gateway or a dead host often returns an HTML error page with status 200. Wallets then show a blank token.

## How to fix

Serve a JSON object with name, description, and image. This check runs only when the network is enabled.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/tron/token-uri-html.md
