const sections = [...document.querySelectorAll("[data-overview-section]")];
const body = document.body;
const themeMeta = document.querySelector('meta[name="theme-color"]');
const navigation = document.querySelector(".pitch-contents");
const tocSections = [...document.querySelectorAll("[data-toc-section]")];
let frame = 0;
let navigationIdleTimer;

const pauseNavigationIdleTimer = () => {
  window.clearTimeout(navigationIdleTimer);
  navigationIdleTimer = undefined;
  navigation.classList.remove("is-idle");
};
const keepNavigationVisible = () => {
  pauseNavigationIdleTimer();
  if (navigation.matches(":hover, :focus-within")) return;
  navigationIdleTimer = window.setTimeout(() => {
    if (!navigation.matches(":hover, :focus-within")) navigation.classList.add("is-idle");
  }, 1000);
};
navigation.querySelector(".project-tabs").addEventListener("mouseenter", pauseNavigationIdleTimer);
navigation.querySelector(".project-tabs").addEventListener("mouseleave", keepNavigationVisible);
navigation.addEventListener("focusin", pauseNavigationIdleTimer);
navigation.addEventListener("focusout", event => {
  if (!navigation.contains(event.relatedTarget)) keepNavigationVisible();
});
window.addEventListener("scroll", keepNavigationVisible, { passive: true });
keepNavigationVisible();

const updateTheme = () => {
  const marker = window.scrollY === 0 ? 0 : window.innerHeight / 2;
  let active = sections[0];
  // Keep a tall card grid active until the next section reaches the viewport centre.
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= marker) active = section;
    else break;
  }
  for (const link of tocSections) {
    const current = link.dataset.tocSection === active.id;
    link.classList.toggle("active", current);
    if (current) {
      link.setAttribute("aria-current", "location");
    } else link.removeAttribute("aria-current");
  }
  const theme = active.dataset.overviewSection;
  if (body.dataset.overviewTheme === theme) return;
  body.dataset.overviewTheme = theme;
  themeMeta.setAttribute("content", getComputedStyle(body).getPropertyValue("--overview-bg").trim());
};

const requestThemeUpdate = () => {
  if (frame) return;
  frame = window.requestAnimationFrame(() => {
    frame = 0;
    updateTheme();
  });
};

for (const event of ["scroll", "resize", "pageshow", "hashchange", "load"]) {
  window.addEventListener(event, requestThemeUpdate, { passive: true });
}
requestThemeUpdate();

const revealObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  }
}, { threshold: 0.1 });
document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 65}ms`;
  revealObserver.observe(element);
});

const menuButton = document.querySelector(".menu-button");
const menu = document.querySelector("#pitch-menu");
const setMenuOpen = open => {
  menuButton.setAttribute("aria-expanded", String(open));
  menu.classList.toggle("open", open);
  menu.setAttribute("aria-hidden", String(!open));
  menu.inert = !open;
  body.style.overflow = open ? "hidden" : "";
};
menuButton.addEventListener("click", () => setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true"));
menu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setMenuOpen(false)));
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    setMenuOpen(false);
  }
});
