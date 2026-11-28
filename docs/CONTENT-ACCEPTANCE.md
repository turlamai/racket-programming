# Content acceptance and publication handoff

## Scope

The editorial revision covers all 60 chapters and six appendices. The main teaching route uses Glaze, Rivet and Loom, with Taskly as the integrated product case. The 48 retained SVG figures use the existing book palette. This branch is a content-freeze candidate, not a claim of a fully validated release.

## Verified baseline

GitHub Actions run [46141784347](https://github.com/turlamai/racket-programming/actions/runs/46141784347) verified the chapter counts, README title alignment, internal chapter links, Markdown image references, 438 scanned Racket blocks (one custom reader block skipped), 26 executable textbook example groups, Web and FFI smoke tests, TypeScript checking and all 80 static pages. Three unreferenced legacy PNGs were removed subsequently; the final revision requires a fresh check.

Run these checks from the repository root:

```sh
npm run check:content
npm run check:racket
node scripts/check-book-examples.js
racket tests/web-smoke.rkt
racket tests/ffi-smoke.rkt
```

The runtime harness extracts selected teaching examples from the source rather than maintaining separate copies. It does not execute every illustrative or interactive snippet.

## Outstanding acceptance

- Real-window verification of the native GUI and Glaze/Rivet tutorials on supported platforms.
- Live Loom tutorial verification against the referenced library revision, including its Taskboard.
- Taskly source and distribution verification against a recorded revision.
- Render all figures, check Chinese glyphs, clipping and legibility on desktop and mobile, and confirm accessible image descriptions.
- Recheck external links and library APIs when selecting the publication baseline.

## Pollen migration boundary

Preserve the chapter order, headings, examples, semantic figure descriptions, source citations and exercise answers. Port the content and example checks to the new publishing workflow and retain a mapping of old chapter URLs. Share typography, colors, figure conventions and accessible components across both books. Do not treat visual acceptance as complete until the new renderer is tested.

## Release gate

The existing Next.js dependency audit reported a moderate-severity vulnerability. The audit remains mandatory; do not deploy or merge through a release gate that requires a passing audit until the affected dependency is remediated or the replacement publication pipeline is verified. Content freeze does not waive this requirement.

The final content review should focus on demonstrable defects, not indefinite expansion.
