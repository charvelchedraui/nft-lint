# sui/kiosk

**Severity:** see the rule pack. **Network:** not required

## What it checks

A Kiosk id or ObjectOwner.

## Why it matters

An object owned by another object is usually in a Kiosk. A normal transfer fails until it leaves the Kiosk. The id is a Sui address.

## How to fix

Use 0x and 1 to 64 hex characters. Transfer through the Kiosk that owns the object.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/sui/kiosk.md
