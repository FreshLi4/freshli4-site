# Ball Maze website assets

Updated 2026-10-08. Source game assets are read-only; the website contains derived, portable assets.

## Real gameplay media

`visual-content/latest/` uses September 2026 recordings from
`/Users/taobe/Projects/Gitea/ball-maze/in-game-asset/tutorial/`:

| Website asset | Recording | Poster frame |
| --- | --- | --- |
| city | 迷宫滚转-back.mp4 | 1.5 s |
| mine | 矿车.mp4 | 4 s |
| island | 海洋.mp4 | 3 s |
| valley | 风.mp4 | 1 s |
| black-hole | 黑洞.mp4 | 2 s |
| play | 迷宫俯仰-back.mp4 | 2 s |
| editor | 关卡编辑器-back.mp4 | 8 s |
| records | 完成迷宫挑战-back.mp4 | 6 s |
| solo | 普通球-back.mp4 | 2 s |
| tracks | 特殊轨道.mp4 | 3 s |
| abilities | 小球能力.mp4 | 3 s |

WebP frames are at most 1280 px wide. The city/play clips are 960 px wide; the editor/records clips are 1280 px wide for readable game UI. All are silent H.264 with native playback controls. Videos pause outside the viewport and respect reduced motion. Home-page hero/track/level JPEGs also use these new recordings.

The Ball Maze hero reuses the home page's media-slide transition and shared carousel controller. It pages through the full editor → special rails → ball abilities recordings, advancing at each video's actual end and wrapping back to the editor. Numbered topic buttons permit direct paging; automatic paging can be paused. Hidden slides are inert and paused, and the active recording pauses while offscreen or when the document is hidden. Reduced-motion users start with automatic playback disabled. The video outline remains the same as the rest of the page; topic controls sit outside it without a boxed caption, shadow or extra footer envelope. The desktop columns have an explicit responsive gap, the logo has no negative left margin, and mobile text/video stack without overlap.

The studio home page's Ball Maze feature now uses that same hero headline, introduction, logo and three tutorial videos. `src/ball-maze-hero.ts` is the shared source for all three languages and video-slide markup, so the two pages cannot silently diverge. The home feature keeps its existing project navigation, status, detail-page link and Steam wishlist link; other games retain their existing media. Ball Maze alone uses the landing hero's fine-outline 4:3 player instead of the old still-image/tilted-shadow frame. Topic paging and the automatic-play toggle are localized and driven by the same carousel controller on both pages.

The editor uses the complete 14-second recording, including building and playtesting. The records clip uses 4.4–6.05 seconds, excludes the tutorial's closing fade, and holds the recorded score screen for five extra seconds. Its poster is the actual game's record/best-record screen, not generic rolling gameplay. This footage is **personal score/best-record UI, not an online player-ranking list**. No names, ranks, or game UI are fabricated. `recordings.json` and `build/prepare-ball-maze-feature-media.py` preserve the source/trim/poster details. Both displays use `object-fit: contain` so game menus and results are not cropped.

The solo mode uses the complete ordinary-ball gameplay recording. No verified multiplayer/co-op capture was found among the supplied tutorial recordings or the existing PV. The co-op card explicitly shows a pending-recording message rather than relabeling solo footage as multiplayer; `recordings.json` also records that missing source.

Six completed world cards are published in the local page based on the user's completion update. **Darkroom has no matching real gameplay image in the supplied/local media set.** Its numbered graphic is deliberately not presented as a gameplay screenshot; replace it when the recording is provided.

### Hover-only world previews

The first five world cards use five silent looping videos, each assembled solely from that world's mechanism/special-rail tutorial recordings:

| World | Source tutorials |
| --- | --- |
| City | 自动电梯.mp4, 摩天轮.mp4 |
| Mine | 矿车.mp4, 水龙头.mp4, 闸门.mp4 |
| Island | 海洋.mp4, 浮木.mp4, 间歇泉.mp4 |
| Valley | 风.mp4, 固定轨道.mp4, 吊桥.mp4 |
| Black hole | 黑洞.mp4, 传送门.mp4, 磁力轨道.mp4 |

`build/prepare-ball-maze-world-media.py` creates the five `world-*.mp4` files and matching recorded-frame posters at 960×720, with exact sources and trim intervals in `world-recordings.json`. Source export fades are trimmed; the wind segment starts at 5.6 seconds, after the failed first attempt's menu, to show its later actual gameplay. No game footage/UI is fabricated. Original tutorial files and the other page's media are unchanged.

World cards do not use the page's viewport-autoplay observer. They preload no video, display their recorded poster while idle, and loop only on mouse/pen hover (or the equivalent keyboard focus). Leaving pauses at the current position. Offscreen cards and hidden pages pause as well; reduced motion leaves them static. Touch does not accidentally trigger a hover preview. The sixth Darkroom card remains the existing numbered graphic until genuine footage is supplied.

## Continuous section colours

The landing page uses the studio home's `.78s var(--ease)` body-colour transition rather than separate opaque section backgrounds. `src/ball-maze-sections.ts` chooses the section containing the viewport centre and synchronizes its palette, accessible side navigation and browser theme tint. Native scrolling remains free (no snapping, wheel interception or slide-style page replacement), including through the much taller twenty-ball gallery. Layout changes, restored scroll positions and hash navigation remeasure the active section.

Headings, descriptions, fine rules and navigation adapt their ink/accent to the shared background; enclosed world, ball and mode cards retain their own readable palettes. Hero/final artwork fades to transparency at section edges, including the footer, so it cannot reintroduce a hard horizontal seam. The initial/deep-linked palette is painted before easing is enabled, and reduced-motion preferences make colour changes immediate. Video playback and model pointer/drag interactions use their existing independent controllers.

## Twenty real models

The authoritative list is the game's `DT_BallInfos` table, not the old website's sample list. `models/manifest.json` records the source objects and vertex counts for all 20 GLBs. Models embed their textures and appear in 20 independent, flat grid canvases; there is no selected-ball/shared-preview interface.

Each visible ball turns toward the page pointer relative to its own canvas center. Entering a canvas pauses that ball's tracking, and left-button dragging rotates it manually. Leaving resumes from the current rendered angle, eases toward the pointer along the shortest arc, and preserves the viewing distance rather than resetting the view. Other visible balls continue tracking. Keyboard arrow controls and touch dragging are supported; wheel scrolling is not trapped by model zoom. Reduced-motion preferences disable automatic tracking but retain manual controls. The renderer is shared, models load lazily, offscreen canvases do not receive follow updates, and settled tracking stops requesting animation frames.

Sources:

- Blender: `/Volumes/团队文件-Workspace/Taobe/GameDev_on_NAS/BallMaze/Asset/Model/Ball.blend`
- Original OBJ meshes: the same model directory's `Mesh/20250928/` (golf and hamster).
- Current UE project: `/Users/taobe/Projects/Perforce/ball-maze/ue-5.8/BallMaze/BallMaze.uproject` (glass, slime and twin static meshes, source BaseColor textures, and material parameters).

Run `build/export-ball-maze-models.py` in Blender 4.5 with source meshes, exported UE mesh parts and material parameter JSON supplied through its documented arguments. The script creates a separate scene and never saves the source `.blend`. `--only` exports a specified subset and merges its manifest entries without losing other models. Poster WebPs under `public/ball-maze/posters/` are rendered from the same models.

The .blend's geometry retains its matching Color texture/vertex-color node, including the 2026 basketball, tennis and hamster atlases; older UE atlas layouts must not be swapped onto these meshes. Imported OBJ meshes likewise use their accompanying source Color PNG. The manifest records these texture sources. A derived source-image copy extends neighboring palette colors into transparent black atlas gutters while preserving every visible source texel. Textured surfaces then bake that diffuse Color onto a separate 512×512 web UV atlas with eight-pixel edge padding, without changing geometry or the source files. The final baked atlas extends color through its remaining uncovered pixels and removes raster-coverage alpha after recovering straight edge colors; glass transparency stays on the material. This avoids black/white sampling seams in the original concave, tightly packed voxel atlas islands. Atlases use nearest sampling without mipmaps and clamp at the image boundary.

Opaque surfaces use nonmetallic, high-roughness, low-specular materials. The shared neutral environment, neutral tone mapping, exposure 1 and softer/lighter contact shadows preserve voxel shape while avoiding the previous glossy PBR look. Glass variants retain restrained translucency. Unreal voxel/Niagara shaders cannot run in a browser; this is a stylized portable material translation, not pixel-identical Unreal shading.

Each canvas frames the model at 140% of the ideal camera distance, leaving room for the existing 0.25-intensity, fully soft contact shadow to fade before the viewport edge. The maximum orbit distance allows that framing instead of clamping it to the library's mesh-only default. This framing distance is retained during pointer following and manual rotation; shadows are not hidden or masked to conceal cropping.

The four rocket attachments move together so their vertical center sits at 25% of the sphere's height measured from its bottom. The real hamster mesh is centered inside its shell; alpha-composited 20% glass lets the internal animal render visibly instead of showing only refracted environment lighting. Clock/rewind glass alpha retains the current ChaosBake 0.15 override. All source layout offsets are baked into clean centered export geometry. Runtime abilities, fire effects, physics and destruction are not simulated in this model showcase.

## Verification boundaries

`npm run typecheck` and `npm test` validate the page/catalog, all 20 embedded model files, matching atlases, matte material/sampler settings, the measured rocket attachment height, hamster geometry inside the transparent shell, canvas hit testing, pointer direction, manual pause/resume, continuous angles and shortest-arc convergence. Browser checks must also exercise all 20 grid model loads, independent pointer following, manual dragging and leave/resume, language switching, floating navigation and the 390 px layout. This is website/local preview verification, not game-build QA or a production deployment.
