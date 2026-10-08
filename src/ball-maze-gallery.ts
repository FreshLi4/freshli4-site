import type { ModelViewerElement } from "@google/model-viewer";
import { ballMazeBalls, type BallMazeLanguage } from "./ball-maze-catalog";
import { advanceBallMotion, isPointerInCanvas, pointerLookTarget, setBallMotionMode, type BallMotion, type BallPointer } from "./ball-maze-motion";

const files = import.meta.glob("/asset/ball-maze/models/*.glb", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const statusCopy = {
  loading: { zh: "正在加载实际模型…", en: "Loading game model…", ja: "ゲームモデルを読み込み中…" },
  error: { zh: "模型加载失败，请重试。", en: "Model unavailable. Please retry.", ja: "モデルを読み込めません。再試行してください。" },
  retry: { zh: "重试加载", en: "RETRY", ja: "再試行" },
};

export const setupBallMazeGallery = (initialLanguage: BallMazeLanguage) => {
  const items = [...document.querySelectorAll<ModelViewerElement>("[data-bm-ball-model]")].map((viewer) => ({
    viewer,
    ball: ballMazeBalls.find((ball) => ball.id === viewer.dataset.bmBallModel)!,
    canvas: viewer.closest<HTMLElement>(".bm-ball-canvas")!,
    status: viewer.parentElement!.querySelector<HTMLElement>(".bm-model-status")!,
    retry: viewer.parentElement!.querySelector<HTMLButtonElement>("[data-bm-model-retry]")!,
    state: "loading" as "loading" | "error" | "ready",
    visible: false,
    inside: false,
    dragging: false,
    keyboard: false,
    bounds: viewer.getBoundingClientRect(),
    motion: { mode: "follow", orbit: { theta: 25 * Math.PI / 180, phi: 70 * Math.PI / 180, radius: 1 } } as BallMotion,
  }));
  if (!items.length) return;
  let language = initialLanguage;
  let registered = false;
  let viewerImport: Promise<void> | undefined;
  let pointer: BallPointer | undefined;
  let frame = 0;
  let lastFrame = 0;
  let boundsDirty = true;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const updateText = (item: typeof items[number]) => {
    item.viewer.setAttribute("alt", `${item.ball.name[language]} · 3D`);
    item.status.textContent = item.state === "ready" ? "" : statusCopy[item.state][language];
    item.status.hidden = item.state === "ready";
    item.retry.textContent = statusCopy.retry[language];
  };
  const setState = (item: typeof items[number], state: typeof item.state) => {
    item.state = state;
    item.canvas.dataset.state = state;
    item.canvas.setAttribute("aria-busy", String(state === "loading"));
    item.retry.hidden = state !== "error";
    updateText(item);
  };
  const updateMode = (item: typeof items[number]) => {
    const mode = item.inside || item.dragging || item.keyboard ? "manual" : "follow";
    if (item.motion.mode !== mode && registered && item.viewer.loaded) {
      item.motion = setBallMotionMode(item.motion, mode, item.viewer.getCameraOrbit());
      // Cancel the last automatic goal at the current rendered angle on entry.
      if (mode === "manual") item.viewer.cameraOrbit = `${item.motion.orbit.theta}rad ${item.motion.orbit.phi}rad ${item.motion.orbit.radius}m`;
    } else item.motion.mode = mode;
    item.canvas.dataset.mode = reducedMotion.matches && mode === "follow" ? "still" : mode;
  };
  const stop = () => { cancelAnimationFrame(frame); frame = 0; lastFrame = 0; };
  const render = (time: number) => {
    frame = 0;
    if (!registered || !pointer || document.hidden || reducedMotion.matches) { lastFrame = 0; return; }
    const elapsed = lastFrame ? time - lastFrame : 16;
    lastFrame = time;
    let moving = false;
    for (const item of items) {
      if (!item.visible) continue;
      if (boundsDirty) item.bounds = item.viewer.getBoundingClientRect();
      item.inside = isPointerInCanvas(pointer, item.bounds);
      updateMode(item);
      if (item.state !== "ready" || item.motion.mode === "manual") continue;
      const next = advanceBallMotion(item.motion, pointerLookTarget(pointer, item.bounds), elapsed);
      if (next === item.motion) continue;
      item.motion = next;
      item.viewer.cameraOrbit = `${next.orbit.theta}rad ${next.orbit.phi}rad ${next.orbit.radius}m`;
      moving = true;
    }
    boundsDirty = false;
    if (moving) frame = requestAnimationFrame(render);
    else lastFrame = 0;
  };
  const schedule = () => { if (!frame && pointer && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(render); };

  const startViewers = () => {
    viewerImport ??= (async () => {
      try {
        await import("@google/model-viewer");
        registered = true;
        for (const item of items) {
          const src = files[`/asset/ball-maze/models/${item.ball.id}.glb`];
          if (src) item.viewer.src = src;
          else setState(item, "error");
        }
        schedule();
      } catch {
        viewerImport = undefined;
        items.forEach((item) => setState(item, "error"));
      }
    })();
    return viewerImport;
  };

  for (const item of items) {
    updateText(item);
    item.viewer.addEventListener("load", () => {
      item.motion.orbit = { ...item.viewer.getCameraOrbit() };
      setState(item, "ready");
      updateMode(item);
      boundsDirty = true;
      schedule();
    });
    item.viewer.addEventListener("error", () => setState(item, "error"));
    item.viewer.addEventListener("camera-change", (event) => {
      if ((event as CustomEvent<{ source: string }>).detail.source === "user-interaction") {
        item.motion.orbit = { ...item.viewer.getCameraOrbit() };
      }
    });
    item.canvas.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      item.inside = true;
      item.keyboard = false;
      updateMode(item);
    });
    item.canvas.addEventListener("pointerleave", () => {
      item.inside = false;
      item.keyboard = false;
      updateMode(item);
      schedule();
    });
    item.canvas.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      item.dragging = true;
      item.keyboard = false;
      updateMode(item);
    }, { capture: true });
    item.viewer.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      item.keyboard = true;
      updateMode(item);
    }, { capture: true });
    item.viewer.addEventListener("blur", () => { item.keyboard = false; updateMode(item); schedule(); }, { capture: true });
    item.retry.addEventListener("click", async () => {
      setState(item, "loading");
      await startViewers();
      if (!registered) return;
      item.viewer.removeAttribute("src");
      await item.viewer.updateComplete;
      item.viewer.src = files[`/asset/ball-maze/models/${item.ball.id}.glb`];
    });
  }
  const finishDrag = () => {
    for (const item of items) {
      if (!item.dragging) continue;
      item.dragging = false;
      item.inside = !!pointer && isPointerInCanvas(pointer, item.viewer.getBoundingClientRect());
      updateMode(item);
    }
    schedule();
  };
  window.addEventListener("pointerup", finishDrag);
  window.addEventListener("pointercancel", finishDrag);
  window.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    pointer = { x: event.clientX, y: event.clientY };
    for (const item of items) {
      if (item.keyboard) { item.keyboard = false; updateMode(item); }
    }
    schedule();
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { pointer = undefined; stop(); });
  window.addEventListener("blur", () => { pointer = undefined; finishDrag(); stop(); });
  const refreshBounds = () => { boundsDirty = true; schedule(); };
  window.addEventListener("scroll", refreshBounds, { passive: true });
  window.addEventListener("resize", refreshBounds);
  void document.fonts.ready.then(refreshBounds);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else refreshBounds(); });
  reducedMotion.addEventListener("change", () => {
    items.forEach(updateMode);
    if (reducedMotion.matches) stop();
    else schedule();
  });
  document.addEventListener("ball-maze-language", ((event: CustomEvent<BallMazeLanguage>) => {
    language = event.detail;
    items.forEach(updateText);
    refreshBounds();
  }) as EventListener);
  // model-viewer shares a renderer across these independent scenes and lazily
  // loads each real model. Only on-screen balls participate in pointer tracking.
  const preload = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) { void startViewers(); preload.disconnect(); }
  }, { rootMargin: "300px" });
  preload.observe(document.querySelector(".bm-ball-grid")!);
  const visibility = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const item = items.find((item) => item.canvas === entry.target)!;
      item.visible = entry.isIntersecting;
    }
    refreshBounds();
  });
  items.forEach((item) => visibility.observe(item.canvas));
};
