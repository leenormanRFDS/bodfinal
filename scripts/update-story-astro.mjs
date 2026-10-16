import fs from 'fs';

let content = fs.readFileSync('src/pages/story.astro', 'utf8');

// The replacement script
const newScript = `<script>
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { StoryStateController } from '../lib/story-controller';
  import beatsData from '../../data/story-beats.json';
  
  gsap.registerPlugin(ScrollTrigger);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Blur-in reveals, triggered as each element reaches the centre
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((i) => i.setAttribute('data-shown', ''));
  } else {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.setAttribute('data-shown', ''); io.unobserve(e.target); } }),
      { rootMargin: '0px 0px -30% 0px', threshold: 0.1 }
    );
    items.forEach((i) => io.observe(i));
  }

  // Archival footage: swap the poster for the YouTube player only on click (fast first paint)
  const player = document.querySelector<HTMLButtonElement>('[data-yt]');
  if (player) {
    player.addEventListener('click', () => {
      const id = player.dataset.yt;
      const iframe = document.createElement('iframe');
      iframe.src = \`https://www.youtube-nocookie.com/embed/\${id}?autoplay=1&rel=0&modestbranding=1\`;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.title = 'Archival footage — the Bombing of Darwin';
      player.replaceWith(iframe);
    });
  }

  // The morning's clock + the 09:58 moment.
  const clock = document.querySelector<HTMLElement>('[data-clock]');
  const clockT = document.querySelector<HTMLElement>('[data-clock-t]');
  const flash = document.querySelector<HTMLElement>('[data-flash]');
  const smoke = document.querySelector<HTMLElement>('[data-smoke]');
  const events = Array.from(document.querySelectorAll<HTMLElement>('.tl__event'));

  if (clock && clockT && events.length) {
    const times = events.map((e) => e.querySelector('.tl__time')?.textContent?.trim() || '');
    const bombIdx = times.indexOf('09:58');

    // the live plot boards
    const livePlots = Array.from(document.querySelectorAll<HTMLElement>('[data-plot="live"]')).map((pl) => ({
      pl,
      marks: Array.from(pl.querySelectorAll<HTMLElement>('[data-ev]')),
      bearing: pl.querySelector<SVGPathElement>('[data-bearing]'),
      clockEl: pl.querySelector<HTMLElement>('.plot__d'),
      lost: pl.querySelector<HTMLElement>('[data-lost]'),
    }));

    if (reduce) livePlots.forEach(({ pl }) => pl.classList.add('plot--complete'));

    const bg = document.querySelector<HTMLElement>('[data-plotbg]');
    const pan = document.querySelector<HTMLElement>('[data-plotpan]');
    
    // Extract contacts array from the structured data
    const CONTACTS = beatsData.beats.map(beat => beat.spatial.plotCoordinate);

    let lastPan = -2;
    let flashed = false;

    const deskBoard = document.querySelector<HTMLElement>('.s-plotstick [data-plot="live"]');
    deskBoard?.querySelectorAll<SVGGElement>('[data-ev]').forEach((m) => {
      const i = Number(m.dataset.ev);
      const target = events[Math.min(i, events.length - 1)];
      if (!target) return;
      m.setAttribute('role', 'link');
      m.setAttribute('tabindex', '0');
      m.setAttribute('aria-label', \`Go to \${times[i] || ''} in the timeline\`);
      const go = () => {
        // Safe navigation relying on Lenis or native smooth scroll
        const targetRect = target.getBoundingClientRect();
        const y = targetRect.top + window.scrollY - window.innerHeight * 0.34;
        const lenis = (window as any).__lenis;
        if (lenis) lenis.scrollTo(y, { duration: 1.4 });
        else window.scrollTo({ top: y, behavior: 'smooth' });
      };
      m.addEventListener('click', go);
      m.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
    });

    const controller = new StoryStateController(beatsData.beats, events);
    
    controller.subscribe(({ activeIndex: cur, nearestDistance: nd, inTimeline: inTl }) => {
      clock.classList.toggle('is-on', inTl);

      if (cur >= 0 && clockT.textContent !== times[cur]) {
        clockT.textContent = times[cur];
        if (!reduce) clockT.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 500, easing: 'ease-out' });
        
        const t = times[cur] === 'Dusk' ? 'Dusk' : \`\${times[cur]} ACST\`;
        livePlots.forEach(({ clockEl }) => { if (clockEl) clockEl.textContent = t; });
      }

      const past958 = bombIdx >= 0 && cur >= bombIdx;
      if (past958 && !flashed) {
        flashed = true;
        if (!reduce && flash) flash.classList.add('is-flash');
      }
      smoke?.classList.toggle('is-on', past958);

      if (!reduce) {
        livePlots.forEach(({ pl, marks, bearing, lost }) => {
          marks.forEach((m) => m.classList.toggle('is-lit', cur >= Number(m.dataset.ev)));
          if (bearing) bearing.style.strokeDashoffset = String(cur >= 2 ? 0 : cur >= 1 ? 0.667 : cur >= 0 ? 0.88 : 1);
          lost?.classList.toggle('is-x', cur >= 6);
          pl.classList.toggle('is-dusk', cur >= 7);
        });
      }

      if (bg && pan && !reduce && window.innerWidth < 1100) {
        const focus = Math.min(1, Math.max(0, (nd - 0.22) / 0.55));
        bg.style.opacity = inTl ? String(0.24 + focus * 0.52) : '0';
        
        if (cur !== lastPan) {
          lastPan = cur;
          const c = cur >= 0 ? CONTACTS[Math.min(cur, CONTACTS.length - 1)] : null;
          if (!c) {
            pan.style.transform = 'none';
          } else {
            const s = pan.clientWidth / 600;
            const Z = 1.5;
            const px = (c[0] - 300) * s, py = (c[1] - 380) * s;
            pan.style.transform = \`translate(\${(-px * Z).toFixed(1)}px, \${(-py * Z).toFixed(1)}px) scale(\${Z})\`;
          }
        }
      } else if (bg) {
        bg.style.opacity = '0';
      }
    });
  }

  // The line draws itself as you descend the timeline
  const tl = document.querySelector('.tl');
  const progress = document.querySelector('.tl__progress');
  if (tl && progress && !reduce) {
    gsap.to(progress, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: { trigger: tl, start: 'top center', end: 'bottom center', scrub: 0.6 },
    });
  } else if (progress && reduce) {
    (progress as HTMLElement).style.transform = 'scaleY(1)';
  }
</script>`;

// Replace from `<script>` to `</script>`
content = content.replace(/<script>[\s\S]*<\/script>/, newScript);

fs.writeFileSync('src/pages/story.astro', content);
