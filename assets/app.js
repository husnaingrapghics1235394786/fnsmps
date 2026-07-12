/* =====================================================================
   Father & Sons Manpower Supply — Shared app script
   - One-time shell init (preloader, nav, lang, mobile menu, router)
   - Per-page init (reveals, parallax, stats, lightbox, video, marquee)
     re-runs after every SPA navigation via initPage()
   ===================================================================== */

/* ---------- Smooth scroll (Lenis) ---------- */
const lenis = new Lenis({ duration:1.2, smoothWheel:true, touchMultiplier:2, infinite:false });
function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

gsap.registerPlugin(ScrollTrigger);
lenis.on('scroll', ScrollTrigger.update);

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* client logos — shared across home + any page that shows the marquee */
const clientLogos = [
  {src:'logos/avrasya.jpg',            alt:'Avrasya Consulting'},
  {src:'logos/safir.jpg',             alt:'Safir Danışmanlık'},
  {src:'logos/celikler.jpg',          alt:'Çelikler Holding'},
  {src:'logos/xcmg.jpg',              alt:'XCMG'},
  {src:'logos/al-zayed.jpg',          alt:'Al Zayed Shades & Tents Industries'},
  {src:'logos/surbana-jurong.jpg',    alt:'Surbana Jurong'},
  {src:'https://fnsms.com/wp-content/uploads/2020/08/mazoon.jpg', alt:'Mazoon'},
  {src:'logos/al-bustan.jpg',         alt:'Al Bustan Constructions'},
  {src:'logos/stevin-rock.jpg',       alt:'Stevin Rock'},
  {src:'logos/national-emirates.jpg', alt:'National Emirates — UAE'},
  {src:'logos/hamdan.jpg',            alt:'Hamdan Trading Group LLC'},
  {src:'logos/mid-contracting.jpg',   alt:'MID Contracting'},
  {src:'logos/areco.jpg',             alt:'Arabian Rock Engineering Co.'},
  {src:'logos/al-nawasi.jpg',         alt:'Al-Nawasi General Trading & Contracting Co.'},
  {src:'logos/halwan-crusher.jpg',    alt:'Halwan Crusher Est.'},
  {src:'logos/technical-services.jpg',alt:'Technical Services & Rock Blasting Co. (LLC)'},
  {src:'logos/aurco.jpg',             alt:'Attiqur Rehman Cont. Co. (AURCO)'},
  {src:'logos/al-ajlan.jpg',          alt:'Abdullah M. Al-Ajlan Est.'},
  {src:'logos/al-mardoof.jpg',        alt:'Al-Mardoof Contracting Company'}
];

/* track ScrollTriggers created for the current page so we can tear them down */
let pageTriggers = [];
function clearPageTriggers(){
  pageTriggers.forEach(t => t && t.kill && t.kill());
  pageTriggers = [];
}

/* =====================================================================
   PER-PAGE INIT — safe to call repeatedly (after each navigation)
   ===================================================================== */
function initPage(){
  clearPageTriggers();

  /* ---- Marquee (build if present) ---- */
  const track = document.getElementById('marqueeTrack');
  if(track && !track.dataset.built){
    const buildSet = () => clientLogos.map(c =>
      `<div class="client-card"><img src="${c.src}" alt="${c.alt}" loading="lazy"></div>`).join('');
    track.innerHTML = buildSet() + buildSet();
    track.dataset.built = '1';
  }

  /* ---- Generic reveal-up ---- */
  document.querySelectorAll('.reveal-up').forEach(el => {
    if(el.dataset.revealed) return;
    const st = gsap.fromTo(el, {opacity:0, y:40}, {
      opacity:1, y:0, duration:1, ease:'power3.out',
      scrollTrigger:{trigger:el, start:'top 88%', toggleActions:'play none none reverse'}
    }).scrollTrigger;
    pageTriggers.push(st);
    el.dataset.revealed = '1';
  });

  /* ---- Industry stagger ---- */
  gsap.utils.toArray('.industry-card').forEach((card, i) => {
    const st = gsap.fromTo(card, {opacity:0, y:30}, {
      opacity:1, y:0, duration:.7, delay:(i%3)*0.06, ease:'power3.out',
      scrollTrigger:{trigger:card, start:'top 92%'}
    }).scrollTrigger;
    pageTriggers.push(st);
  });

  /* ---- Why-card stagger ---- */
  gsap.utils.toArray('.why-card').forEach((card, i) => {
    const st = gsap.fromTo(card, {opacity:0, y:24}, {
      opacity:1, y:0, duration:.6, delay:(i%4)*0.08, ease:'power3.out',
      scrollTrigger:{trigger:card, start:'top 94%'}
    }).scrollTrigger;
    pageTriggers.push(st);
  });

  /* ---- Stats count-up ---- */
  document.querySelectorAll('.stats-row .num').forEach(el => {
    const text = el.textContent.trim();
    const match = text.match(/[\d.]+/);
    if(!match) return;
    const target = parseFloat(match[0]);
    const suffixEl = el.querySelector('.plus');
    const suffix = suffixEl ? suffixEl.textContent : '';
    const prefix = text.replace(match[0],'').replace(suffix,'');
    if(isNaN(target)) return;
    const st = ScrollTrigger.create({
      trigger:el, start:'top 90%', once:true,
      onEnter:() => {
        let obj={val:0};
        gsap.to(obj, {val:target, duration:1.6, ease:'power2.out',
          onUpdate:() => { el.childNodes[0].nodeValue = prefix + Math.round(obj.val); }});
      }
    });
    pageTriggers.push(st);
  });

  /* ---- Parallax (skip if reduced motion) ---- */
  if(!REDUCED){
    gsap.utils.toArray('.it-frame img').forEach(img => {
      const st = gsap.fromTo(img, {yPercent:-9}, {
        yPercent:9, ease:'none',
        scrollTrigger:{trigger:img.closest('.it-frame'), start:'top bottom', end:'bottom top', scrub:true}
      }).scrollTrigger;
      pageTriggers.push(st);
    });
    const poster = document.querySelector('.video-frame .video-poster');
    if(poster){
      const st = gsap.fromTo(poster, {yPercent:-7}, {
        yPercent:7, ease:'none',
        scrollTrigger:{trigger:'#videoFrame', start:'top bottom', end:'bottom top', scrub:true}
      }).scrollTrigger;
      pageTriggers.push(st);
    }
    const heroBg = document.querySelector('#hero .bg-img');
    if(heroBg){
      const st = gsap.to(heroBg, {yPercent:8, ease:'none',
        scrollTrigger:{trigger:'#hero', start:'top top', end:'bottom top', scrub:true}}).scrollTrigger;
      pageTriggers.push(st);
    }
  }

  /* ---- Video facade ---- */
  initVideo();
  /* ---- Media lightbox ---- */
  initLightbox();
  /* ---- Contact form (if present) ---- */
  initContactForm();
  /* ---- Job-seeker application form (if present) ---- */
  initApplyForm();
  /* ---- Magnetic buttons ---- */
  initMagnetic();
  /* ---- FAQ accordion ---- */
  initFaq();

  /* ---- mark active nav link ---- */
  markCurrentNav();

  ScrollTrigger.refresh();
}

/* ---- Hero intro (home only) ---- */
function playHeroIntro(){
  const heroTitle = document.querySelector('.hero-title .line > span');
  if(!heroTitle) return;
  gsap.set('.hero-title .line > span', {yPercent:110});
  gsap.set('.hero-eyebrow', {opacity:0, x:-16});
  gsap.set('.hero-sub, .hero-actions', {opacity:0, y:24});
  gsap.set('.hero-stats .stat', {opacity:0, x:20});
  gsap.set('.scroll-cue', {opacity:0});
  const tl = gsap.timeline({defaults:{ease:'power4.out'}});
  tl.to('.hero-eyebrow', {opacity:1, x:0, duration:.7})
    .to('.hero-title .line > span', {yPercent:0, duration:1.1, stagger:0.12}, '-=0.4')
    .to('.hero-sub, .hero-actions', {opacity:1, y:0, duration:.8, stagger:0.1}, '-=0.5')
    .to('.hero-stats .stat', {opacity:1, x:0, duration:.7, stagger:0.12}, '-=0.6')
    .to('.scroll-cue', {opacity:1, duration:.6}, '-=0.3')
    .fromTo('.bg-img', {scale:1.5}, {scale:1.16, duration:2.4, ease:'power2.out'}, 0);
}

/* ---------- Video facade ---------- */
function initVideo(){
  const videoFrame = document.getElementById('videoFrame');
  if(!videoFrame || videoFrame.dataset.wired) return;
  videoFrame.dataset.wired = '1';
  const videoPlay = document.getElementById('videoPlay');
  const videoPoster = document.getElementById('videoPoster');
  const ytId = videoFrame.getAttribute('data-yt');
  if(videoPoster){
    videoPoster.addEventListener('error', () => {
      videoPoster.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }, {once:true});
  }
  function loadYouTube(){
    if(videoFrame.querySelector('iframe')) return;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.setAttribute('allowfullscreen','');
    iframe.title = 'Father & Sons Manpower Supply — Company Introduction';
    videoFrame.appendChild(iframe);
    if(videoPlay){ videoPlay.style.opacity = 0; videoPlay.style.pointerEvents = 'none'; }
  }
  if(videoPlay) videoPlay.addEventListener('click', loadYouTube);
  if(videoPoster) videoPoster.addEventListener('click', loadYouTube);
  if(!REDUCED){
    const st = gsap.fromTo('#videoFrame', {scale:0.92, opacity:0}, {
      scale:1, opacity:1, duration:1.1, ease:'power3.out',
      scrollTrigger:{trigger:'#videoFrame', start:'top 85%'}
    }).scrollTrigger;
    pageTriggers.push(st);
  }
}

/* ---------- Media lightbox ---------- */
const lightbox = document.getElementById('lightbox');
function openLightbox(item){
  document.getElementById('lbImg').src = item.getAttribute('data-img');
  document.getElementById('lbImg').alt = item.getAttribute('data-title') || '';
  document.getElementById('lbCat').textContent = item.getAttribute('data-cat') || '';
  document.getElementById('lbTitle').textContent = item.getAttribute('data-title') || '';
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox(){
  if(!lightbox) return;
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}
function initLightbox(){
  if(!lightbox) return;
  document.querySelectorAll('.media-item').forEach(item => {
    if(item.dataset.wired) return;
    item.dataset.wired = '1';
    item.addEventListener('click', () => openLightbox(item));
  });
}
if(lightbox){
  document.getElementById('lbClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if(e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeLightbox(); });
}

/* ---------- Contact form (mailto handoff, no backend) ---------- */
function initContactForm(){
  const form = document.getElementById('contactForm');
  if(!form || form.dataset.wired) return;
  form.dataset.wired = '1';
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form);
    const name = encodeURIComponent(d.get('name') || '');
    const company = encodeURIComponent(d.get('company') || '');
    const trade = encodeURIComponent(d.get('trade') || '');
    const headcount = encodeURIComponent(d.get('headcount') || '');
    const msg = encodeURIComponent(d.get('message') || '');
    const body = `Name: ${decodeURIComponent(name)}%0D%0ACompany: ${decodeURIComponent(company)}%0D%0ATrade: ${decodeURIComponent(trade)}%0D%0AHeadcount: ${decodeURIComponent(headcount)}%0D%0A%0D%0A${decodeURIComponent(msg)}`;
    window.location.href = `mailto:info@fnsms.com?subject=Manpower Request — ${decodeURIComponent(company)}&body=${body}`;
  });
}

/* ---------- Job-seeker application form (Resend via api/apply.php) ---------- */
const APPLY_ENDPOINT = 'api/apply.php';
const CV_MAX_BYTES = 5 * 1024 * 1024;               // 5 MB
const CV_ALLOWED = ['.pdf', '.doc', '.docx'];

function initApplyForm(){
  const form = document.getElementById('applyForm');
  if(!form || form.dataset.wired) return;
  form.dataset.wired = '1';

  const drop     = document.getElementById('cvDrop');
  const fileIn   = document.getElementById('a-cv');
  const cvTitle  = document.getElementById('cvTitle');
  const cvSub    = document.getElementById('cvSub');
  const status   = document.getElementById('applyStatus');
  const submit   = document.getElementById('applySubmit');
  const btnLabel = submit ? submit.querySelector('.btn-label') : null;

  const fmtSize = b => b < 1024*1024 ? (b/1024).toFixed(0)+' KB' : (b/1024/1024).toFixed(1)+' MB';
  const extOf   = n => { const i = n.lastIndexOf('.'); return i < 0 ? '' : n.slice(i).toLowerCase(); };

  function showStatus(type, msg){
    if(!status) return;
    status.className = 'form-status show ' + type;
    status.textContent = msg;
  }

  function reflectFile(){
    const f = fileIn.files[0];
    if(!f){ drop.classList.remove('has-file'); cvTitle.textContent = 'Click to upload or drag your CV here'; cvSub.textContent = 'No file selected'; return; }
    drop.classList.add('has-file');
    cvTitle.textContent = 'CV attached';
    cvSub.textContent = `${f.name} · ${fmtSize(f.size)}`;
  }
  fileIn.addEventListener('change', reflectFile);

  /* drag & drop */
  ['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('dragover'); }));
  ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('dragover'); }));
  drop.addEventListener('drop', e => {
    if(e.dataTransfer && e.dataTransfer.files.length){ fileIn.files = e.dataTransfer.files; reflectFile(); }
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    /* client-side validation */
    const name  = form.name.value.trim();
    const email = form.email.value.trim();
    const file  = fileIn.files[0];

    if(!name || !email){ showStatus('error', 'Please enter your name and email.'); return; }
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ showStatus('error', 'Please enter a valid email address.'); return; }
    if(!file){ showStatus('error', 'Please attach your CV (PDF, DOC or DOCX).'); return; }
    if(!CV_ALLOWED.includes(extOf(file.name))){ showStatus('error', 'CV must be a PDF, DOC or DOCX file.'); return; }
    if(file.size > CV_MAX_BYTES){ showStatus('error', `CV is too large (${fmtSize(file.size)}). Maximum is 5 MB.`); return; }

    /* submit */
    const data = new FormData(form);
    submit.classList.add('is-loading');
    if(btnLabel) btnLabel.textContent = 'Sending…';
    showStatus('loading', 'Uploading your application…');

    try{
      const res = await fetch(APPLY_ENDPOINT, { method:'POST', body:data });
      let payload = {};
      try{ payload = await res.json(); }catch(_){}
      if(res.ok && payload.ok){
        form.reset(); reflectFile();
        showStatus('success', payload.message || 'Application sent! Our recruitment team will be in touch.');
        if(btnLabel) btnLabel.textContent = 'Submitted';
      }else{
        showStatus('error', payload.error || 'Something went wrong sending your application. Please email info@fnsms.com directly.');
        if(btnLabel) btnLabel.textContent = 'Submit Application';
      }
    }catch(err){
      showStatus('error', 'Network error — please check your connection or email info@fnsms.com directly.');
      if(btnLabel) btnLabel.textContent = 'Submit Application';
    }finally{
      submit.classList.remove('is-loading');
    }
  });
}

/* ---------- Magnetic buttons ---------- */
function initMagnetic(){
  if(!window.matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll('.btn-solid, .btn-dark').forEach(btn => {
    if(btn.dataset.mag) return;
    btn.dataset.mag = '1';
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, {x:(e.clientX-r.left-r.width/2)*0.25, y:(e.clientY-r.top-r.height/2)*0.35, duration:.4, ease:'power2.out'});
    });
    btn.addEventListener('mouseleave', () => gsap.to(btn, {x:0, y:0, duration:.5, ease:'elastic.out(1,0.4)'}));
  });
}

/* ---------- FAQ accordion ---------- */
function initFaq(){
  document.querySelectorAll('.faq').forEach(faq => {
    if(faq.dataset.wired) return;
    faq.dataset.wired = '1';
    const btn = faq.querySelector('.faq-q');
    const ans = faq.querySelector('.faq-a');
    btn.addEventListener('click', () => {
      const open = faq.classList.toggle('open');
      ans.style.maxHeight = open ? ans.scrollHeight + 'px' : '0';
    });
  });
}

/* =====================================================================
   SHELL — one-time
   ===================================================================== */

/* ---- Preloader (first load only) ---- */
function runPreloader(done){
  const pre = document.getElementById('preloader');
  if(!pre){ done(); return; }
  const bar = pre.querySelector('.pl-bar');
  const count = pre.querySelector('.pl-count');
  let obj = {val:0};
  gsap.to(obj, {val:100, duration:1.9, ease:'power2.inOut',
    onUpdate:() => { bar.style.width = obj.val + '%'; count.textContent = Math.round(obj.val); },
    onComplete:() => {
      const tl = gsap.timeline({onComplete:done});
      tl.to('#preloader .pl-stage, #preloader .pl-name, #preloader .pl-bar-wrap, #preloader .pl-count, #preloader .pl-tag',
            {opacity:0, y:-16, duration:.5, ease:'power2.in', stagger:0.04})
        .to('#preloader', {yPercent:-100, duration:.9, ease:'power4.inOut'}, '-=0.1')
        .set('#preloader', {display:'none'});
    }
  });
}

/* ---- Nav solid on scroll ---- */
const siteHeader = document.getElementById('site-header');
ScrollTrigger.create({
  start:0, end:99999,
  onUpdate:self => {
    const scrolled = self.scroll() > 60;
    siteHeader.classList.toggle('solid', scrolled);
    siteHeader.classList.toggle('hide-topbar', scrolled);
  }
});

/* ---- Mobile menu ---- */
const burgerBtn = document.getElementById('burgerBtn');
if(burgerBtn) burgerBtn.addEventListener('click', () => document.body.classList.toggle('menu-open'));
const mmClose = document.getElementById('mmClose');
if(mmClose) mmClose.addEventListener('click', () => document.body.classList.remove('menu-open'));

/* ---- Language switcher ---- */
const I18N = {
  en:{
    'topbar.license':'Approved by Government of Pakistan — License No. OP&HRD/4325/LHR/2018',
    'topbar.location':'Faisalabad, Punjab, Pakistan',
    'nav.about':'About Us','nav.services':'Services','nav.industries':'Industries','nav.careers':'Careers','nav.media':'Media Center','nav.downloads':'Downloads','nav.contact':'Contact',
    'cta.request':'Request Manpower','cta.apply':'Apply Now'
  },
  ur:{
    'topbar.license':'حکومتِ پاکستان سے منظور شدہ — لائسنس نمبر OP&HRD/4325/LHR/2018',
    'topbar.location':'فیصل آباد، پنجاب، پاکستان',
    'nav.about':'ہمارے بارے میں','nav.services':'خدمات','nav.industries':'صنعتیں','nav.careers':'ملازمتیں','nav.media':'میڈیا سینٹر','nav.downloads':'ڈاؤن لوڈز','nav.contact':'رابطہ',
    'cta.request':'افرادی قوت طلب کریں','cta.apply':'درخواست دیں'
  },
  ar:{
    'topbar.license':'معتمد من حكومة باكستان — رقم الترخيص OP&HRD/4325/LHR/2018',
    'topbar.location':'فيصل آباد، البنجاب، باكستان',
    'nav.about':'من نحن','nav.services':'الخدمات','nav.industries':'الصناعات','nav.careers':'الوظائف','nav.media':'المركز الإعلامي','nav.downloads':'التنزيلات','nav.contact':'اتصل بنا',
    'cta.request':'اطلب قوى عاملة','cta.apply':'قدّم الآن'
  }
};
const LANG_LABEL = {en:'EN', ur:'اردو', ar:'العربية'};
function applyLang(lang){
  const dict = I18N[lang] || I18N.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if(dict[key] != null) el.innerHTML = dict[key];
  });
  const rtl = (lang === 'ur' || lang === 'ar');
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
  const label = document.getElementById('langLabel');
  if(label) label.textContent = LANG_LABEL[lang];
  document.querySelectorAll('#langMenu button').forEach(b =>
    b.classList.toggle('active', b.getAttribute('data-lang') === lang));
  try{ localStorage.setItem('fns_lang', lang); }catch(e){}
}
const langSwitch = document.getElementById('langSwitch');
if(langSwitch){
  document.getElementById('langBtn').addEventListener('click', e => {
    e.stopPropagation();
    const open = langSwitch.classList.toggle('open');
    document.getElementById('langBtn').setAttribute('aria-expanded', open);
  });
  document.querySelectorAll('#langMenu button').forEach(b => {
    b.addEventListener('click', () => { applyLang(b.getAttribute('data-lang')); langSwitch.classList.remove('open'); });
  });
  document.addEventListener('click', () => langSwitch.classList.remove('open'));
}
let savedLang = 'en';
try{ savedLang = localStorage.getItem('fns_lang') || 'en'; }catch(e){}
applyLang(savedLang);

/* ---- highlight the nav link for the current page ---- */
function markCurrentNav(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a[data-route]').forEach(a => {
    const route = a.getAttribute('href').split('/').pop();
    a.classList.toggle('current', route === path || (path === '' && route === 'index.html'));
  });
}

/* =====================================================================
   SPA ROUTER — real pages, fetched & swapped with a transition.
   Falls back to normal navigation on any error or for external links.
   ===================================================================== */
const pageCache = new Map();

function isInternal(a){
  if(!a) return false;
  if(a.target === '_blank' || a.hasAttribute('download')) return false;
  const href = a.getAttribute('href');
  if(!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  const url = new URL(a.href, location.href);
  if(url.origin !== location.origin) return false;
  return /\.html$/.test(url.pathname) || url.pathname.endsWith('/');
}

async function fetchPage(url){
  if(pageCache.has(url)) return pageCache.get(url);
  const res = await fetch(url, {headers:{'X-Requested-With':'spa'}});
  if(!res.ok) throw new Error('HTTP '+res.status);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  pageCache.set(url, doc);
  return doc;
}

function swapHead(doc){
  document.title = doc.title;
  const copy = (sel, attr) => {
    const from = doc.querySelector(sel);
    let to = document.querySelector(sel);
    if(from){
      if(!to){ to = from.cloneNode(true); document.head.appendChild(to); }
      else to.setAttribute(attr, from.getAttribute(attr));
    }
  };
  copy('meta[name="description"]','content');
  copy('meta[property="og:title"]','content');
  copy('meta[property="og:description"]','content');
  copy('meta[property="og:url"]','content');
  copy('link[rel="canonical"]','href');
}

let navigating = false;
async function navigateTo(url, push=true){
  if(navigating) return;
  const current = location.href;
  if(new URL(url, location.href).href === current) return;
  navigating = true;
  document.body.classList.remove('menu-open');

  try{
    const doc = await fetchPage(url);
    const newMain = doc.querySelector('main');
    if(!newMain){ window.location.href = url; return; }

    /* 1. cover — wait until the curtain has FULLY filled the viewport
          (CSS cover transition is .5s) before we touch the DOM, so the
          swap never shows through at the top of the screen */
    if(!REDUCED){
      document.body.classList.add('pt-cover');
      await wait(520);
    }

    /* 2. swap main + head while hidden behind the curtain */
    const oldMain = document.querySelector('main');
    ScrollTrigger.getAll().forEach(t => { if(pageTriggers.includes(t)) t.kill(); });
    oldMain.replaceWith(newMain);
    swapHead(doc);
    if(push) history.pushState({url}, '', url);

    /* reset scroll immediately, behind the curtain (Lenis-aware) */
    lenis.scrollTo(0, {immediate:true});
    window.scrollTo(0,0);

    /* re-init page behaviors for the new content */
    initPage();
    newMain.classList.add('pt-in');
    /* hero intro if we landed on home (no-op elsewhere) */
    playHeroIntro();

    /* 3. reveal — lift the curtain off the top on the next frame.
          Removing pt-cover and adding pt-reveal in the same tick makes the
          curtain glide 0 → -100% with no intermediate jump. */
    if(!REDUCED){
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          document.body.classList.remove('pt-cover');
          document.body.classList.add('pt-reveal');
          setTimeout(() => {
            document.body.classList.remove('pt-reveal');
            newMain.classList.remove('pt-in');
            resolve();
          }, 650);
        });
      });
    }else{
      newMain.classList.remove('pt-in');
    }
  }catch(err){
    document.body.classList.remove('pt-cover','pt-reveal');
    window.location.href = url; return;
  }finally{
    navigating = false;
  }
}
const wait = ms => new Promise(r => setTimeout(r, ms));

/* intercept internal link clicks */
document.addEventListener('click', e => {
  if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a');
  if(!isInternal(a)) return;
  e.preventDefault();
  navigateTo(a.href, true);
});
window.addEventListener('popstate', () => navigateTo(location.href, false));

/* =====================================================================
   BOOT
   ===================================================================== */
window.addEventListener('load', () => {
  runPreloader(() => { playHeroIntro(); });
  initPage();
});
