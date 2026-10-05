document.documentElement.classList.add('js');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.primary-nav');
menuButton.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
}));
document.querySelector('#year').textContent = new Date().getFullYear();

const dialog = document.querySelector('#toolDialog');
const content = document.querySelector('#toolContent');
const toolText = {
  protection: `<span class="tool-label">QUICK ASSESSMENT</span><h2>What might you protect?</h2><p>Select the kind of asset you are thinking about. This general guide can help frame a conversation with an IP professional.</p><select id="assetSelect"><option value="">Choose an asset</option><option value="invention">A new product, process or technical idea</option><option value="brand">A business name, logo or product brand</option><option value="creative">Writing, music, artwork or software</option><option value="appearance">The visual appearance of a product</option></select><div id="assetResult" class="tool-result" hidden></div>`,
  brand: `<span class="tool-label">BRAND CHECKLIST</span><h2>Before you launch a name</h2><p>Some useful questions to consider before investing in a new brand:</p><ul><li>Have you checked for identical or similar marks in relevant markets?</li><li>Does the name distinguish your goods or services?</li><li>Have you checked relevant domains and social handles?</li><li>Who will own the mark and related brand assets?</li><li>Have you planned where and how you will use it?</li></ul><p>Availability and registrability need a proper search and legal assessment.</p>`,
  readiness: `<span class="tool-label">FOUNDER RESOURCE</span><h2>IP readiness, simplified</h2><p>Bring these points to an initial IP conversation:</p><ul><li>A short description of your products, technology or creative work.</li><li>Key dates for creation, disclosure, launch or planned publication.</li><li>Names of contributors, employees, contractors and collaborators.</li><li>Any existing agreements, filings or confidentiality arrangements.</li><li>The markets and business outcomes that matter most to you.</li></ul><p>Please do not share confidential material until appropriate arrangements are in place.</p>`
};
document.querySelectorAll('[data-tool]').forEach((button) => button.addEventListener('click', () => {
  content.innerHTML = toolText[button.dataset.tool];
  dialog.showModal();
  document.querySelector('#assetSelect')?.addEventListener('change', (event) => {
    const guidance = { invention: 'An invention may qualify for patent protection. Public disclosure can affect options, so speak with an IP professional before sharing details.', brand: 'A name or logo may be protectable as a trademark. A clearance search can help identify earlier marks and assess registrability.', creative: 'Original creative works may attract copyright protection. Ownership, permissions and any third-party material also matter.', appearance: 'A product’s visual features may be eligible for design protection. Filing timing and novelty requirements vary by jurisdiction.' };
    const result = document.querySelector('#assetResult');
    result.textContent = guidance[event.target.value] || '';
    result.hidden = !event.target.value;
  });
}));
document.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

document.querySelector('#listenQuote')?.addEventListener('click', (event) => {
  const button = event.currentTarget;
  if (!('speechSynthesis' in window)) { button.innerHTML = '<span>▶</span> Audio not available <small></small>'; return; }
  if (speechSynthesis.speaking) { speechSynthesis.cancel(); button.setAttribute('aria-pressed', 'false'); button.innerHTML = '<span>▶</span> Listen to the thought <small>01:08</small>'; return; }
  const utterance = new SpeechSynthesisUtterance('Jñānam paramam balam. Knowledge is the supreme strength. There is nothing more purifying than knowledge in this world. Bhagavad Gita, chapter four, verse thirty-eight.');
  utterance.rate = .88;
  utterance.onend = () => { button.setAttribute('aria-pressed', 'false'); button.innerHTML = '<span>▶</span> Listen to the thought <small>01:08</small>'; };
  button.setAttribute('aria-pressed', 'true'); button.innerHTML = '<span>Ⅱ</span> Playing thought <small>Tap to stop</small>';
  speechSynthesis.speak(utterance);
});

const form = document.querySelector('#contactForm');
const status = document.querySelector('#formStatus');
form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.className = 'form-status';
  status.textContent = 'Sending your enquiry…';
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.consent = formData.get('consent') === 'on';
  try {
    const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'We could not send your message. Please try again.');
    status.className = 'form-status success';
    status.textContent = result.message;
    form.reset();
  } catch (error) {
    status.textContent = error.message.includes('Failed to fetch') ? 'We could not reach the server. Please use the email address on this page instead.' : error.message;
  }
});

document.querySelectorAll('.dd-toggle').forEach((b) => b.addEventListener('click', () => { const o = b.parentElement.classList.toggle('open'); b.setAttribute('aria-expanded', String(o)); }));
document.addEventListener('click', (e) => document.querySelectorAll('.dd-wrap.open').forEach((w) => { if (!w.contains(e.target)) w.classList.remove('open'); }));
const header = document.querySelector('.site-header');
addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 30), { passive: true });
const show = (el) => el.classList.add('in');
const reveal = 'IntersectionObserver' in window ? new IntersectionObserver((list) => list.forEach((x) => { if (x.isIntersecting) { show(x.target); reveal.unobserve(x.target); } }), { threshold: .12 }) : null;
document.querySelectorAll('.reveal').forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 90}ms`; reveal ? reveal.observe(el) : show(el); });
const counter = 'IntersectionObserver' in window ? new IntersectionObserver((list) => list.forEach((x) => {
  if (!x.isIntersecting) return; counter.unobserve(x.target);
  const end = Number(x.target.dataset.count); const t0 = performance.now();
  const tick = (t) => { const p = Math.min((t - t0) / 1600, 1); x.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}), { threshold: .5 }) : null;
document.querySelectorAll('[data-count]').forEach((el) => counter ? counter.observe(el) : (el.textContent = el.dataset.count));
