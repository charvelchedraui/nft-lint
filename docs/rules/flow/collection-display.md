# flow/collection-display

**Severity:** see the rule pack. **Network:** not required

## What it checks

NFTCollectionDisplay name, description, squareImage, and bannerImage.

## Why it matters

Collection pages use the square image and the banner. Each image is a Media with a file and a mediaType.

## How to fix

Set both images. Use HTTPFile or IPFSFile inside file.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/flow/collection-display.md
