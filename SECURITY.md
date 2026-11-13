# Security

## Reporting

Please use [private vulnerability reporting](https://github.com/charvelchedraui/nft-lint/security/advisories/new) on `charvelchedraui/nft-lint`. Do not open a public issue for a vulnerability, and do not include exploit details in a pull request until a fix is agreed.

## What this tool is

NFT Lint reads metadata you point it at and, when you ask it to, calls the RPC and the URL you configured. It does not ship a wallet, a private key, or a hosted API.

- Do not put API keys, private keys, or seed phrases in issues, fixtures, or config files that you commit.
- `--rpc` and `NFT_LINT_RPC_*` are the right place for an endpoint that needs a key. Those values stay in your environment.
- The web page runs in your browser. It does not upload the JSON to a project server. A URI you submit is fetched from that host, which can see your address.

## Supported versions

Security fixes apply to the current `main` branch until the first tagged release.
