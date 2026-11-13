# sui/templates

**Severity:** see the rule pack. **Network:** not required

## What it checks

Unsubstituted {field} templates.

## Why it matters

Display values are format strings. A client replaces {field} from the object. A leftover brace means that field was missing. Doubled braces are literals and are ignored.

## How to fix

Render the display before publishing, or fix the object field the template names.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/sui/templates.md
