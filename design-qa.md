# Mobile investigation visual QA

## Source visual truth

- Source: `/tmp/codex-remote-attachments/019fe6ec-68c4-7b31-b069-0c47c7cb6d44/573D391C-2FB8-4C42-B2BD-F6AF864BC64A/1-照片-1.jpg`
- Source pixels: 588 × 1280, including mobile browser chrome.
- Target state: the homepage hero visual on the mobile viewport.

## Rendered implementation

- Implementation screenshot: `/tmp/freshli4-investigation-home-mobile.png`
- Route: `http://localhost:4173/investigation-delve-boardgame`
- CSS viewport: 390 × 844; captured pixels: 390 × 844; density normalization: 1:1.
- State: page loaded at the top of the homepage; mobile navigation closed.

## Comparison evidence

The source and implementation were reviewed together, with the app-owned visual region compared separately from the source browser chrome. The source showed the black product photo ending early and exposing an oversized beige lower panel plus the `INVESTIGATION STARTS HERE` label. The implementation now fills the visual frame with the supplied photo, removes the beige panel, keeps the anomaly stamp, and hides the small label on mobile. The focused comparison also checked the visual's border, red offset shadow, crop, and transition into the following content.

## Required fidelity surfaces

- Fonts and typography: existing investigation display and JetBrains Mono roles are unchanged; no new copy was introduced.
- Spacing and layout rhythm: mobile visual uses the source image ratio (`1463 / 1003`) so the card ends with the photo instead of an artificial lower panel.
- Colors and visual tokens: existing dark, brass, red, and paper tokens remain unchanged.
- Image quality and asset fidelity: the supplied `3-游戏配件-1.png` asset is rendered as an absolute, full-frame object-fit image; no placeholder or CSS-drawn replacement is used.
- Copy and content: the mobile-only `INVESTIGATION STARTS HERE` label is hidden as requested; desktop retains it.

## Comparison history

1. Finding: the mobile visual exposed an unwanted beige lower panel and an awkward small label.
2. Fix: made the image fill the visual frame, set the mobile frame to the source image ratio, and hid the label below 640px.
3. Post-fix evidence: the 390 × 844 capture shows a full black photo card with no beige lower panel or label; no actionable P0/P1/P2 differences remain.

## Verification

- `npm run typecheck` passed.
- `npm test` passed: Vite build and 3 source tests.
- `git diff --check` passed.
- Desktop browser check: the image fills the existing desktop card and the label remains visible.

## Latest mobile query-button QA

- Source: `/tmp/codex-remote-attachments/019fe6ec-68c4-7b31-b069-0c47c7cb6d44/3420E9B3-4375-4DBD-BA44-E829B2E185C9/1-照片-1.jpg` (588 × 1280, including browser chrome).
- Implementation screenshot: `/tmp/freshli4-investigation-ai-mobile.png` (390 × 844 at a 390 × 844 CSS viewport, 1:1 density).
- Finding: the mobile form stacked the query button below the input and allowed the label to break across lines.
- Fix: restored the two-column form grid at the mobile breakpoint and added `white-space: nowrap` to the query button; the mobile override now preserves the vertical center and left divider.
- Post-fix evidence: the button renders on the same row as the input with computed columns `243.75px 60.25px`, row height `48px`, and computed `white-space: nowrap`.
- Focused comparison: the query button and arrow stay in one line; prompt pills may still wrap independently below it as intended.

## Latest mobile Wiki hero QA

- Source: `/tmp/codex-remote-attachments/019fe6ec-68c4-7b31-b069-0c47c7cb6d44/10C4F263-1995-4374-B38B-388FDD97B767/1-照片-1.jpg` (588 × 1280, including browser chrome).
- Implementation screenshot: `/tmp/freshli4-investigation-wiki-mobile.png` (390 × 844 at a 390 × 844 CSS viewport, 1:1 density).
- Finding: the mobile Wiki hero kept a two-column desktop layout, squeezing the title into a vertical stack; the Chinese tagline also read like a literal translation of “all cards on the same table.”
- Fix: added a Wiki-specific mobile one-column hero, initially changed the tagline to `一页查清所有卡牌。`, and rewrote the supporting description with Chinese-first wording.
- Follow-up evidence: the hero remains one column on mobile, and the title now uses the final requested two-line copy `所有卡牌，` / `一览无遗。`; the index card remains below the copy without squeezing the title.

## Latest rulebook navigation, subpage copy, and Wiki card hierarchy QA

- Reference: the current browser annotations for the rulebook, FAQ, appendix, and Wiki routes.
- Implementation preview: local Browser at 1440 × 900 and 390 × 844 CSS viewports.
- Rulebook: the first decorative `.rules-hero` block is absent; the `CASE INDEX` is sticky in the desktop sidebar and the mobile copy is hidden from the page body and exposed inside the top-bar dropdown.
- Mobile interaction: opening `资料导航` exposes the mobile `CASE INDEX`; scrolling down adds `is-scroll-hidden`, and scrolling up removes it. The dropdown remains usable while open.
- FAQ: all four large decorative group titles were removed while category labels and question lists remain.
- Subpage copy: the Wiki, appendix, and FAQ titles now use the requested Chinese-first copy with an explicit line break after the first phrase. Generic mobile subpage heroes are single-column so the new appendix/FAQ titles do not collapse vertically.
- Wiki investigator cards: the left `调查员` category marker is removed from investigator summaries; the occupation is shown above the investigator name at a larger size. Non-investigator card summaries retain their category marker.
- Verification evidence: desktop `heroCount = 0`, desktop sidebar `position = sticky`, mobile sidebar TOC `display = none`, mobile route TOC `display = grid` when open, and the first investigator summary has no `.wiki-card-index` while its `.wiki-card-role` is visible.


---

# Investigation: Delve annotation QA

## Evidence

- Source visual truth: the user's browser annotations 1–32, compared against the pre-deploy production captures:
  - `/Users/taobe/.codex/visualizations/2026/08/18/investigation-delve-qa/source-production-wiki-738x964.png`
  - `/Users/taobe/.codex/visualizations/2026/08/18/investigation-delve-qa/source-production-wiki-card-detail-738x964.png`
  - `/Users/taobe/.codex/visualizations/2026/08/18/investigation-delve-qa/source-production-appendix-738x964.png`
  - `/Users/taobe/.codex/visualizations/2026/08/18/investigation-delve-qa/source-production-rules-operation-738x964.png`
- Implementation screenshots:
  - `/Users/taobe/.codex/visualizations/2026/08/18/investigation-delve-qa/local-wiki-top-738x964.png`
  - `/Users/taobe/.codex/visualizations/2026/08/18/investigation-delve-qa/local-wiki-card-detail-738x964.png`
  - `/Users/taobe/.codex/visualizations/2026/08/18/investigation-delve-qa/local-appendix-top-738x964.png`
  - `/Users/taobe/.codex/visualizations/2026/08/18/investigation-delve-qa/local-rules-operation-738x964.png`
- Viewport: 738 × 964 CSS px.
- Pixels and density: every source and implementation capture is 738 × 964 pixels at device pixel ratio 1; no density normalization or scaling was needed.
- State: dark theme, English selected; Wiki captured at the top and with `Fall · II` expanded; Appendix captured at the top; Rules captured at `#operation`.

## Comparison evidence

- Full-view comparison: each production/local pair above was opened in one comparison input at the same viewport and state. The existing layout, type, spacing, texture, borders, and responsive containers remain aligned while the requested copy changes are visible.
- Focused-region comparison: the `Fall · II` pair confirms `Effect Text` now precedes metadata, `Deferred Strategy` is used, the generated card-face duplicate is absent, and the empty story placeholder is absent.
- The Rules operation pair confirms the three stage cards change from three columns to one vertical column at 738 px without clipping or overlap.

## Interactions and runtime checks

- Language selection: Wiki, Appendix, and Rules each switch to English with zero CJK characters remaining in visible page text.
- Wiki search: `Path of Chaos` returns exactly one matching card; clearing search restores all 93 cards.
- Wiki filters: Strategy shows 39 cards; All restores 93 cards.
- Card disclosure: `Fall · II` opens and closes normally; its body contains one effect section and no supplemental placeholder document.
- Responsive layout: operation cards share the same x-position and width and have increasing y-positions at 738 px.
- Console errors checked: no application exception surfaced during page loads or tested interactions. The browser host emitted an unrelated Statsig telemetry network warning; it did not originate from this site or affect the rendered pages.

## Comparison history

### Iteration 1

- P1: English mode retained Chinese hero and rules copy. Fixed by adding exact English fragments and card terminology to the PO source.
- P1: card details repeated the generated card face and displayed empty story placeholders. Fixed in the Wiki generator and renderer.
- P2: title-like labels used inconsistent casing, category labels shared one color, and middot spacing was inconsistent. Fixed in translation sources and category CSS tokens.
- P2: the operation stages remained three columns at the annotated narrow viewport. Fixed at the existing `max-width: 980px` breakpoint.
- Post-fix evidence: the first implementation screenshot set listed above.

### Iteration 2

- P1: browser verification found nine mixed-language Rules fragments and one Appendix fragment still visible. Added full-fragment translations; all three English pages now report zero CJK characters.
- P2: card metadata still preceded the effect text and several detail labels remained lowercase. Reordered the renderer and normalized the English labels.
- Post-fix evidence: `local-wiki-card-detail-738x964.png`, `local-appendix-top-738x964.png`, and `local-rules-operation-738x964.png`.

## Findings

- No actionable P0, P1, or P2 visual findings remain.
- Residual test gap: browser verification covered the annotated 738 × 964 state and the existing automated suite; it did not exhaustively inspect every possible viewport width.

final result: passed

---

# Design QA — Stacked Card Names

- Source visual truth: `/var/folders/x1/nj8gw6sj3tz36zt026sy8h2m0000gn/T/codex-clipboard-02790674-2d44-47c2-b14d-ba2a2307433c.png`
- Implementation screenshot: `/tmp/freshli4-card-name-layout-qa-20260825/implementation-strategy-stacked-2090x1034.png`
- Focused implementation screenshot: `/tmp/freshli4-card-name-layout-qa-20260825/implementation-strategy-stacked-viewport.png`
- Combined comparison: `/tmp/freshli4-card-name-layout-qa-20260825/design-qa-comparison.png`
- Source pixels: 2090 × 1034; supplied as a focused card-grid crop, so its CSS viewport and density are not known.
- Implementation comparison viewport: 2090 × 1034 CSS px at device scale factor 1, captured at the first Strategy card.
- Interaction viewport: 1280 × 720 CSS px. Responsive checks also covered 738 × 964 and 600 × 900 CSS px.
- State: Chinese Card Wiki with all categories visible and all card disclosures closed.

## Full-view comparison evidence

The combined comparison places the supplied horizontal Strategy-card layout and the implemented stacked layout in one visual input. The card grid, border treatment, title type, edition label, and expand control remain aligned with the existing Wiki design. The intentional difference is that the category now occupies the first line and the card name occupies the second line, matching Investigator cards.

## Focused region comparison evidence

The focused viewport capture shows consecutive Strategy cards in both columns. Every visible card uses the same two-line heading structure, while the edition remains right-aligned and the expand control remains in the final column.

## Required fidelity surfaces

- Fonts and typography: Existing category and card-name type roles are retained; only their placement changed.
- Spacing and layout rhythm: The shared heading wrapper supplies the same vertical gap and alignment for Investigator, Strategy, Environment, Intelligence, and Auxiliary cards.
- Colors and visual tokens: Investigator and Intelligence remain red, Strategy remains blue, Environment remains purple, and Auxiliary remains gray.
- Image quality and asset fidelity: This scoped change adds or modifies no visual assets.
- Copy and content: Category names, card names, editions, and controls are unchanged.

## Comparison history

1. Initial source: non-Investigator categories and card names occupied separate horizontal grid columns.
2. Implementation: all categories now render through the existing Investigator-style heading wrapper, with category above card name.
3. Responsive verification: at 738 px all five categories remain stacked with no page overflow; at the existing 640 px breakpoint the edition is hidden and the summary collapses to the heading-plus-control grid without overflow.

## Findings

No actionable P0, P1, or P2 visual differences remain for the requested layout change.

## Interaction and regression checks

- Strategy card disclosure opens and closes correctly; its expanded visual content still renders.
- Desktop and narrow layouts preserve the category color, edition, and expand control behavior.
- Browser console: no error- or warning-level entries during the verified page loads and interaction.
- Automated site tests: 14 passed.
- TypeScript typecheck: passed.
- Production build: passed.

## Follow-up polish

No P3 follow-up is required for this scoped change.

final result: passed

---

# Design QA — Card Base Information Placement

- Source visual truth: `/var/folders/x1/nj8gw6sj3tz36zt026sy8h2m0000gn/T/codex-clipboard-c0ac5daa-8fa2-4896-a8b3-55800f805a2b.png`
- Implementation screenshot: `/tmp/freshli4-card-meta-qa-20260821/implementation-card-meta-top-desktop-focused.png`
- Combined comparison: `/tmp/freshli4-card-meta-qa-20260821/design-qa-comparison.png`
- Source pixels: 1034 × 1060; provided as an element crop, with no CSS viewport or density metadata.
- Implementation browser viewport: 1440 × 1200 CSS px at device scale factor 1.
- Implementation focused crop: 635 × 708 px.
- Comparison normalization: source scaled proportionally to 708 px high; implementation retained at 635 × 708 px; both are top-aligned in the combined image.
- State: Chinese Card Wiki, search query `约翰`, investigator card “约翰” expanded.

## Full-view comparison evidence

The combined comparison shows the same card and content state before and after the requested hierarchy change. The source places the five base-information fields after both skill sections. The implementation places the same fields immediately below the card summary, ahead of the skill text, inside a brass-accented callout.

The source is an element crop rather than a full browser capture, so exact breakpoint-level pixel equivalence is not available. The comparison is limited to the requested information hierarchy and the card-detail visual language rather than treating crop-dependent type scale as a mismatch.

## Focused region comparison evidence

The implementation crop focuses on the summary, base-information callout, and start of the awake-skill section. This focus is necessary because the requested change is entirely within that transition. It confirms:

- all five original fields remain present and in their original order;
- the callout uses the existing brass left rule and translucent panel treatment;
- the awake and madness text styling remains unchanged;
- the base-information block is no longer repeated after the skill text.

## Required fidelity surfaces

- Fonts and typography: Existing card title, metadata label/value, and canonical skill-text font roles are unchanged.
- Spacing and layout rhythm: The metadata callout has consistent internal padding and a clear gap before the first skill divider. No card-body horizontal overflow remains.
- Colors and visual tokens: The block reuses `--rules-brass`, `--rules-ink`, and the existing translucent callout background rather than introducing a new palette.
- Image quality and asset fidelity: No raster, logo, illustration, or icon assets are added or changed.
- Copy and content: Card data and skill text are unchanged; only DOM order and containment changed.

## Comparison history

1. Initial pass moved metadata above the skills and added the callout treatment.
2. Narrow-width inspection identified that long metadata values needed an explicit shrink/wrap guard. The metadata items received zero minimum width, a 100% maximum width, and `overflow-wrap: anywhere`.
3. Post-fix narrow-width evidence measured the callout at `clientWidth = 301` and `scrollWidth = 301`; every metadata item remained within the callout. Investigator and strategy cards both rendered base information before their effect text.

## Findings

No actionable P0, P1, or P2 differences remain for the requested change.

## Interaction and regression checks

- Search and expand interaction tested for investigator “约翰”.
- Search and expand interaction tested for strategy “沉沦 · II”.
- Narrow and desktop card layouts inspected.
- Browser console: no warnings or errors.
- Automated site tests: 13 passed.
- TypeScript typecheck: passed.

## Follow-up polish

No P3 follow-up is required for this scoped change.

final result: passed

---

# Design QA — Investigation Home Navigation and English Hero

- Source visual truth:
  - `/tmp/freshli4-investigation-home-qa-20260828/source-production-zh-775x863.png`
  - `/tmp/freshli4-investigation-home-qa-20260828/source-production-en-775x863.png`
- Implementation screenshots:
  - `/tmp/freshli4-investigation-home-qa-20260828/implementation-local-zh-775x863.png`
  - `/tmp/freshli4-investigation-home-qa-20260828/implementation-local-en-775x863.png`
- Combined comparison: `/tmp/freshli4-investigation-home-qa-20260828/design-qa-comparison.png`
- Browser viewport override: 775 × 863 CSS px at device pixel ratio 1. Browser chrome and native scrollbars leave a 760 × 846 px captured content bitmap for every source and implementation screenshot.
- State: page top in Chinese for navigation verification and English for hero-copy verification.

## Full-view and focused comparison evidence

The four-panel comparison places production and local captures side by side at the same viewport and language state. The Chinese pair shows that the extra scrollbar inside the navigation row is removed while the route links, language control, header divider, hero position, and page scrollbar remain unchanged. The English pair shows the single intentional hero-copy change from `go deep` to `Delve` without changing the hero hierarchy or surrounding layout.

## Required fidelity surfaces

- Fonts and typography: Existing display and navigation font roles, sizes, weights, and colors are unchanged.
- Spacing and layout rhythm: Header dimensions, wrapping, link gaps, and hero spacing remain aligned with production.
- Responsive behavior: The 641–980 px route-nav range keeps horizontal overflow available but suppresses the accidental one-pixel vertical overflow. At 600 px the existing compact navigation still uses visible overflow and its dropdown opens normally.
- Colors and visual tokens: No palette, border, shadow, or texture tokens changed.
- Images and assets: No logo, hero image, or card asset changed.
- Copy and content: Only the English fragment for `深入` changed, to the requested standard translation `Delve`.

## Comparison history

1. Production at 775 px computed `.rules-route-nav` as `overflow-x: auto; overflow-y: auto` with `clientHeight = 35` and `scrollHeight = 36`, producing the unwanted inner vertical scrollbar.
2. The intermediate breakpoint now sets `overflow-y: hidden`; local verification retains `overflow-x: auto`, removes the visible inner scrollbar, and keeps document width equal to scroll width.
3. Production English rendered the hero emphasis as `go deep`; local English renders exactly `Delve`.

## Interaction and regression checks

- Chinese and English language selection both update the visible home page correctly.
- All route links remain visible at 775 px; the document has no horizontal overflow.
- At 600 px, the navigation toggle is present, opens the route panel, and preserves `overflow: visible` from the existing mobile breakpoint.
- Browser console: only Vite connection debug entries; no warning- or error-level application entries.
- Automated site tests: 14 passed.
- TypeScript typecheck: passed.
- Production build and search index generation: passed.

## Findings

No actionable P0, P1, or P2 visual findings remain for the two annotated issues.

final result: passed

---

# Design QA — Investigator Ability Blocks and Metadata Grid

- Source visual truth: `/tmp/freshli4-investigation-card-blocks-qa-20260828/source-production-philip-expanded-1237x863.png`
- Implementation screenshots:
  - `/tmp/freshli4-investigation-card-blocks-qa-20260828/implementation-local-philip-expanded-1237x863.png`
  - `/tmp/freshli4-investigation-card-blocks-qa-20260828/implementation-local-philip-madness-1237x863.png`
  - `/tmp/freshli4-investigation-card-blocks-qa-20260828/implementation-local-philip-blocks-600x900.png`
  - `/tmp/freshli4-investigation-card-blocks-qa-20260828/implementation-local-philip-blocks-390x844.png`
- Combined comparison: `/tmp/freshli4-investigation-card-blocks-qa-20260828/design-qa-comparison.png`
- Browser viewport override: 1237 × 863 CSS px for the production/local comparison; responsive checks at 600 × 900 and 390 × 844 CSS px.
- Captured bitmaps: production 1237 × 863 px; local 1222 × 853 px after browser scrollbar/chrome subtraction. The combined comparison preserves both images proportionally and top-aligns the local capture without stretching.
- State: English Card Wiki, Philip Chandler expanded, front face visible.

## Full-view comparison evidence

The combined comparison places production and local captures side by side in the same viewport and expanded-card state. The card grid, disclosure heading, illustration, type hierarchy, palette, and two-column detail structure remain aligned. The intentional changes are limited to the metadata arrangement and the internal treatment of ability copy.

## Focused region comparison evidence

The implementation detail capture confirms that the former inline awake copy is now three bordered blocks with separate `3`, `2`, and `1` mechanism badges. The madness section contains exactly four blocks: the `Forbidden Knowledge` heading, its body, the `Crazy Spread · Old Detective` heading, and its body. No leading level marker remains duplicated inside the awake paragraphs.

## Required fidelity surfaces

- Fonts and typography: Existing card-heading, metadata, ability-label, and body-copy font roles remain unchanged; the level badge adds a scoped monospace mechanism accent.
- Spacing and layout rhythm: The five metadata fields form a 3-item first row and 2-item second row. Ability blocks use consistent gaps, inset borders, and paragraph padding.
- Responsive behavior: The existing one-column card-detail breakpoint is preserved. At 600 px and 390 px the badges remain aligned with their paragraphs, all four madness blocks remain readable, and no content is clipped horizontally.
- Colors and visual tokens: Awake blocks reuse the neutral card border and brass accent; madness title blocks reuse the existing red madness accent.
- Images and assets: The investigator front/back artwork, tilt, glow, and flip interaction are unchanged.
- Copy and content: `Forbidden Knowledge` replaces `Taboo knowledge`; `Forbidden Truth` remains the canonical translation for `禁忌真相`. All original ability bodies remain present.

## Comparison history

1. Production rendered all three awake abilities as one paragraph with quoted number prefixes and both madness titles inline with their bodies.
2. The implementation parses only explicit line-leading level markers, removes them from paragraph copy, and renders them as dedicated badges. Unnumbered ability lines remain ordinary blocks.
3. Madness bracket headings are separated from their following body lines and localized after every language switch, avoiding fragment-level translation breakage.
4. The metadata callout changed from an uneven inline flow to an explicit six-column grid: the first three fields span two columns each and the last two span three columns each.

## Findings

No actionable P0, P1, or P2 visual findings remain for the annotated card-detail changes.

## Interaction and regression checks

- Philip card disclosure opens, closes, and reopens correctly.
- Card flip toggles `aria-pressed` and the existing `is-flipped` visual state, then returns to the front face.
- Chinese and English language switching preserves three awake blocks and four madness blocks; the English heading returns exactly `Forbidden Knowledge`.
- Browser console: Vite connection/debug entries only; no warning- or error-level application entries.
- Automated site tests: 14 passed.
- TypeScript typecheck: passed.
- Production build and search index generation: passed as part of the test run.

## Follow-up polish

No P3 follow-up is required for this scoped change.

final result: passed
