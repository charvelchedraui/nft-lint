# flow/display

**Severity:** see the rule pack. **Network:** not required

## What it checks

MetadataViews.Display name, description, and thumbnail.

## Why it matters

Display is the view wallets show in a list. thumbnail is an HTTPFile {url} or an IPFSFile {cid, path}.

## How to fix

Fill all three. Point thumbnail at ipfs:// or https://.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/flow/display.md
