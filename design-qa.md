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

final result: passed
