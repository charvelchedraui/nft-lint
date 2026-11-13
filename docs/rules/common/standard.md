# common/standard

**Severity:** see the rule pack. **Network:** not required

## What it checks

Which metadata standard the document looks like.

## Why it matters

Rules are standard-specific. A Tezos document should not be judged as ERC-721.

## How to fix

Add the fields of a supported standard, or pass `--chain`. Empty objects are not metadata.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/common/standard.md
