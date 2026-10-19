/* =========================================================
   Ransiri Grand — interactions & motion
   ========================================================= */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const G = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const pad = (n) => String(n).padStart(2, "0");
  $(".js-year").textContent = new Date().getFullYear();
  const progressBar = $(".progress span");

  // ---------- smooth scroll ----------
  let lenis = null;
  if (G) gsap.registerPlugin(ScrollTrigger);
  if (G && !reduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }
  const goTo = (target) => {
    const el = typeof target === "string" ? $(target) : target;
    if (lenis) lenis.scrollTo(el, { offset: -20, duration: 1.4 });
    else (el || document.body).scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  };
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2 || !$(id)) return;
    e.preventDefault();
    closeDock();
    goTo(id === "#top" ? document.body : id);
  }));

  // ---------- floating dock ----------
  const dock = $(".dock"), dockBtn = $(".dock-btn"), dockMenu = $("#dockMenu");
  function closeDock() { dock.classList.remove("is-open"); dockBtn.setAttribute("aria-expanded", "false"); dockMenu.setAttribute("aria-hidden", "true"); $(".dock-lbl").textContent = "Menu"; }
  dockBtn.addEventListener("click", () => {
    const open = !dock.classList.contains("is-open");
    dock.classList.toggle("is-open", open);
    dockBtn.setAttribute("aria-expanded", String(open));
    dockMenu.setAttribute("aria-hidden", String(!open));
    $(".dock-lbl").textContent = open ? "Close" : "Menu";
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape") { closeDock(); closeLB(); } });
  document.addEventListener("click", (e) => { if (!dock.contains(e.target)) closeDock(); });
  const pct = $(".js-pct");
  const spyLinks = $$(".dock-menu > a");
  const spyTargets = spyLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  let spyAt = -1;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = Math.min(1, Math.max(0, scrollY / (max || 1)));
    pct.textContent = Math.round(p * 100);
    if (progressBar) progressBar.style.transform = `scaleX(${p})`;
    const away = scrollY < innerHeight * 0.55;
    dock.classList.toggle("is-away", away);
    if (away) closeDock();
    const line = scrollY + innerHeight * 0.38;
    let next = -1;
    spyTargets.forEach((el, i) => { if (el.offsetTop <= line) next = i; });
    if (next !== spyAt) {
      spyAt = next;
      spyLinks.forEach((a, i) => a.classList.toggle("is-active", i === next));
    }
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // ---------- cinematic video ----------
  const heroVid = $(".hero-video");
  if (heroVid && !reduced) {
    const mark = () => heroVid.classList.add("is-on");
    heroVid.addEventListener("playing", mark);
    if (!heroVid.paused && heroVid.readyState > 2) mark();
    const heroIO = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) heroVid.play().then(mark).catch(() => {});
      else heroVid.pause();
    }, { threshold: 0.02 });
    heroIO.observe($(".hero"));
  } else if (heroVid) {
    heroVid.pause();
  }

  const reelVid = $(".reel-video");
  if (reelVid && !reduced) {
    const reelIO = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (reelVid.preload === "none") { reelVid.preload = "auto"; reelVid.load(); }
        reelVid.play().then(() => reelVid.classList.add("is-on")).catch(() => {});
      } else reelVid.pause();
    }, { rootMargin: "200px 0px" });
    reelIO.observe($(".reel"));
  }

  // hover previews for the film cards (desktop only)
  if (fine && !reduced) {
    $$(".filmcard").forEach((card) => {
      const v = $(".film-preview", card);
      if (!v) return;
      card.addEventListener("pointerenter", () => {
        v.play().then(() => card.classList.add("is-playing")).catch(() => {});
      });
      card.addEventListener("pointerleave", () => {
        v.pause(); v.currentTime = 0; card.classList.remove("is-playing");
      });
    });
  }

  // ---------- split words ----------
  function split(el) {
    const out = [];
    const walk = (node, into) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { into.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"); w.className = "w";
            const i = document.createElement("span"); i.className = "wi"; i.textContent = part;
            w.appendChild(i); into.appendChild(w); out.push(i);
          });
        } else if (n.nodeType === 1) {
          const c = n.cloneNode(false); into.appendChild(c); walk(n, c);
        }
      });
    };
    const frag = document.createDocumentFragment();
    walk(el, frag); el.innerHTML = ""; el.appendChild(frag);
    return out;
  }

  // ---------- motion ----------
  if (G && !reduced) {
    // hero entrance
    const words = split($(".hero-title"));
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(".hero-media img", { scale: 1.12, duration: 2.4, ease: "power3.out" }, 0)
      .from(".top", { y: -20, opacity: 0, duration: 1 }, 0.2)
      .from(".rating", { y: 16, opacity: 0, duration: 1 }, 0.3)
      .from(words, { yPercent: 110, duration: 1.2, stagger: 0.045 }, 0.35)
      .from(".hero [data-fade]", { y: 20, opacity: 0, duration: 1, stagger: 0.1 }, 0.75)
      .from(".finder", { y: 40, opacity: 0, duration: 1.2 }, 0.9)
      ;
    gsap.to(".hero-media", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero-inner", { y: -60, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "20% top", end: "70% top", scrub: true } });

    // headings & fades
    $$("[data-split]").forEach((el) => {
      if (el.closest(".hero")) return;
      const w = split(el);
      gsap.from(w, { yPercent: 110, duration: 1.1, stagger: 0.04, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });
    gsap.set("[data-fade]:not(.hero [data-fade])", { y: 30, opacity: 0 });
    ScrollTrigger.batch("[data-fade]:not(.hero [data-fade])", { start: "top 90%", once: true, onEnter: (b) => gsap.to(b, { y: 0, opacity: 1, duration: 1, stagger: 0.08, ease: "expo.out", overwrite: true }) });

    // celebrations grid stagger
    gsap.from(".cgrid li", { opacity: 0, y: 20, duration: 0.8, stagger: 0.05, ease: "power3.out", scrollTrigger: { trigger: ".cgrid", start: "top 85%", once: true } });

    // floating cards: entrance, idle float, scroll + pointer parallax
    const fls = $$(".fl");
    gsap.from(fls, { opacity: 0, scale: 0.6, y: 60, duration: 1.4, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: ".team", start: "top 70%", once: true } });
    fls.forEach((f, i) => {
      gsap.to(f, { y: i % 2 ? 14 : -14, duration: 3 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to(f, { yPercent: -(+f.dataset.d) * 3, ease: "none", scrollTrigger: { trigger: ".team", start: "top bottom", end: "bottom top", scrub: true } });
    });
    if (fine) {
      const qx = fls.map((f) => gsap.quickTo(f, "x", { duration: 1.2, ease: "power3.out" }));
      $(".team").addEventListener("pointermove", (e) => {
        const nx = e.clientX / innerWidth - 0.5;
        fls.forEach((f, i) => qx[i](nx * +f.dataset.d * 2));
      });
    }

    // reel: oversized word slides, image drifts
    gsap.fromTo(".reel-word span", { xPercent: 8 }, { xPercent: -30, ease: "none", scrollTrigger: { trigger: ".reel", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.fromTo(".reel-media img", { yPercent: -12 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".reel", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from(".reel", { scale: 0.94, borderRadius: 60, ease: "none", scrollTrigger: { trigger: ".reel", start: "top bottom", end: "top 30%", scrub: true } });

    // statement: words fill in as you read
    const sw = split($(".say"));
    gsap.fromTo(sw, { opacity: 0.16 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: ".say", start: "top 78%", end: "bottom 45%", scrub: true } });
    $$(".sticker").forEach((s, i) => gsap.from(s, { scale: 0, rotate: i % 2 ? 30 : -30, duration: 0.9, ease: "back.out(2.2)", scrollTrigger: { trigger: ".say", start: `top+=${60 + i * 70} 70%`, once: true } }));

    // gallery films + masonry reveal
    gsap.from(".filmcard", { y: 46, opacity: 0, duration: 1.1, stagger: 0.09, ease: "expo.out", scrollTrigger: { trigger: ".films", start: "top 88%", once: true } });
    gsap.set(".mfig", { clipPath: "inset(12% 0% 0% 0% round 20px)", y: 24 });
    ScrollTrigger.batch(".mfig", { start: "top 92%", once: true, onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0% round 20px)", duration: 1.15, stagger: 0.06, ease: "expo.out", overwrite: true }) });
    gsap.from(".gallery-note", { y: 20, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".gallery-note", start: "top 92%", once: true } });

    // plans + review cards rise
    gsap.from(".rv", { y: 30, opacity: 0, duration: 1, stagger: 0.05, ease: "expo.out", scrollTrigger: { trigger: ".rail", start: "top 88%", once: true } });
    gsap.from(".qa details", { y: 20, opacity: 0, duration: 0.8, stagger: 0.06, ease: "expo.out", scrollTrigger: { trigger: ".qa", start: "top 85%", once: true } });
    gsap.from(".foot-mark", { yPercent: 40, opacity: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".foot-mark", start: "top 95%", once: true } });
  }

  // counters
  $$("[data-count]").forEach((el) => {
    const end = +el.dataset.count, suf = el.dataset.suffix || "";
    const done = () => (el.textContent = fmt(end) + suf);
    if (!G || reduced) return done();
    const o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => gsap.to(o, { v: end, duration: 2, ease: "power3.out", onUpdate: () => (el.textContent = fmt(o.v) + suf) }) });
  });

  // ---------- coverflow ----------
  const flow = $(".flow"), cards = $$(".fcard"), dotsWrap = $(".flow-dots");
  let pos = 2, drag = null;
  cards.forEach((c, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.setAttribute("aria-label", c.querySelector("h3").textContent);
    b.addEventListener("click", () => setPos(i));
    dotsWrap.appendChild(b);
    c.addEventListener("click", () => { if (!drag?.moved && Math.round(pos) !== i) setPos(i); });
  });
  const dots = $$("button", dotsWrap);
  function layout(p) {
    const mob = innerWidth < 760;
    cards.forEach((c, i) => {
      const o = i - p, a = Math.abs(o);
      const x = o * (mob ? 78 : 60), rot = Math.max(-50, Math.min(50, -o * 32)), s = 1 - Math.min(a, 3) * 0.1;
      c.style.transform = `translateX(${x}%) translateZ(${-a * 120}px) rotateY(${rot}deg) scale(${s})`;
      c.style.zIndex = 100 - Math.round(a * 10);
      c.style.opacity = a > 2.6 ? 0 : 1 - Math.max(0, a - 1.6) * 0.6;
      c.style.filter = `brightness(${1 - Math.min(a, 2) * 0.18})`;
    });
    const r = Math.round(p);
    dots.forEach((d, i) => d.classList.toggle("is-on", i === r));
    $(".js-prev").disabled = r <= 0; $(".js-next").disabled = r >= cards.length - 1;
  }
  const state = { p: pos };
  function setPos(i) {
    pos = Math.max(0, Math.min(cards.length - 1, i));
    if (G && !reduced) gsap.to(state, { p: pos, duration: 0.9, ease: "expo.out", overwrite: true, onUpdate: () => layout(state.p) });
    else { state.p = pos; layout(pos); }
  }
  layout(pos);
  addEventListener("resize", () => layout(state.p));
  $(".js-prev").addEventListener("click", () => setPos(Math.round(pos) - 1));
  $(".js-next").addEventListener("click", () => setPos(Math.round(pos) + 1));
  flow.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") setPos(Math.round(pos) - 1); if (e.key === "ArrowRight") setPos(Math.round(pos) + 1); });
  flow.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, p: state.p, moved: false, id: e.pointerId };
    flow.classList.add("is-drag");
  });
  addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5) drag.moved = true;
    if (G) gsap.killTweensOf(state);
    state.p = Math.max(-0.4, Math.min(cards.length - 0.6, drag.p - dx / (flow.offsetWidth * 0.32)));
    layout(state.p);
  });
  addEventListener("pointerup", () => {
    if (!drag) return;
    flow.classList.remove("is-drag");
    setPos(Math.round(state.p));
    setTimeout(() => (drag = null), 0);
  });

  // ---------- traditions ----------
  const TR = [
    { img: "trad-poruwa.webp", tag: "Poruwa · Homecoming", t: "Poruwa ceremony", d: "A carved poruwa dressed in fresh flowers, with Jayamangala Gatha chanters and magul bera drummers, all timed to your nakath.", l: ["Poruwa, kalasa and thel pahana setup", "Ashtaka reciter and drummers on request", "Kiribath, kavili and a full Sri Lankan buffet", "A coordinator who keeps the nakath to the minute"] },
    { img: "b-walima-settee.webp", tag: "Nikah · Walima · Mehndi", t: "Nikah & Walima", d: "A calm Nikah and a joyful Walima, with layouts and a kitchen that put elders at ease.", l: ["Halal kitchen, buriyani on shared sahan", "Separate seating with a full-height partition", "Musalla and wudu area on site", "Music paused for every Adhan"] },
    { img: "trad-hindu.webp", tag: "Manavarai · Thali", t: "Tamil Hindu wedding", d: "A richly dressed manavarai and space for every ritual, with Nadaswaram and Thavil filling the hall.", l: ["Manavarai décor with mango-leaf thoranam", "Nadaswaram & Thavil musicians", "Pure-vegetarian kitchen, banana-leaf service", "Nalla neram timings coordinated with your priest"] },
    { img: "trad-church.webp", tag: "Church · Reception", t: "Church wedding & reception", d: "From the church doors to the first dance: floral aisles, a band stage and a cake under the chandeliers.", l: ["Bridal car & church-to-venue transfers", "Floral aisle, toast and cake-cutting setup", "Live band or DJ with dance floor", "Late licence until midnight"] },
    { img: "func-corporate.webp", tag: "Company · Family", t: "Functions & get-togethers", d: "Awards nights, AGMs, batch reunions and 50th birthdays, with AV and catering handled.", l: ["LED wall, stage and PA system", "Buffets, cocktails or plated dinners", "Parking for 300 cars", "Rooms for speakers and VIPs"] },
  ];
  const segBtns = $$(".seg button"), thumb = $(".seg-thumb"), panel = $(".tpanel");
  const place = (wrap, th) => { const a = $("button.is-on", wrap); th.style.width = a.offsetWidth + "px"; th.style.transform = `translateX(${a.offsetLeft - 5}px)`; };
  const fillT = (i) => {
    const t = TR[i];
    $(".tp-img img", panel).src = "assets/img/" + t.img;
    $(".tp-img img", panel).alt = t.t;
    $(".tp-tag", panel).textContent = t.tag;
    $(".tp-title", panel).textContent = t.t;
    $(".tp-desc", panel).textContent = t.d;
    const ul = $(".tp-list", panel); ul.innerHTML = "";
    t.l.forEach((x) => { const li = document.createElement("li"); li.textContent = x; ul.appendChild(li); });
  };
  TR.forEach((t) => { const im = new Image(); im.src = "assets/img/" + t.img; });
  segBtns.forEach((b, i) => b.addEventListener("click", () => {
    segBtns.forEach((x) => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-selected", String(x === b)); });
    place($(".seg"), thumb);
    b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    if (G && !reduced) {
      gsap.timeline()
        .to([".tp-img img", ".tp-body"], { opacity: 0, y: 10, duration: 0.25, ease: "power2.in" })
        .add(() => fillT(i))
        .fromTo(".tp-img img", { opacity: 0, scale: 1.06, y: 0 }, { opacity: 1, scale: 1, duration: 0.8, ease: "expo.out" })
        .fromTo(".tp-body", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" }, "<0.05");
    } else fillT(i);
  }));

  // ---------- packages + calculator ----------
  const PRICES = [4950, 6950, 9500], NAMES = ["Classic", "Signature", "Grand"], WEEKEND = 1.15;
  const est = { plan: 1, wk: false, g: 300 };
  const tg = $(".toggle"), tth = $(".toggle-thumb");
  const tween = (el, to) => {
    const from = +(el.dataset.v || to); el.dataset.v = to;
    if (!G || reduced) { el.textContent = fmt(to); return; }
    const o = { v: from };
    gsap.to(o, { v: to, duration: 0.8, ease: "power3.out", overwrite: true, onUpdate: () => (el.textContent = fmt(o.v)) });
  };
  const calc = () => {
    const per = PRICES[est.plan] * (est.wk ? WEEKEND : 1);
    tween($("#calcT"), per * est.g);
    $(".js-plan-name").textContent = NAMES[est.plan];
    $(".js-g").textContent = fmt(est.g);
    $$(".plan").forEach((p, i) => p.classList.toggle("is-picked", i === est.plan));
  };
  $$("button", tg).forEach((b) => b.addEventListener("click", () => {
    $$("button", tg).forEach((x) => x.classList.toggle("is-on", x === b));
    est.wk = b.dataset.day === "1"; place(tg, tth);
    $$(".plan-price b").forEach((el) => tween(el, +el.dataset.base * (est.wk ? WEEKEND : 1)));
    calc();
  }));
  $$("[data-pick]").forEach((b) => b.addEventListener("click", () => { est.plan = +b.dataset.pick; calc(); }));
  const range = $("#calcG");
  const fill = () => range.style.setProperty("--p", ((range.value - range.min) / (range.max - range.min)) * 100 + "%");
  range.addEventListener("input", () => { est.g = +range.value; $("#calcGOut").textContent = est.g; fill(); calc(); });
  fill(); $("#calcT").dataset.v = 0; calc();
  $(".js-quote").addEventListener("click", () => {
    $("#f-guests").value = est.g;
    $("#f-msg").value = `Interested in the ${NAMES[est.plan]} package (${est.wk ? "weekend" : "weekday"}) for ${est.g} guests.`;
  });
  const placeAll = () => { place($(".seg"), thumb); place(tg, tth); };
  requestAnimationFrame(placeAll); document.fonts?.ready.then(placeAll); addEventListener("resize", placeAll);

  // ---------- lightbox gallery & films ----------
  const MEDIA = [
    { kind: "video", src: "assets/video/film-ceremony.mp4", poster: "assets/img/film-ceremony.webp", title: "Vows by the water", tag: "Film 01 · Ceremony" },
    { kind: "video", src: "assets/video/film-ritual.mp4", poster: "assets/img/film-ritual.webp", title: "Garlands & blessings", tag: "Film 02 · Rituals" },
    { kind: "video", src: "assets/video/film-reception.mp4", poster: "assets/img/film-reception.webp", title: "Until the last dance", tag: "Film 03 · Reception" },
    { kind: "video", src: "assets/video/film-venue.mp4", poster: "assets/img/film-venue.webp", title: "The venue at golden hour", tag: "Film 04 · The grounds" },
    { kind: "image", src: "assets/img/gal-couple-hands.webp", title: "The quiet before", tag: "Portraits" },
    { kind: "image", src: "assets/img/gal-table-long.webp", title: "Long tables, low light", tag: "Reception" },
    { kind: "image", src: "assets/img/gal-couple-close.webp", title: "Close, and full of feeling", tag: "Portraits" },
    { kind: "image", src: "assets/img/m-henna-hands.webp", title: "Mehndi in bloom", tag: "Mehndi" },
    { kind: "image", src: "assets/img/gal-table-green.webp", title: "Under the trees", tag: "Reception" },
    { kind: "image", src: "assets/img/gal-couple-forest.webp", title: "A walk after the vows", tag: "Portraits" },
    { kind: "image", src: "assets/img/gal-centerpiece.webp", title: "Centrepieces, hand-tied", tag: "Decor" },
    { kind: "image", src: "assets/img/cake.webp", title: "The cake, at dusk", tag: "Details" },
    { kind: "image", src: "assets/img/gal-couple-lush.webp", title: "Newlyweds", tag: "Traditions" },
    { kind: "image", src: "assets/img/gal-candles.webp", title: "Candlelight", tag: "Decor" },
    { kind: "image", src: "assets/img/gal-couple-family.webp", title: "The whole family", tag: "People" },
    { kind: "image", src: "assets/img/sparklers.webp", title: "Sparklers at midnight", tag: "After dark" },
    { kind: "image", src: "assets/img/m-ballroom-gold.webp", title: "The Grand Ballroom", tag: "Spaces" },
    { kind: "image", src: "assets/img/m-aisle-lights.webp", title: "Aisle lights", tag: "Evening" },
    { kind: "image", src: "assets/img/gal-ivory.webp", title: "Ivory & candlelight", tag: "Details" },
    { kind: "image", src: "assets/img/b-walima-settee.webp", title: "Walima stage", tag: "Traditions" },
  ];
  const lb = $(".lb"), lbImg = $(".lb-stage img"), lbVid = $(".lb-stage video");
  const lbCap = $(".lb-cap"), lbCount = $(".lb-count");
  let gi = 0, lastFocus = null;
  const showMedia = (i) => {
    gi = (i + MEDIA.length) % MEDIA.length;
    const m = MEDIA[gi];
    if (m.kind === "video") {
      lbImg.hidden = true; lbImg.removeAttribute("src");
      lbVid.hidden = false; lbVid.poster = m.poster; lbVid.src = m.src; lbVid.load();
      const pr = lbVid.play(); if (pr && pr.catch) pr.catch(() => {});
    } else {
      lbVid.pause(); lbVid.hidden = true; lbVid.removeAttribute("src"); lbVid.load();
      lbImg.hidden = false; lbImg.src = m.src; lbImg.alt = m.title;
      if (G && !reduced) gsap.fromTo(lbImg, { opacity: 0, scale: 0.985 }, { opacity: 1, scale: 1, duration: 0.65, ease: "expo.out" });
    }
    lbCap.textContent = `${m.title} — ${m.tag}`;
    lbCount.textContent = `${pad(gi + 1)} / ${pad(MEDIA.length)}`;
  };
  function openLB(i) {
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.body.classList.add("lb-open");
    lenis?.stop();
    showMedia(i);
    requestAnimationFrame(() => $(".lb-x").focus({ preventScroll: true }));
  }
  function closeLB() {
    if (lb.hidden) return;
    lb.hidden = true;
    lbVid.pause(); lbVid.removeAttribute("src"); lbVid.load();
    document.body.classList.remove("lb-open");
    lenis?.start();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  $$(".js-gallery, .js-media, .filmcard, .mfig").forEach((el) => {
    el.addEventListener("click", () => openLB(el.classList.contains("js-gallery") ? 4 : +el.dataset.i));
  });
  $(".lb-x").addEventListener("click", closeLB);
  $(".lb-p").addEventListener("click", () => showMedia(gi - 1));
  $(".lb-n").addEventListener("click", () => showMedia(gi + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLB(); });
  addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "ArrowRight") showMedia(gi + 1);
    if (e.key === "ArrowLeft") showMedia(gi - 1);
  });
  lb.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const f = [$(".lb-x"), $(".lb-p"), $(".lb-n"), ...(lbVid.hidden ? [] : [lbVid])];
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  let tx = 0;
  lb.addEventListener("touchstart", (e) => (tx = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) showMedia(gi + (d < 0 ? 1 : -1)); });

  // reviews: duplicate for a seamless loop
  const rt = $(".rail-track");
  [...rt.children].forEach((c) => { const k = c.cloneNode(true); k.setAttribute("aria-hidden", "true"); rt.appendChild(k); });

  // ---------- calendar ----------
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const longDate = (d) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const MAXM = 18;
  const poya = new Set();
  (() => { // full moons (Meeus), Sri Lanka time — Poya dates are approximate
    const r = Math.PI / 180, k0 = Math.floor((today.getFullYear() + today.getMonth() / 12 - 2000) * 12.3685) - 2;
    for (let n = 0; n < MAXM + 4; n++) {
      const k = k0 + n + 0.5, T = k / 1236.85, E = 1 - 0.002516 * T;
      const M = (2.5534 + 29.1053567 * k) * r, Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T) * r, F = (160.7108 + 390.67050284 * k) * r;
      let j = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T;
      j += -0.40614 * Math.sin(Mp) + 0.17302 * E * Math.sin(M) + 0.01614 * Math.sin(2 * Mp) + 0.01043 * Math.sin(2 * F) + 0.00734 * E * Math.sin(Mp - M) - 0.00515 * E * Math.sin(Mp + M) + 0.00209 * E * E * Math.sin(2 * M);
      const d = new Date((j - 2440587.5) * 86400000 + 5.5 * 3600000);
      poya.add(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`);
    }
  })();
  // demo availability — replace with real bookings
  const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };
  const status = (d) => {
    if (d < today) return "past";
    const k = key(d);
    if (poya.has(k)) return "poya";
    const wk = d.getDay() === 0 || d.getDay() === 6;
    return hash(k) < (wk ? 0.5 : 0.15) ? "busy" : "open";
  };
  const grid = $(".cal-grid"), title = $(".cal-title"), msg = $(".cal-msg"), dateIn = $("#f-date");
  let view = new Date(today.getFullYear(), today.getMonth(), 1), sel = null;
  const minV = new Date(view), maxV = new Date(view.getFullYear(), view.getMonth() + MAXM, 1);
  const lastDay = new Date(maxV.getFullYear(), maxV.getMonth() + 1, 0);
  function render(anim) {
    title.textContent = view.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    $('.cal-nav[data-dir="-1"]').disabled = view <= minV;
    $('.cal-nav[data-dir="1"]').disabled = view >= maxV;
    grid.innerHTML = "";
    for (let i = 0; i < view.getDay(); i++) { const s = document.createElement("span"); s.className = "day empty"; grid.appendChild(s); }
    const n = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= n; i++) {
      const d = new Date(view.getFullYear(), view.getMonth(), i), st = status(d);
      const b = document.createElement("button");
      b.type = "button"; b.textContent = i; b.dataset.k = key(d);
      b.className = `day ${st}${key(d) === key(today) ? " today" : ""}${sel && key(sel) === key(d) ? " sel" : ""}`;
      b.setAttribute("aria-label", `${longDate(d)}: ${{ open: "available", busy: "booked", poya: "Poya day", past: "past" }[st]}`);
      if (st !== "open") b.disabled = true;
      b.addEventListener("click", () => pick(d, true));
      grid.appendChild(b);
    }
    if (anim && G && !reduced) gsap.from(grid.children, { opacity: 0, y: 8, duration: 0.45, stagger: 0.006, ease: "power3.out" });
  }
  function pick(d, fromCal) {
    sel = d;
    $$(".day", grid).forEach((b) => b.classList.toggle("sel", b.dataset.k === key(d)));
    if (fromCal) dateIn.value = key(d);
    dateIn.closest(".fld").classList.remove("bad");
    msg.style.color = "var(--ok)"; msg.textContent = `✓ ${longDate(d)} is available`;
  }
  function jump(d) {
    if (d < today || d > lastDay) return "range";
    view = new Date(d.getFullYear(), d.getMonth(), 1);
    const st = status(d);
    sel = st === "open" ? d : null;
    render(true);
    if (st === "open") pick(d, false);
    else { msg.style.color = "#c2410c"; msg.textContent = st === "poya" ? `${longDate(d)} is a Poya day. Please pick another date.` : `${longDate(d)} is already booked. Try a nearby date.`; }
    return st;
  }
  $$(".cal-nav").forEach((b) => b.addEventListener("click", () => { view.setMonth(view.getMonth() + +b.dataset.dir); render(true); }));
  dateIn.min = key(today); dateIn.max = key(lastDay);
  dateIn.addEventListener("change", () => { if (!dateIn.value) return; const [y, m, d] = dateIn.value.split("-").map(Number); jump(new Date(y, m - 1, d)); });
  render(false);

  // ---------- hero finder ----------
  const finder = $("#finder"), fOut = $("output", finder), fMsg = $(".f-msg", finder), fDate = $('input[type="date"]', finder);
  fDate.min = key(today); fDate.max = key(lastDay);
  $$(".stepper button", finder).forEach((b) => b.addEventListener("click", () => { fOut.textContent = Math.max(50, Math.min(1500, +fOut.textContent + +b.dataset.step)); }));
  finder.addEventListener("submit", (e) => {
    e.preventDefault();
    const type = finder.type.value, g = +fOut.textContent;
    $("#f-type").value = type; $("#f-guests").value = g;
    if (finder.venue.value !== "Any space") $("#f-msg").value = `Preferred space: ${finder.venue.value}.`;
    if (fDate.value) {
      const [y, m, d] = fDate.value.split("-").map(Number);
      const st = jump(new Date(y, m - 1, d));
      if (st === "open") dateIn.value = fDate.value;
      fMsg.textContent = st === "open" ? "Good news, that date is free. Taking you to booking…" : st === "range" ? "Please pick a date within the next 18 months." : "That date is taken. Here are nearby options…";
    } else fMsg.textContent = "Pick a date to check it, or browse the calendar below.";
    setTimeout(() => goTo("#book"), 700);
  });

  // ---------- enquiry form ----------
  const form = $(".form"), fb = $(".form-body"), done = $(".form-done");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    $$("input[required]", form).forEach((i) => {
      const bad = !i.checkValidity() || (i === dateIn && !sel);
      i.closest(".fld").classList.toggle("bad", bad);
      if (bad) ok = false;
    });
    if (!sel && dateIn.value) { msg.style.color = "#c2410c"; msg.textContent = "Please choose an available date in the calendar."; }
    if (!ok) { if (G) gsap.fromTo(form, { x: -10 }, { x: 0, duration: 0.6, ease: "elastic.out(1, .3)" }); $(".fld.bad input", form)?.focus(); return; }
    const data = new FormData(form);
    // TODO: send to your backend / email / WhatsApp Business API here.
    const waText = `Hello Ransiri Grand!\n\nName: ${data.get("name")}\nCelebration: ${data.get("type")}\nDate: ${longDate(sel)}\nGuests: ${data.get("guests")}\nPhone: ${data.get("phone")}${data.get("msg") ? `\nNotes: ${data.get("msg")}` : ""}\n\nCould we arrange a site visit?`;
    $(".js-wa-send", form).href = `https://wa.me/94770000000?text=${encodeURIComponent(waText)}`;
    $(".done-sum", form).textContent = `We've got your ${data.get("type").toLowerCase()} enquiry for ${longDate(sel)}, ${data.get("guests")} guests. We'll call ${data.get("phone")} within 24 hours.`;
    fb.hidden = true; done.hidden = false; form.classList.add("done");
    if (G && !reduced) gsap.from(done.children, { opacity: 0, y: 20, stagger: 0.08, duration: 0.8, ease: "expo.out" });
  });
  $(".js-reset").addEventListener("click", () => { form.reset(); sel = null; msg.textContent = ""; render(false); form.classList.remove("done"); done.hidden = true; fb.hidden = false; });
  $$("input", form).forEach((i) => i.addEventListener("input", () => i.closest(".fld")?.classList.remove("bad")));

  if (G) addEventListener("load", () => ScrollTrigger.refresh());
})();
