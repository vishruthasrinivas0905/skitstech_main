/* Brandt-style motion: image reveals, text rise, hero parallax, nav border on scroll. */
(() => {
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const up = document.querySelectorAll('main h1, main h2, .display-heading, .lead, .section-kicker, .counter-grid>*, .cta-band .button');
  const imgs = document.querySelectorAll('main .photo-trio img, main .news-card img, main .profile-photo, main .photo, main .figure img');
  up.forEach((el) => { if (!el.classList.contains('reveal')) el.classList.add('bt-up'); });
  imgs.forEach((el) => el.classList.add('bt-img'));
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((l) => l.forEach((x) => {
    if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); }
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' }) : null;
  // Text blocks observe themselves. Images are clipped until revealed, and a fully clipped element never
  // reports as intersecting (so it would stay hidden forever) - observe the image's parent and reveal the image.
  const imgIo = 'IntersectionObserver' in window ? new IntersectionObserver((l) => l.forEach((x) => {
    if (x.isIntersecting) { x.target.querySelectorAll(':scope > .bt-img').forEach((i) => i.classList.add('in')); imgIo.unobserve(x.target); }
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' }) : null;
  document.querySelectorAll('.bt-up').forEach((el) => io ? io.observe(el) : el.classList.add('in'));
  document.querySelectorAll('.bt-img').forEach((el) => imgIo && el.parentElement ? imgIo.observe(el.parentElement) : el.classList.add('in'));
  // Failsafe: never leave an image hidden if the observer does not fire.
  setTimeout(() => document.querySelectorAll('.bt-img:not(.in)').forEach((el) => {
    const r = el.parentElement.getBoundingClientRect();
    if (r.top < innerHeight * 1.5) el.classList.add('in');
  }), 2500);
  if (rm) return;
  const bg = document.querySelector('.hero-bg');
  const hdr = document.querySelector('.site-header');
  let t = false;
  addEventListener('scroll', () => {
    if (t) return; t = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      if (bg && y < innerHeight * 1.2) bg.style.translate = `0 ${y * .25}px`;
      if (hdr) hdr.style.borderBottomColor = y > 20 ? 'var(--main-color-4)' : 'transparent';
      t = false;
    });
  }, { passive: true });
})();
