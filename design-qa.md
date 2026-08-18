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
