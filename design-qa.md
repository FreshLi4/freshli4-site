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
- Fix: added a Wiki-specific mobile one-column hero, changed the tagline to `一页查清所有卡牌。`, and rewrote the supporting description with Chinese-first wording.
- Post-fix evidence: the title is one horizontal line at 390px and still fits at 320px (`scrollWidth` equals `clientWidth`); the index card moves below the copy without squeezing the title.

final result: passed
