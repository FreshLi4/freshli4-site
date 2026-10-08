/** World-card previews remain still until mouse hover or keyboard focus. */
export const setupBallMazeWorldVideos = () => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cleanups: (() => void)[] = [];
  const previews = [...document.querySelectorAll<HTMLVideoElement>("[data-bm-world-video]")].map((video) => ({
    video, card: video.closest<HTMLElement>(".bm-world-card")!, visible: false, hovered: false,
  }));
  const listen = (target: EventTarget, type: string, handler: EventListener) => {
    target.addEventListener(type, handler);
    cleanups.push(() => target.removeEventListener(type, handler));
  };
  const mayPlay = (preview: typeof previews[number]) => preview.visible && !document.hidden && !reducedMotion.matches
    && (preview.hovered || preview.card.matches(":focus-visible"));
  const sync = (preview: typeof previews[number]) => {
    if (mayPlay(preview)) {
      if (preview.video.paused) void preview.video.play().catch(() => undefined);
    } else preview.video.pause();
  };
  const syncAll = () => previews.forEach(sync);
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const preview = previews.find((preview) => preview.card === entry.target);
      if (!preview) continue;
      preview.visible = entry.isIntersecting;
      if (!preview.visible) preview.hovered = false;
      else preview.hovered = preview.card.matches(":hover") && window.matchMedia("(hover: hover)").matches;
      sync(preview);
    }
  }, { threshold: .1 });
  previews.forEach((preview) => {
    preview.video.pause();
    listen(preview.card, "pointerenter", (event) => {
      const type = (event as PointerEvent).pointerType;
      if (type !== "mouse" && type !== "pen") return;
      preview.hovered = true;
      sync(preview);
    });
    listen(preview.card, "pointerleave", () => { preview.hovered = false; sync(preview); });
    listen(preview.card, "pointercancel", () => { preview.hovered = false; sync(preview); });
    listen(preview.card, "focusin", () => sync(preview));
    listen(preview.card, "focusout", () => sync(preview));
    // A delayed play request must not keep a video running after hover ends.
    listen(preview.video, "play", () => { if (!mayPlay(preview)) preview.video.pause(); });
    observer.observe(preview.card);
  });
  listen(document, "visibilitychange", syncAll);
  listen(reducedMotion, "change", syncAll);
  return () => {
    observer.disconnect();
    cleanups.forEach((cleanup) => cleanup());
    previews.forEach((preview) => preview.video.pause());
  };
};
