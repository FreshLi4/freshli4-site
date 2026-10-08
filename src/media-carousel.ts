/** Shared home-page media paging, with one playing video at a time. */
export const setupMediaCarousel = (stage: HTMLElement, onChange?: () => void) => {
  const slides = [...stage.querySelectorAll<HTMLElement>(".media-slide")];
  const buttons = [...stage.querySelectorAll<HTMLButtonElement>(".media-pagination [data-target]")];
  const toggle = stage.querySelector<HTMLButtonElement>("[data-carousel-toggle]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cleanups: (() => void)[] = [];
  let current = 0;
  let visible = false;
  let pausedByUser = reducedMotion.matches;
  let timer: number | undefined;
  let progressFrame = 0;
  let startedAt = 0;
  let imageElapsed = 0;

  if (!slides.length) return () => {};
  const listen = (target: EventTarget, type: string, handler: EventListener) => {
    target.addEventListener(type, handler);
    cleanups.push(() => target.removeEventListener(type, handler));
  };
  const activeVideo = () => slides[current].querySelector<HTMLVideoElement>("video");
  const canAdvance = () => visible && !document.hidden && !pausedByUser;
  const setProgress = (progress: number) => buttons.forEach((button, index) => {
    button.style.setProperty("--progress", index === current ? `${Math.max(0, Math.min(1, progress)) * 100}%` : "0%");
  });
  const stopClocks = () => {
    if (timer !== undefined) {
      imageElapsed += performance.now() - startedAt;
      window.clearTimeout(timer);
      timer = undefined;
    }
    window.cancelAnimationFrame(progressFrame);
    progressFrame = 0;
  };
  const updateProgress = () => {
    progressFrame = 0;
    const video = activeVideo();
    const progress = video ? (Number.isFinite(video.duration) && video.duration > 0 ? video.currentTime / video.duration : 0)
      : (imageElapsed + performance.now() - startedAt) / 3000;
    setProgress(progress);
    if (canAdvance() && (!video || !video.paused) && progress < 1) progressFrame = window.requestAnimationFrame(updateProgress);
  };
  const syncPlayback = () => {
    stopClocks();
    toggle?.setAttribute("aria-pressed", String(!pausedByUser));
    const icon = toggle?.querySelector<HTMLElement>("[data-carousel-icon]");
    if (icon) icon.textContent = pausedByUser ? "▶" : "Ⅱ";
    const video = activeVideo();
    if (!canAdvance()) {
      video?.pause();
      return;
    }
    if (video && !video.error) void video.play().catch(() => undefined);
    else {
      startedAt = performance.now();
      timer = window.setTimeout(() => { timer = undefined; show(current + 1); }, Math.max(0, 3000 - imageElapsed));
    }
    progressFrame = window.requestAnimationFrame(updateProgress);
  };
  const show = (index: number) => {
    stopClocks();
    current = ((index % slides.length) + slides.length) % slides.length;
    imageElapsed = 0;
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle("active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
      const video = slide.querySelector<HTMLVideoElement>("video");
      if (video) {
        video.loop = false;
        if (!active) { video.pause(); video.currentTime = 0; }
      }
    });
    buttons.forEach((button, i) => {
      button.classList.toggle("active", i === current);
      if (i === current) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    setProgress(0);
    onChange?.();
    syncPlayback();
  };

  buttons.forEach((button) => listen(button, "click", () => show(Number(button.dataset.target))));
  const next = stage.querySelector<HTMLButtonElement>(".media-expand");
  if (next) listen(next, "click", () => show(current + 1));
  if (toggle) listen(toggle, "click", () => { pausedByUser = !pausedByUser; syncPlayback(); });
  slides.forEach((slide, index) => {
    const video = slide.querySelector<HTMLVideoElement>("video");
    if (!video) return;
    listen(video, "ended", () => { if (index === current && canAdvance()) show(current + 1); });
    listen(video, "error", () => { if (index === current) syncPlayback(); });
    listen(video, "play", () => {
      if (index !== current || !visible || document.hidden) { video.pause(); return; }
      window.cancelAnimationFrame(progressFrame);
      progressFrame = window.requestAnimationFrame(updateProgress);
    });
    listen(video, "pause", () => { if (index === current) stopClocks(); });
  });
  listen(document, "visibilitychange", syncPlayback);
  listen(reducedMotion, "change", () => { pausedByUser = reducedMotion.matches; syncPlayback(); });
  const observer = new IntersectionObserver((entries) => {
    const entry = entries.find((entry) => entry.target === stage);
    if (!entry) return;
    visible = entry.isIntersecting;
    syncPlayback();
  }, { threshold: .25 });
  show(0);
  observer.observe(stage);
  return () => {
    observer.disconnect();
    cleanups.forEach((cleanup) => cleanup());
    stopClocks();
    slides.forEach((slide) => slide.querySelector<HTMLVideoElement>("video")?.pause());
  };
};
