export const ballMazeSectionColors = {
  "ball-maze-hero": "#45aea4",
  play: "#073f42",
  worlds: "#32958d",
  balls: "#f7f0d8",
  modes: "#073f42",
  build: "#f6e775",
  records: "#052d30",
  steam: "#45aea4",
} as const;

export const initialBallMazeSection = (hash: string) => {
  const id = hash.replace(/^#/, "");
  return Object.hasOwn(ballMazeSectionColors, id) ? id : "ball-maze-hero";
};

// Use the viewport centre, as on the studio home. Containment also handles
// the much taller ball gallery without switching halfway through its content.
export const currentBallMazeSection = <T extends { getBoundingClientRect(): { top: number; bottom: number } }>(sections: T[], viewportHeight: number) => {
  const marker = viewportHeight / 2;
  const candidates = sections.map((section) => ({ section, bounds: section.getBoundingClientRect() }));
  return candidates.find(({ bounds }) => bounds.top <= marker && bounds.bottom > marker)?.section
    ?? candidates.reduce<{ section: T; distance: number } | undefined>((closest, { section, bounds }) => {
      const distance = Math.min(Math.abs(bounds.top - marker), Math.abs(bounds.bottom - marker));
      return !closest || distance < closest.distance ? { section, distance } : closest;
    }, undefined)?.section;
};

export const setupBallMazeSections = () => {
  const sections = [...document.querySelectorAll<HTMLElement>(".ball-maze-page main > section")];
  const nav = document.querySelector<HTMLElement>(".bm-side-nav");
  const links = [...document.querySelectorAll<HTMLAnchorElement>(".bm-side-nav a")];
  const body = document.body;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  let frame = 0;
  let readyFrame = 0;

  const applySection = (id: string) => {
    if (!Object.hasOwn(ballMazeSectionColors, id)) return;
    body.dataset.bmSection = id;
    if (nav) nav.dataset.section = id;
    links.forEach((link) => {
      const active = link.hash === `#${id}`;
      link.classList.toggle("is-current", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    themeMeta?.setAttribute("content", ballMazeSectionColors[id as keyof typeof ballMazeSectionColors]);
  };
  const update = () => {
    const section = currentBallMazeSection(sections, window.innerHeight);
    if (section && (section.id !== body.dataset.bmSection || section.id !== nav?.dataset.section)) applySection(section.id);
  };
  const requestUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      update();
      // Paint the restored/deep-linked position before enabling colour easing.
      if (!body.hasAttribute("data-bm-theme-ready") && !readyFrame) {
        readyFrame = window.requestAnimationFrame(() => {
          readyFrame = 0;
          body.dataset.bmThemeReady = "true";
        });
      }
    });
  };

  body.removeAttribute("data-bm-theme-ready");
  applySection(initialBallMazeSection(window.location.hash));
  const events = ["scroll", "resize", "pageshow", "hashchange", "load"] as const;
  events.forEach((event) => window.addEventListener(event, requestUpdate, { passive: true }));
  const observer = new ResizeObserver(requestUpdate);
  sections.forEach((section) => observer.observe(section));
  requestUpdate();

  return () => {
    events.forEach((event) => window.removeEventListener(event, requestUpdate));
    observer.disconnect();
    window.cancelAnimationFrame(frame);
    window.cancelAnimationFrame(readyFrame);
  };
};
