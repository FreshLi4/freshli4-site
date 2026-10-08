import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { inflateSync } from "node:zlib";
import { transpileModule, ModuleKind, ScriptTarget } from "typescript";

const root = new URL("../", import.meta.url);
const ids = ["normal", "attraction", "repulsion", "phase", "basketball", "hamster", "golf", "shuttlecock", "tennis", "time-stop", "bonfire", "rocket", "rewind", "yoyo", "paint", "slime", "bomb", "glass", "curling", "twins"];
const motionSource = await readFile(new URL("src/ball-maze-motion.ts", root), "utf8");
const motionCode = transpileModule(motionSource, { compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ES2022 } }).outputText;
const { advanceBallMotion, isPointerInCanvas, pointerLookTarget, setBallMotionMode } = await import(`data:text/javascript;base64,${Buffer.from(motionCode).toString("base64")}`);

const readModel = async (id) => {
  const bytes = await readFile(new URL(`asset/ball-maze/models/${id}.glb`, root));
  const jsonLength = bytes.readUInt32LE(12);
  return { json: JSON.parse(bytes.toString("utf8", 20, 20 + jsonLength)), binary: bytes.subarray(28 + jsonLength) };
};
const pngPixels = (png) => {
  assert.equal(png.readUInt32BE(0), 0x89504e47);
  assert.equal(png[24], 8, "8-bit web atlas");
  assert.equal(png[28], 0, "non-interlaced web atlas");
  const channels = { 2: 3, 6: 4 }[png[25]];
  assert.ok(channels, "RGB or RGBA web atlas");
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20), chunks = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    if (png.toString("ascii", offset + 4, offset + 8) === "IDAT") chunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const bytes = inflateSync(Buffer.concat(chunks)), stride = width * channels;
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = bytes[y * (stride + 1)];
    assert.ok(filter <= 4);
    for (let x = 0; x < stride; x++) {
      const offset = y * stride + x;
      const left = x >= channels ? pixels[offset - channels] : 0;
      const above = y ? pixels[offset - stride] : 0;
      const corner = y && x >= channels ? pixels[offset - stride - channels] : 0;
      const p = left + above - corner;
      const paeth = Math.abs(p - left) <= Math.abs(p - above) && Math.abs(p - left) <= Math.abs(p - corner) ? left : Math.abs(p - above) <= Math.abs(p - corner) ? above : corner;
      pixels[offset] = (bytes[y * (stride + 1) + 1 + x] + [0, left, above, Math.floor((left + above) / 2), paeth][filter]) & 255;
    }
  }
  return { pixels, channels };
};
const geometryBounds = (model, node) => {
  assert.ok(!node.translation && !node.rotation && !node.scale, "export bakes source layout offsets into centered geometry");
  const accessors = model.json.meshes[node.mesh].primitives.map((primitive) => model.json.accessors[primitive.attributes.POSITION]);
  return {
    min: [0, 1, 2].map((axis) => Math.min(...accessors.map((accessor) => accessor.min[axis]))),
    max: [0, 1, 2].map((axis) => Math.max(...accessors.map((accessor) => accessor.max[axis]))),
  };
};

test("all twenty balls use nonempty, self-contained game models and matching posters", async () => {
  const files = await readdir(new URL("asset/ball-maze/models/", root));
  assert.equal(files.filter((file) => file.endsWith(".glb")).length, 20);
  const manifest = JSON.parse(await readFile(new URL("asset/ball-maze/models/manifest.json", root), "utf8"));
  assert.equal(manifest.length, 20);
  for (const id of ids) {
    const buffer = await readFile(new URL(`asset/ball-maze/models/${id}.glb`, root));
    assert.equal(buffer.toString("ascii", 0, 4), "glTF", id);
    assert.equal(buffer.readUInt32LE(4), 2, id);
    assert.equal(buffer.readUInt32LE(8), buffer.length, id);
    const jsonLength = buffer.readUInt32LE(12);
    const model = JSON.parse(buffer.toString("utf8", 20, 20 + jsonLength));
    assert.ok(model.meshes?.length, `${id}: no placeholder scenes`);
    assert.ok(model.meshes.every((mesh) => mesh.primitives.some((primitive) => primitive.attributes.POSITION !== undefined)), id);
    assert.ok(model.buffers.every((buffer) => !buffer.uri), `${id}: binary must be embedded`);
    assert.ok((model.images ?? []).every((image) => image.bufferView !== undefined), `${id}: textures must be embedded`);
    assert.ok(manifest.find((entry) => entry.id === id)?.vertices > 100, id);
    await access(new URL(`public/ball-maze/posters/${id}.webp`, root));
  }
});

test("basketball, tennis and hamster preserve texture atlases paired with their actual source meshes", async () => {
  for (const [id, texture] of [["basketball", "BasketBall_Color"], ["tennis", "TennisBall_Color"], ["hamster", "HamsterBall_Glass_Color_001"]]) {
    const { json } = await readModel(id);
    assert.ok(json.images.some((image) => image.name === texture + "_WebAtlas"), `${id}: padded web atlas baked from the matched .blend Color`);
    assert.doesNotMatch(JSON.stringify(json.images), /BasketBall_A_Color|T_TennisBall_01|T_HamsterBall_Shell_Color/);
  }
});

test("white voxel models use padded bake UVs instead of sampling source atlas seams", async () => {
  for (const id of ["basketball", "tennis", "hamster", "rocket", "curling", "golf", "shuttlecock"]) {
    const model = await readModel(id);
    for (const mesh of model.json.meshes) {
      for (const primitive of mesh.primitives) {
        const texture = model.json.materials[primitive.material].pbrMetallicRoughness.baseColorTexture;
        assert.ok(texture.texCoord > 0, `${id}: use a dedicated padded web UV layer`);
        assert.ok(primitive.attributes[`TEXCOORD_${texture.texCoord}`] !== undefined, id);
        const image = model.json.images[model.json.textures[texture.index].source];
        const view = model.json.bufferViews[image.bufferView];
        const png = model.binary.subarray(view.byteOffset, view.byteOffset + view.byteLength);
        assert.ok(image.name.endsWith("_WebAtlas"), id);
        assert.equal(png.readUInt32BE(16), 512, id);
        assert.equal(png.readUInt32BE(20), 512, id);
        const { pixels, channels } = pngPixels(png);
        if (channels === 4) {
          for (let offset = 3; offset < pixels.length; offset += 4) {
            assert.equal(pixels[offset], 255, `${id}: material alpha, not transparent black atlas gaps or dark coverage edges`);
          }
        }
      }
    }
  }
  const exporter = await readFile(new URL("build/export-ball-maze-models.py", root), "utf8");
  assert.match(exporter, /bpy\.ops\.object\.bake\(type='DIFFUSE', pass_filter=\{'COLOR'\}, margin=8/);
  assert.match(exporter, /texture\.image = padded_source_color\(texture\.image\)/, "transparent black source gutters must be filled before the color bake");
  assert.match(exporter, /if pixels\[index \* 4 \+ 3\] == 0:/, "preserve every visible source palette texel");
  assert.match(exporter, /baked\.pixels\[:\] = palette_gutter_pixels\(baked, coverage_alpha=True\)/, "bake coverage must not create dark voxel edges");
});

test("all twenty models use matte diffuse materials and bleed-free voxel palette sampling", async () => {
  for (const id of ids) {
    const { json } = await readModel(id);
    for (const material of json.materials) {
      const pbr = material.pbrMetallicRoughness;
      const transparent = material.alphaMode === "BLEND" || material.extensions?.KHR_materials_transmission?.transmissionFactor > 0;
      assert.equal(pbr.metallicFactor, 0, `${id}: no metallic glare`);
      assert.ok(pbr.roughnessFactor >= (transparent ? .65 : .9), `${id}: matte surface`);
      assert.ok(material.extensions.KHR_materials_specular.specularFactor <= .11, `${id}: restrained specular light`);
      assert.ok(!pbr.metallicRoughnessTexture && !material.normalTexture && !material.emissiveTexture, `${id}: no stale PBR atlases`);
    }
    for (const sampler of json.samplers ?? []) {
      assert.equal(sampler.magFilter, 9728, id);
      assert.equal(sampler.minFilter, 9728, `${id}: no palette mipmap bleeding`);
      assert.equal(sampler.wrapS, 33071, id);
      assert.equal(sampler.wrapT, 33071, id);
    }
  }
  const page = await readFile(new URL("src/ball-maze.ts", root), "utf8");
  assert.match(page, /shadow-intensity="0\.25" shadow-softness="1" exposure="1" tone-mapping="neutral"/);
});

test("rocket attachments are centered at the lower quarter of the ball body", async () => {
  const model = await readModel("rocket");
  const body = geometryBounds(model, model.json.nodes.find((node) => node.name.startsWith("RocketBall_Ball")));
  const rockets = geometryBounds(model, model.json.nodes.find((node) => node.name.startsWith("RocketBall_Rocket")));
  const anchor = (rockets.min[1] + rockets.max[1]) / 2;
  const fraction = (anchor - body.min[1]) / (body.max[1] - body.min[1]);
  assert.ok(Math.abs(fraction - .25) < 1e-6, "glTF's Y-up height is measured from the sphere bottom");
  const manifest = JSON.parse(await readFile(new URL("asset/ball-maze/models/manifest.json", root), "utf8"));
  assert.equal(manifest.find((entry) => entry.id === "rocket").rocket_anchor_height_fraction, .25);
});

test("the real hamster is inside its transparent shell and remains an opaque textured mesh", async () => {
  const model = await readModel("hamster");
  const shellNode = model.json.nodes.find((node) => node.name.startsWith("HamsterBall_Glass"));
  const hamsterNode = model.json.nodes.find((node) => node.name === "Hamster_Stand_Yellow");
  const shell = geometryBounds(model, shellNode);
  const hamster = geometryBounds(model, hamsterNode);
  for (const axis of [0, 1, 2]) {
    assert.ok(hamster.min[axis] > shell.min[axis]);
    assert.ok(hamster.max[axis] < shell.max[axis]);
  }
  const shellMaterial = model.json.materials[model.json.meshes[shellNode.mesh].primitives[0].material];
  const hamsterMaterial = model.json.materials[model.json.meshes[hamsterNode.mesh].primitives[0].material];
  assert.equal(shellMaterial.alphaMode, "BLEND");
  assert.ok(Math.abs(shellMaterial.pbrMetallicRoughness.baseColorFactor[3] - .2) < 1e-6);
  assert.ok(!shellMaterial.extensions.KHR_materials_transmission, "no environment-only refraction hiding the hamster");
  assert.ok(hamsterMaterial.pbrMetallicRoughness.baseColorTexture);
  assert.ok(!hamsterMaterial.alphaMode || hamsterMaterial.alphaMode === "OPAQUE");
});

test("six completed worlds replace the previous three cards and oversized figure", async () => {
  const catalog = await readFile(new URL("src/ball-maze-catalog.ts", root), "utf8");
  const worlds = catalog.split("export const ballMazeBalls")[0];
  for (const id of ["city", "mine", "island", "valley", "black-hole", "darkroom"]) assert.match(worlds, new RegExp(`id: "${id}"`));
  const page = await readFile(new URL("src/ball-maze.ts", root), "utf8");
  assert.doesNotMatch(page, /bm-feature-figure|bm-world-next|data-ball-filter|concepts\/|visual\("[123]-/);
  assert.match(page, /bm-side-nav/);
  assert.match(page, /setupBallMazeSections\(\)/);
  const sections = await readFile(new URL("src/ball-maze-sections.ts", root), "utf8");
  assert.match(sections, /setAttribute\("aria-current", "location"\)/);
  for (const name of ["city", "mine", "island", "valley", "black-hole", "play", "editor", "records"]) await access(new URL(`asset/ball-maze/visual-content/latest/${name}.webp`, root));
  for (const name of ["city", "play", "editor", "records"]) await access(new URL(`asset/ball-maze/visual-content/latest/${name}.mp4`, root));
});

test("world card titles prioritize the active language and omit duplicate English subtitles", async () => {
  const page = await readFile(new URL("src/ball-maze.ts", root), "utf8");
  const card = page.split("const worldCard =")[1].split("const ballCard =")[0];
  assert.match(card, /text\(`world\.\$\{world\.id\}\.name`, copy\(world\.name\.zh, world\.english, world\.name\.ja\)\)/);
  assert.match(card, /<em class="bm-world-english" lang="en">\$\{escapeHtml\(world\.english\)\}<\/em>/);
  assert.doesNotMatch(card, /\$\{world\.english\}<br/);
  const styles = await readFile(new URL("src/ball-maze.css", root), "utf8");
  assert.match(styles, /\.bm-world-card h3 > span\s*\{[^}]*display:\s*block/);
  assert.match(styles, /\.bm-world-card h3 \.bm-world-english\s*\{[^}]*font-size:\s*\.53em/);
  assert.match(styles, /\.ball-maze-page\[data-bm-language="en"\] \.bm-world-english\s*\{[^}]*display:\s*none/);
});

test("the Chinese worlds subtitle uses the shorter copy and stays on one line", async () => {
  const page = await readFile(new URL("src/ball-maze.ts", root), "utf8");
  assert.match(page, /copy\("六种风景，<br \/><em>六种重力谜题。<\/em>"/);
  assert.doesNotMatch(page, /六种重力的谜题/);
  const styles = await readFile(new URL("src/ball-maze.css", root), "utf8");
  assert.match(styles, /\.ball-maze-page\[data-bm-language="zh"\] #bm-worlds-title em\s*\{[^}]*white-space:\s*nowrap/);
});

test("the world statistics show six worlds, twenty superpower balls and over two hundred tracks", async () => {
  const page = await readFile(new URL("src/ball-maze.ts", root), "utf8");
  const stats = page.split('class="bm-world-stat-strip bm-reveal"')[1].split('class="bm-world-grid"')[0];
  for (const [key, count, englishCount, japaneseCount] of [
    ["worlds", "6 个", "6", "6 つ"],
    ["balls", "20 个", "20", "20 個"],
    ["tracks", "200+ 个", "200+", "200+ 個"],
  ]) assert.ok(stats.includes(`html("stats.${key}.count", copy("${count}", "${englishCount}", "${japaneseCount}"), "strong")`));
  for (const label of ["待挑战的世界", "超能力小球", "与众不同的轨道", "WORLDS TO CHALLENGE", "SUPERPOWER BALLS", "DISTINCT TRACKS"]) assert.ok(stats.includes(label));
  assert.doesNotMatch(stats, /stats\.rotation|360°|已完成世界|COMPLETED WORLDS/);
  const styles = await readFile(new URL("src/ball-maze.css", root), "utf8");
  assert.match(styles, /\.bm-world-stat-strip strong\s*\{[^}]*white-space:\s*nowrap/);
  assert.match(styles, /\.bm-world-stat-strip strong\s*\{[^}]*font-size:\s*clamp\(24px, 7\.1vw, 28px\)/);
});

test("floating navigation keeps lines visible and expands labels on hover or focus", async () => {
  const page = await readFile(new URL("src/ball-maze.ts", root), "utf8");
  const styles = await readFile(new URL("src/ball-maze.css", root), "utf8");
  assert.doesNotMatch(page, /showNavigation|idleTimer|sideNav\.classList\.add\("is-idle"\)/);
  assert.match(styles, /\.bm-side-tabs a::before\s*\{[^}]*height:\s*2px/);
  assert.match(styles, /\.bm-side-tabs a > b, \.bm-side-tabs a > span\s*\{[^}]*visibility:\s*hidden/);
  assert.match(styles, /\.bm-side-tabs:is\(:hover, :focus-within\) a::before\s*\{[^}]*opacity:\s*0/);
  assert.match(styles, /\.bm-side-tabs:is\(:hover, :focus-within\) a > span\s*\{[^}]*visibility:\s*visible/);
  assert.match(styles, /\.bm-side-nav\s*\{[^}]*--bm-nav-color:\s*var\(--bm-page-ink\)/);
  assert.match(styles, /\.bm-side-tabs a:focus-visible\s*\{[^}]*outline:/);
});

test("core gameplay places text and footage in one compact desktop row and stacks on mobile", async () => {
  const page = await readFile(new URL("src/ball-maze.ts", root), "utf8");
  const play = page.split('id="play"')[1].split('id="worlds"')[0];
  assert.match(play, /class="bm-play-layout">\s*<div class="bm-section-heading/);
  assert.match(play, /class="bm-play-footage bm-video-frame bm-reveal">\$\{video\("play", "旋转迷宫实机演示"\)\}<\/div>\s*<\/div>\s*<div class="bm-play-cards">/);
  const styles = await readFile(new URL("src/ball-maze.css", root), "utf8");
  assert.match(styles, /\.bm-play-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0, \.9fr\) minmax\(0, 1\.1fr\);[^}]*align-items:\s*center/);
  assert.match(styles, /\.bm-play-layout\s*\{[^}]*grid-template-columns:\s*1fr/);
  assert.match(styles, /\.bm-play-section\s*\{[^}]*padding-block:\s*clamp\(64px, 5vw, 84px\)/);
  assert.doesNotMatch(styles, /\.bm-play-section\s*\{[^}]*min-height:\s*900px/);
  assert.doesNotMatch(styles, /\.bm-play-footage\s*\{[^}]*margin:\s*48px/);
});

test("all balls have independent lazy canvases instead of selection and a shared preview", async () => {
  const gallery = await readFile(new URL("src/ball-maze-gallery.ts", root), "utf8");
  assert.match(gallery, /await import\("@google\/model-viewer"\)/);
  assert.match(gallery, /querySelectorAll<ModelViewerElement>\("\[data-bm-ball-model\]"\)/);
  assert.match(gallery, /ball-maze-language/);
  assert.match(gallery, /viewer\.addEventListener\("error"/);
  assert.match(gallery, /if \(!item\.visible\) continue/);
  assert.match(gallery, /reducedMotion\.matches/);
  assert.match(gallery, /item\.inside \|\| item\.dragging \|\| item\.keyboard/);
  assert.doesNotMatch(gallery, /selectBall|resetView|resetTurntableRotation|is-selected/);
  const page = await readFile(new URL("src/ball-maze.ts", root), "utf8");
  assert.match(page, /balls\.map\(ballCard\)/);
  assert.match(page, /data-bm-ball-model="\$\{ball\.id\}"/);
  assert.match(page, /class="bm-ball-card-top"><span>\$\{String\(index \+ 1\)\.padStart\(2, "0"\)\} \/ 20<\/span><\/div>/);
  assert.doesNotMatch(page, /GAME MODEL \/ 3D/);
  assert.match(page, /loading="lazy"/);
  assert.match(page, /camera-controls touch-action="pan-y"/);
  assert.match(page, /disable-pan disable-zoom/);
  assert.doesNotMatch(page, /bm-ball-choice|bm-ball-selector|bm-model-toolbar|bm-selected-|data-model-action/);
  const styles = await readFile(new URL("src/ball-maze.css", root), "utf8");
  assert.match(styles, /body\.is-ball-maze-page:is\([^)]*\[data-bm-section="balls"\][^)]*\)\s*\{[^}]*--bm-page-accent:\s*var\(--bm-deep\)/);
  assert.match(styles, /\.bm-ball-grid\s*\{[^}]*repeat\(4, minmax\(0, 1fr\)\)/);
});

test("hover highlights only the whole ball card border, not the model canvas background", async () => {
  const styles = await readFile(new URL("src/ball-maze.css", root), "utf8");
  assert.doesNotMatch(styles, /\.bm-ball-canvas(?:\[[^\]]+\]|:hover)[^{]*\{[^}]*background\s*:/);
  const hover = styles.match(/\.bm-ball-card:is\(:hover, :has\(:focus-visible\)\)\s*\{([^}]*)\}/)?.[1];
  assert.ok(hover, "highlight the card on hover and keyboard focus");
  assert.match(hover, /outline:\s*1px solid #075054/);
  assert.match(hover, /outline-offset:\s*0/);
  assert.match(hover, /z-index:\s*1/);
  assert.doesNotMatch(hover, /background|box-shadow|transform|padding/, "no fill, glow or layout shift");
});

test("ball canvases reserve framing room for soft shadows without hiding or cropping them", async () => {
  const page = await readFile(new URL("src/ball-maze.ts", root), "utf8");
  assert.match(page, /camera-orbit="25deg 70deg 140%"/, "extra camera distance includes the soft shadow, not only the mesh");
  assert.match(page, /max-camera-orbit="auto 168deg 140%"/, "the default maximum distance must not clamp away the shadow margin");
  assert.match(page, /shadow-intensity="0\.25" shadow-softness="1"/, "keep the requested contact shadow");
  const gallery = await readFile(new URL("src/ball-maze-gallery.ts", root), "utf8");
  assert.match(gallery, /item\.motion\.orbit = \{ \.\.\.item\.viewer\.getCameraOrbit\(\) \}/, "tracking inherits the padded framing distance");
  const styles = await readFile(new URL("src/ball-maze.css", root), "utf8");
  const canvasRule = styles.match(/\.bm-ball-canvas model-viewer\s*\{([^}]*)\}/)[1];
  assert.doesNotMatch(canvasRule, /clip-path|mask-image|opacity:\s*0/, "no masking away the clipped shadow");
});

test("pointer tracking uses each canvas center and never crosses the orbit poles", () => {
  const bounds = { left: 100, top: 100, width: 240, height: 240 };
  const center = pointerLookTarget({ x: 220, y: 220 }, bounds);
  assert.ok(Math.abs(center.theta - 25 * Math.PI / 180) < 1e-10);
  assert.ok(Math.abs(center.phi - 70 * Math.PI / 180) < 1e-10);
  assert.ok(pointerLookTarget({ x: 800, y: 220 }, bounds).theta < center.theta);
  assert.ok(pointerLookTarget({ x: 0, y: 220 }, bounds).theta > center.theta);
  assert.ok(pointerLookTarget({ x: 220, y: 0 }, bounds).phi > center.phi);
  assert.notEqual(pointerLookTarget({ x: 800, y: 220 }, bounds).theta, pointerLookTarget({ x: 800, y: 220 }, { ...bounds, left: 500 }).theta);
  for (const y of [-1e12, 1e12]) {
    const target = pointerLookTarget({ x: 220, y }, bounds);
    assert.ok(target.phi >= 12 * Math.PI / 180 && target.phi <= 168 * Math.PI / 180);
  }
  assert.equal(isPointerInCanvas({ x: 100, y: 100 }, bounds), true);
  assert.equal(isPointerInCanvas({ x: 340, y: 220 }, bounds), false);
  assert.equal(isPointerInCanvas({ x: 220, y: 350 }, bounds), false, "labels below the canvas do not suspend tracking");
});

test("entering a canvas pauses tracking; leaving keeps the last manual angle and distance", () => {
  const manualOrbit = { theta: 9.2, phi: 2.1, radius: 4.5 };
  const original = { mode: "follow", orbit: { theta: .4, phi: 1.2, radius: 1 } };
  const paused = setBallMotionMode(original, "manual", manualOrbit);
  assert.deepEqual(paused.orbit, manualOrbit);
  assert.equal(advanceBallMotion(paused, { theta: -.8, phi: .5 }, 1000), paused);
  const resumed = setBallMotionMode(paused, "follow", manualOrbit);
  assert.deepEqual(resumed.orbit, manualOrbit, "there is no reset on pointer leave");
  const firstFrame = advanceBallMotion(resumed, { theta: -.8, phi: .5 }, 16);
  assert.ok(Math.abs(firstFrame.orbit.theta - manualOrbit.theta) < .3);
  assert.ok(Math.abs(firstFrame.orbit.phi - manualOrbit.phi) < .2);
  assert.equal(firstFrame.orbit.radius, manualOrbit.radius);
});

test("resuming after multiple manual revolutions takes the short arc and converges smoothly", () => {
  const initialTheta = 6 * Math.PI + Math.PI - .05;
  let motion = { mode: "follow", orbit: { theta: initialTheta, phi: 1, radius: 2 } };
  const target = { theta: -Math.PI + .05, phi: 1.5 };
  const first = advanceBallMotion(motion, target, 16);
  assert.ok(first.orbit.theta > initialTheta);
  assert.ok(first.orbit.theta - initialTheta < .02, "no spin through all the accumulated revolutions");
  for (let frame = 0; frame < 120; frame++) motion = advanceBallMotion(motion, target, 16);
  assert.ok(Math.abs(Math.sin(motion.orbit.theta - target.theta)) < .001);
  assert.ok(Math.abs(motion.orbit.phi - target.phi) < .001);
  assert.equal(advanceBallMotion(motion, target, 16), motion, "settled tracking does not keep requesting frames");
  assert.equal(motion.orbit.radius, 2);
});

test("game modes contain only solo and co-op with consecutive numbering", async () => {
  const page = await readFile(new URL("src/ball-maze.ts", root), "utf8");
  const modes = page.split('id="modes"')[1].split('id="build"')[0];
  assert.equal((modes.match(/<article class="bm-mode-card/g) ?? []).length, 2);
  assert.match(modes, /01 \/ SOLO/);
  assert.match(modes, /02 \/ CO-OP/);
  assert.doesNotMatch(page, /分屏竞速|split-screen|SPLIT-SCREEN|mode\.split|画面分割レース|两种一起玩的方式/);
  assert.match(modes, /modes\.title/);
  const styles = await readFile(new URL("src/ball-maze.css", root), "utf8");
  assert.match(styles, /\.bm-mode-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
});

test("the editor CTA opens Ball Maze's Workshop with localized community-maze copy", async () => {
  const page = await readFile(new URL("src/ball-maze.ts", root), "utf8");
  const editor = page.split('id="build"')[1].split('id="records"')[0];
  assert.match(editor, /class="bm-inline-link" href="https:\/\/steamcommunity\.com\/app\/3678730\/workshop\/" target="_blank" rel="noopener noreferrer"/);
  assert.match(editor, /text\("build\.cta", copy\("在创意工坊查看社区迷宫", "VIEW COMMUNITY MAZES IN THE WORKSHOP", "ワークショップでコミュニティの迷路を見る"\)\)/);
  assert.doesNotMatch(editor, /前往 Steam 了解更多|EXPLORE ON STEAM|store\.steampowered\.com/);
});

test("editor and score sections show uncropped real game recordings", async () => {
  const page = await readFile(new URL("src/ball-maze.ts", root), "utf8");
  assert.match(page, /video\("editor", "关卡编辑器真实游戏录屏", true\)/);
  assert.match(page, /video\("records", "游戏成绩与最佳记录真实录屏", true\)/);
  assert.match(page, /data-bm-recording/);
  const manifest = JSON.parse(await readFile(new URL("asset/ball-maze/recordings.json", root), "utf8"));
  assert.deepEqual(manifest.recordings.map((clip) => clip.id), ["editor", "records", "solo", "tracks", "abilities"]);
  assert.equal(manifest.recordings[0].source, "关卡编辑器-back.mp4");
  assert.equal(manifest.recordings[1].poster_seconds, 6);
  assert.equal(manifest.recordings[1].hold_last_seconds, 5);
  const styles = await readFile(new URL("src/ball-maze.css", root), "utf8");
  assert.match(styles, /\[data-bm-recording\][^{]*\{[^}]*object-fit:\s*contain/);
});

test("every video uses the same fine-outline frame without captions, shadows or tilted borders", async () => {
  const page = await readFile(new URL("src/ball-maze.ts", root), "utf8");
  const frames = [...page.matchAll(/class="[^"]*\bbm-video-frame\b[^"]*">\$\{video\("([^"]+)"/g)];
  assert.deepEqual(frames.map((frame) => frame[1]), ["play", "solo", "editor", "records"]);
  assert.match(page, /class="bm-hero-viewport media-viewport bm-video-frame">\$\{heroClips\.map\(heroSlide\)/);
  assert.match(page, /class="bm-mode-footage bm-video-frame bm-mode-footage-pending"/);
  assert.doesNotMatch(page, /bm-editor-card-label|bm-record-footage-label|build\.recording|records\.recording/);
  const styles = await readFile(new URL("src/ball-maze.css", root), "utf8");
  assert.match(styles, /\.bm-video-frame\s*\{[^}]*border:\s*1px solid var\(--bm-video-line\);[^}]*box-shadow:\s*none/);
  for (const selector of ["bm-hero-photo", "bm-play-footage", "bm-mode-footage", "bm-editor-card", "bm-record-footage"]) {
    const blocks = [...styles.matchAll(new RegExp(`\\.${selector}(?:\\s*:[\\w-]+)?\\s*\\{([^}]+)\\}`, "g"))];
    for (const block of blocks) assert.doesNotMatch(block[1], /box-shadow:|border(?:-width)?:|transform:\s*rotate/, selector);
  }
});

test("hero pages through the three real tutorial videos with the same home carousel", async () => {
  const page = await readFile(new URL("src/ball-maze.ts", root), "utf8");
  const home = await readFile(new URL("src/main.ts", root), "utf8");
  assert.match(page, /import \{ setupMediaCarousel \} from "\.\/media-carousel"/);
  assert.match(home, /setupMediaCarousel\(stage, \(\) => updateMediaLabel\(stage\)\)/);
  assert.match(page, /const cleanup = setupMediaCarousel\(heroCarousel\)/, "initialization also runs outside development HMR");
  assert.match(page, /const heroClips = ballMazeHero\.clips/);
  assert.match(page, /renderBallMazeHeroSlide\(clip, index, visual\)/);
  const sharedHero = await readFile(new URL("src/ball-maze-hero.ts", root), "utf8");
  const clips = sharedHero.split("clips: [")[1].split("]")[0];
  assert.deepEqual([...clips.matchAll(/id: "([^"]+)"/g)].map((match) => match[1]), ["editor", "tracks", "abilities"]);
  const slide = sharedHero.split("export const renderBallMazeHeroSlide =")[1];
  assert.match(slide, /class="media-slide/);
  assert.match(slide, /data-bm-carousel-video data-bm-recording=/);
  assert.doesNotMatch(slide, /data-bm-video\b|\bloop\b/, "hero playback is handled only by its playlist, not the generic loop observer");
  const manifest = JSON.parse(await readFile(new URL("asset/ball-maze/recordings.json", root), "utf8"));
  for (const [id, source] of [["editor", "关卡编辑器-back.mp4"], ["tracks", "特殊轨道.mp4"], ["abilities", "小球能力.mp4"]]) {
    const clip = manifest.recordings.find((clip) => clip.id === id);
    assert.equal(clip.source, source);
    assert.equal(clip.start_seconds, 0);
    assert.equal(clip.end_seconds, undefined, "complete tutorial recordings");
    for (const extension of ["mp4", "webp"]) await access(new URL(`asset/ball-maze/visual-content/latest/${id}.${extension}`, root));
  }
});

test("hero reserves a desktop gap and removes the logo's negative left offset", async () => {
  const styles = await readFile(new URL("src/ball-maze.css", root), "utf8");
  assert.match(styles, /\.bm-hero\s*\{[^}]*column-gap:\s*clamp\(48px, 5\.5vw, 96px\)/);
  for (const rule of styles.matchAll(/\.bm-hero-logo\s*\{([^}]*)\}/g)) {
    const margins = rule[1].match(/margin:\s*([^;]+);/)[1].trim().split(/\s+/);
    assert.equal(margins[1], "0", "no horizontal logo offset");
    assert.ok(margins.length < 4 || margins[3] === "0", "no negative left logo offset");
  }
  assert.match(styles, /\.bm-hero-copy\s*\{[^}]*order:\s*-1/, "copy precedes footage in the mobile stack");
  assert.match(styles, /\.bm-hero-photo\s*\{[^}]*width:\s*100%;[^}]*margin:\s*32px 0 0/);
  assert.match(styles, /\.bm-hero-pagination\s*\{[^}]*position:\s*static/, "paging controls do not cover the recording or native controls");
});

test("mode cards show real solo footage and disclose the missing co-op recording on dark theme backgrounds", async () => {
  const page = await readFile(new URL("src/ball-maze.ts", root), "utf8");
  const modes = page.split('id="modes"')[1].split('id="build"')[0];
  assert.match(modes, /video\("solo", "单人挑战真实游戏录屏", true\)/);
  assert.match(modes, /多人协作实机录屏待提供/);
  assert.doesNotMatch(modes, /video\("coop"|<strong>0[12]<\/strong>/);
  const manifest = JSON.parse(await readFile(new URL("asset/ball-maze/recordings.json", root), "utf8"));
  assert.equal(manifest.recordings.find((clip) => clip.id === "solo").source, "普通球-back.mp4");
  assert.equal(manifest.pending_recordings[0].id, "coop");
  for (const extension of ["mp4", "webp"]) await access(new URL(`asset/ball-maze/visual-content/latest/solo.${extension}`, root));
  const styles = await readFile(new URL("src/ball-maze.css", root), "utf8");
  assert.match(styles, /body\.is-ball-maze-page\[data-bm-section="modes"\]\s*\{[^}]*--bm-page-bg:\s*var\(--bm-deep\)/);
  assert.match(styles, /\.bm-mode-card\s*\{[^}]*background:\s*var\(--bm-deeper\);[^}]*color:\s*var\(--bm-cream\)/);
});

test("each Chinese record title phrase stays on its own unbroken line", async () => {
  const page = await readFile(new URL("src/ball-maze.ts", root), "utf8");
  assert.match(page, /text\("records\.title\.first", copy\("每一条路线，"/);
  assert.match(page, /text\("records\.title\.second", copy\("都可以更好。"/);
  const styles = await readFile(new URL("src/ball-maze.css", root), "utf8");
  assert.match(styles, /#bm-record-title > span,\s*#bm-record-title > em\s*\{[^}]*display:\s*block/);
  assert.match(styles, /\.ball-maze-page\[data-bm-language="zh"\] #bm-record-title > em\s*\{[^}]*white-space:\s*nowrap/);
});

test("the final section omits the removed sentence in every language and retains its headline and Steam CTA", async () => {
  const page = await readFile(new URL("src/ball-maze.ts", root), "utf8");
  const final = page.split('id="steam"')[1].split('<footer class="bm-footer">')[0];
  assert.doesNotMatch(final, /final\.copy|当小球停在起点|When the ball is waiting at the start|ボールがスタートで待つとき/);
  assert.match(final, /id="bm-final-title">现在，<br \/><em>轮到你来转。<\/em><\/h2><a class="bm-button bm-button-primary"/);
  assert.match(final, /https:\/\/store\.steampowered\.com\/app\/3678730\//);
  assert.match(final, /text\("final\.cta", copy\("前往 Steam", "VISIT STEAM", "Steamへ"\)\)/);
  assert.match(final, /class="bm-final-mark"/);
});
