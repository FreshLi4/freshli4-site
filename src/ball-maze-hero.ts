/** One source for the studio-home feature and the Ball Maze landing hero. */
type Copy = { zh: string; en: string; ja: string };
const copy = (zh: string, en: string, ja: string): Copy => ({ zh, en, ja });

export const ballMazeHero = {
  kicker: "PROJECT 02 / PHYSICS PUZZLE",
  logo: "logo.png",
  logoAlt: "Ball Maze 迷宫球",
  title: copy("旋转世界，<br /><em>让重力带路。</em>", "Turn the world.<br /><em>Let gravity lead.</em>", "世界を回して、<br /><em>重力に導かれる。</em>"),
  description: copy("你不直接控制小球。你旋转整座三维迷宫，让重力与惯性替你寻找下一条路。", "You do not steer the ball directly. Rotate the whole 3D maze and let gravity and momentum find the next route.", "ボールを直接操るのではなく、立体迷路全体を回して重力と慣性に次の道を探させます。"),
  autoplay: copy("自动轮播", "AUTO PLAY", "自動再生"),
  clips: [
    { id: "editor", label: copy("编辑器", "EDITOR", "エディター") },
    { id: "tracks", label: copy("特殊轨道", "SPECIAL RAILS", "特殊レール") },
    { id: "abilities", label: copy("小球能力", "BALL ABILITIES", "ボールの能力") },
  ],
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);

export const renderBallMazeHeroSlide = (clip: typeof ballMazeHero.clips[number], index: number, visual: (file: string) => string) =>
  `<div class="media-slide${index === 0 ? " active" : ""}" data-slide="${index}" data-clip="${clip.id}"><video data-bm-carousel-video data-bm-recording="${clip.id}" muted playsinline controls preload="${index === 0 ? "metadata" : "none"}" poster="${escapeHtml(visual(`latest/${clip.id}.webp`))}" aria-label="${escapeHtml(clip.label.zh)}教程实机录屏"><source src="${escapeHtml(visual(`latest/${clip.id}.mp4`))}" type="video/mp4" /></video></div>`;
