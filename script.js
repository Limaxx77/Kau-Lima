/* =========================================================
   KAUÃ LIMA — PORTFÓLIO · interações e animações
   Cada bloco é independente: se uma lib externa falhar
   (GSAP), o site continua funcional com IntersectionObserver.
   ========================================================= */
(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = () => Boolean(window.gsap && window.ScrollTrigger);

  const WHATSAPP = "https://wa.me/5565999244629";
  const INSTAGRAM = "https://www.instagram.com/ominy.dev/";
  const SITE_OMINY = "https://ominydesenvolvimentos.com";
  const GITHUB = "https://github.com/Limaxx77";

  const ROLES = ["Desenvolvedor Web", "Empreendedor", "CEO da Ominy", "Criador de Soluções Digitais", "Apaixonado por Tecnologia"];

  /* ---------------- Utilidades ---------------- */
  const storage = {
    get(key) { try { return sessionStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { sessionStorage.setItem(key, value); } catch { /* modo privado */ } },
  };

  let toastTimer;
  function toast(message, ms = 3600) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), ms);
  }

  /* ---------------- Divisão de texto ---------------- */
  function splitChars(el) {
    const text = el.textContent.trim();
    el.textContent = "";
    [...text].forEach((ch, i) => {
      const mask = document.createElement("span");
      mask.className = "split-line";
      const char = document.createElement("span");
      char.className = "split-char";
      char.textContent = ch;
      char.style.setProperty("--i", i);
      mask.appendChild(char);
      el.appendChild(mask);
    });
  }

  function splitWords(el, masked = true) {
    const text = el.textContent.trim().replace(/\s+/g, " ");
    el.setAttribute("aria-label", text);
    const nodes = [];
    // Preserva <mark> e <strong> da frase de destaque
    const walk = (node, wrapper) => {
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { wrapper.appendChild(document.createTextNode(" ")); return; }
            const word = document.createElement("span");
            word.className = "split-word";
            word.textContent = part;
            word.setAttribute("aria-hidden", "true");
            nodes.push(word);
            if (masked) {
              const mask = document.createElement("span");
              mask.className = "split-line";
              mask.appendChild(word);
              wrapper.appendChild(mask);
            } else {
              wrapper.appendChild(word);
            }
          });
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const clone = child.cloneNode(false);
          clone.setAttribute("aria-hidden", "true");
          walk(child, clone);
          wrapper.appendChild(clone);
        }
      });
    };
    const frag = document.createDocumentFragment();
    walk(el, frag);
    el.textContent = "";
    el.appendChild(frag);
    nodes.forEach((n, i) => n.style.setProperty("--i", i));
    return nodes;
  }

  function prepareText() {
    const title = $(".hero__title");
    if (title) {
      title.setAttribute("aria-label", "Kauã Lima");
      $$("[data-split]", title).forEach((line) => { line.setAttribute("aria-hidden", "true"); splitChars(line); });
    }
    $$("[data-split-words]").forEach((el) => splitWords(el));
    $$("[data-highlight]").forEach((el) => splitWords(el, false));
  }

  /* ---------------- Loader + intro do hero ---------------- */
  function runLoader(onReveal) {
    const loader = $("#loader");
    if (!loader) return onReveal();
    if (reduceMotion || storage.get("kl-intro")) {
      loader.remove();
      return onReveal();
    }
    storage.set("kl-intro", "1");

    const bar = $("#loaderBar");
    const count = $("#loaderCount");
    const duration = 1100;
    const start = performance.now();

    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      bar.style.transform = `scaleX(${eased})`;
      count.textContent = String(Math.round(eased * 100)).padStart(3, "0");
      if (p < 1) return requestAnimationFrame(tick);

      loader.classList.add("is-done");
      const exit = loader.animate(
        [{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(0 0 100% 0)" }],
        { duration: 900, easing: "cubic-bezier(0.76, 0, 0.24, 1)", fill: "forwards" }
      );
      setTimeout(onReveal, 250);
      exit.onfinish = () => loader.remove();
    };
    requestAnimationFrame(tick);
  }

  function revealHero() {
    const hero = $(".hero");
    if (!hero) return;
    $$("[data-hero-fade]", hero).forEach((el, i) => { el.style.transitionDelay = `${0.45 + i * 0.1}s`; });
    hero.classList.add("is-ready");
    setTimeout(() => hero.classList.add("is-settled"), 2600);
    document.dispatchEvent(new CustomEvent("hero:ready"));
    startRotator();
  }

  /* ---------------- Texto alternado com efeito scramble ---------------- */
  function startRotator() {
    const el = $("#rotator");
    if (!el) return;
    const glyphs = "!<>-_\\/[]{}—=+*^?#01";
    let index = 0;

    const scramble = (to) => {
      if (reduceMotion) { el.textContent = to; return; }
      const from = el.textContent;
      const length = Math.max(from.length, to.length);
      const queue = Array.from({ length }, (_, i) => ({
        from: from[i] || "",
        to: to[i] || "",
        start: Math.floor(Math.random() * 14),
        end: 14 + Math.floor(Math.random() * 18),
      }));
      let frame = 0;
      const step = () => {
        let out = "";
        let done = 0;
        queue.forEach((q) => {
          if (frame >= q.end) { done++; out += q.to; }
          else if (frame >= q.start) out += glyphs[Math.floor(Math.random() * glyphs.length)];
          else out += q.from;
        });
        el.textContent = out;
        frame++;
        if (done < queue.length) requestAnimationFrame(step);
      };
      step();
    };

    setInterval(() => {
      if (document.hidden) return;
      index = (index + 1) % ROLES.length;
      scramble(ROLES[index]);
    }, 2800);
  }

  /* ---------------- Header, progresso e navegação ativa ---------------- */
  function initHeader() {
    const header = $("#header");
    const progress = $(".scroll-progress span");
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      header.classList.toggle("is-scrolled", y > 20);
      const goingDown = y > lastY && y > innerHeight * 0.6;
      if (!document.body.classList.contains("menu-open")) header.classList.toggle("is-hidden", goingDown);
      if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      lastY = y;
      ticking = false;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();

    const links = $$("[data-nav]");
    const sections = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------------- Menu mobile ---------------- */
  function initMenu() {
    const toggle = $("#menuToggle");
    const menu = $("#mobileMenu");
    if (!toggle || !menu) return;

    const setOpen = (open) => {
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      menu.setAttribute("aria-hidden", String(!open));
      menu.inert = !open;
      if (open) $("#header").classList.remove("is-hidden");
    };
    menu.inert = true;
    toggle.addEventListener("click", () => setOpen(!document.body.classList.contains("menu-open")));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
    matchMedia("(min-width: 1101px)").addEventListener("change", (e) => { if (e.matches) setOpen(false); });
  }

  /* ---------------- Revelações por scroll ---------------- */
  function initReveal() {
    const targets = $$("[data-reveal], [data-split-words], .timeline__item, [data-highlight]");
    if (!("IntersectionObserver" in window)) { targets.forEach((t) => t.classList.add("is-in")); return; }

    const io = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((entry, i) => {
        entry.target.style.transitionDelay = `${i * 0.08}s`;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    targets.forEach((t) => io.observe(t));
  }

  /* ---------------- Tilt 3D + spotlight ---------------- */
  function initTilt() {
    $$(".card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });

    if (!finePointer || reduceMotion) return;
    $$("[data-tilt]").forEach((el) => {
      const max = el.classList.contains("project") ? 6 : 8;
      el.addEventListener("pointerenter", () => { el.style.transition = "transform 0.2s ease-out, border-color 0.4s"; });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(1000px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateZ(0)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s";
        el.style.transform = "";
      });
    });
  }

  /* ---------------- Botões magnéticos ---------------- */
  function initMagnetic() {
    if (!finePointer || reduceMotion) return;
    $$(".magnetic").forEach((el) => {
      const strength = el.classList.contains("contact__big") ? 0.06 : 0.3;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------------- Projetos: filtro + visualização ampliada ---------------- */
  function initProjects() {
    const grid = $("#projectGrid");
    if (!grid) return;
    const cards = $$(".project", grid);

    $$(".filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter;
        $$(".filter").forEach((b) => {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-pressed", String(b === btn));
        });
        let i = 0;
        cards.forEach((card) => {
          const show = filter === "all" || card.dataset.status === filter || card.dataset.status === "all";
          card.classList.toggle("is-filtered", !show);
          card.classList.remove("is-entering");
          if (show) {
            void card.offsetWidth; // reinicia a animação de entrada
            card.style.animationDelay = `${i++ * 0.06}s`;
            card.classList.add("is-entering");
          }
        });
        if (hasGSAP()) ScrollTrigger.refresh();
      });
    });

    const modal = $("#projectModal");
    const open = (card) => {
      const media = $(".project__media", card);
      $("#modalMedia").replaceChildren(media.cloneNode(true));
      $("#modalBadge").replaceChildren($(".badge", card).cloneNode(true));
      $("#modalTitle").textContent = $("h3", card).textContent;
      $("#modalTags").replaceChildren(...$$(".tags li", card).map((li) => li.cloneNode(true)));
      const more = $(".project__more", card);
      $("#modalText").replaceChildren(...[...more.children].map((n) => n.cloneNode(true)));
      modal.showModal();
      document.body.style.overflow = "hidden";
    };

    cards.filter((c) => !c.classList.contains("project--more")).forEach((card) => {
      card.setAttribute("role", "button");
      card.addEventListener("click", () => open(card));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(card); }
      });
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.closest("[data-close]")) modal.close();
    });
    modal.addEventListener("close", () => { document.body.style.overflow = ""; });
  }

  /* ---------------- Animações cinematográficas (GSAP) ---------------- */
  function initScrollCinema() {
    if (!hasGSAP() || reduceMotion) return;
    const { gsap } = window;
    gsap.registerPlugin(ScrollTrigger);

    // Hero se dissolve ao rolar
    gsap.to(".hero__inner", {
      yPercent: -18, opacity: 0.1, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });

    // Parallax
    $$("[data-parallax]").forEach((el) => {
      gsap.fromTo(el, { yPercent: -Number(el.dataset.parallax) }, {
        yPercent: Number(el.dataset.parallax), ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    // Palavras acendendo conforme a leitura
    $$("[data-highlight]").forEach((el) => {
      gsap.fromTo($$(".split-word", el), { opacity: 0.14 }, {
        opacity: 1, stagger: 0.05, ease: "none",
        scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
      });
    });

    // OMINY: o símbolo gira em profundidade até o centro, desliza para o lado
    // e o nome é revelado, montando a logo. No desktop a cena fica fixa (pin);
    // no mobile tudo acontece dentro da própria seção, sem position: fixed.
    const stage = $(".ominy__stage");
    const symbol = $(".ominy__symbol");
    const symbolWrap = $(".ominy__symbol-wrap");
    const wordmark = $(".ominy__wordmark");
    if (stage && symbol && symbolWrap && wordmark) {
      const centerOffset = () => (wordmark.offsetWidth + parseFloat(getComputedStyle($(".ominy__logo")).columnGap || 0)) / 2;
      const entrance = [{ scale: 0.15, rotation: -540, opacity: 0, filter: "blur(14px)" },
        { scale: 1, rotation: 0, opacity: 1, filter: "blur(0px)", ease: "power2.out" }];
      const build = (tl, at) => tl
        .fromTo(symbolWrap, { x: centerOffset }, { x: 0, ease: "power2.inOut" }, at)
        .fromTo(wordmark, { clipPath: "inset(0 100% 0 0)", x: -40, opacity: 0 }, { clipPath: "inset(0 0% 0 0)", x: 0, opacity: 1, ease: "power2.out" }, at + 0.25)
        .fromTo(".ominy__glow", { scale: 0.6, opacity: 0.3 }, { scale: 1.3, opacity: 1 }, at)
        .to(".ominy__orb", { scale: 1.5, rotate: 50, opacity: 0.6 }, at)
        .fromTo([".ominy__eyebrow", ".ominy__tag"], { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.15 }, at + 0.6);

      gsap.matchMedia()
        .add("(min-width: 821px)", () => {
          gsap.fromTo(symbol, entrance[0], { ...entrance[1],
            scrollTrigger: { trigger: stage, start: "top 85%", end: "top top", scrub: 1, invalidateOnRefresh: true } });
          const pinned = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: stage, start: "top top", end: "+=110%", scrub: 1, pin: true, anticipatePin: 1, invalidateOnRefresh: true },
          });
          build(pinned, 0).to({}, { duration: 0.3 });
        })
        .add("(max-width: 820px)", () => {
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: stage, start: "top 85%", end: "center 45%", scrub: 0.6, invalidateOnRefresh: true },
          });
          tl.fromTo(symbol, entrance[0], { ...entrance[1], duration: 1 }, 0);
          build(tl, 1);
        });
    }

    // Manifesto: as palavras se preenchem e deslizam com a rolagem
    $$("[data-drift]").forEach((line) => {
      const d = Number(line.dataset.drift);
      gsap.fromTo(line, { xPercent: -d }, {
        xPercent: d, ease: "none",
        scrollTrigger: { trigger: ".manifesto", start: "top bottom", end: "bottom top", scrub: true },
      });
    });
    $$("[data-fill]").forEach((word) => {
      gsap.fromTo(word, { "--fill": "0%" }, {
        "--fill": "100%", ease: "none",
        scrollTrigger: { trigger: word, start: "top 85%", end: "top 45%", scrub: true },
      });
    });

    // Linha do tempo se desenha com o scroll
    const line = $(".timeline__line span");
    if (line) {
      gsap.fromTo(line, { scaleY: 0 }, {
        scaleY: 1, ease: "none",
        scrollTrigger: { trigger: ".timeline", start: "top 70%", end: "bottom 60%", scrub: true },
      });
    }

    // Recalcula posições quando imagens e fontes terminam de carregar
    addEventListener("load", () => ScrollTrigger.refresh());
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }

  /* ---------------- Terminal secreto ---------------- */
  function initTerminal() {
    const dialog = $("#terminal");
    const out = $("#terminalOut");
    const form = $("#terminalForm");
    const input = $("#terminalInput");
    if (!dialog) return;

    const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
    const commands = {
      help: () => "Comandos: <span class=\"cmd\">sobre</span>, <span class=\"cmd\">ominy</span>, <span class=\"cmd\">projetos</span>, <span class=\"cmd\">contato</span>, <span class=\"cmd\">github</span>, <span class=\"cmd\">clear</span>, <span class=\"cmd\">exit</span>",
      sobre: () => "Kauã Lima — desenvolvedor web, CEO da Ominy e estudante de ADS na reta final.\nGosta de transformar ideias em projetos reais.",
      ominy: () => `Ominy Desenvolvimentos — sites, sistemas, automações e integrações.\n→ ${link(SITE_OMINY, "ominydesenvolvimentos.com")}  ·  ${link(INSTAGRAM, "@ominy.dev")}`,
      projetos: () => { go("#projetos"); return "Indo para os projetos…"; },
      contato: () => `WhatsApp: ${link(WHATSAPP, "(65) 99924-4629")}`,
      github: () => `→ ${link(GITHUB, "github.com/Limaxx77")}`,
      sudo: () => "Permissão negada. Mas gostei da ousadia 😄",
      ls: () => "sobre.txt  ominy/  projetos/  segredos.md",
      "cat segredos.md": () => "# Segredos\n- Experimente o Konami code: ↑ ↑ ↓ ↓ ← → ← → B A\n- Digite \"ominy\" em qualquer lugar da página\n- Clique 5x no logo KL",
      whoami: () => "visitante-curioso (o melhor tipo de visitante)",
      clear: () => { out.innerHTML = ""; return null; },
      exit: () => { dialog.close(); return null; },
    };

    const print = (html, cls = "") => {
      const line = document.createElement("div");
      if (cls) line.className = cls;
      line.innerHTML = html;
      out.appendChild(line);
      out.scrollTop = out.scrollHeight;
    };
    const go = (hash) => { dialog.close(); $(hash)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); };

    let booted = false;
    const open = () => {
      if (dialog.open) return;
      dialog.showModal();
      if (!booted) {
        print("Bem-vindo ao terminal do Kauã. v2026.1", "muted");
        print("Digite <span class=\"cmd\">help</span> para ver os comandos.", "muted");
        booted = true;
      }
      input.focus();
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const raw = input.value.trim();
      input.value = "";
      if (!raw) return;
      print(`$ ${raw.replace(/</g, "&lt;")}`, "cmd");
      const fn = commands[raw.toLowerCase()];
      const result = fn ? fn() : `comando não encontrado: ${raw.replace(/</g, "&lt;")}. Tente <span class="cmd">help</span>.`;
      if (result) print(result);
    });

    dialog.addEventListener("click", (e) => {
      if (e.target === dialog || e.target.closest("[data-close]")) dialog.close();
    });
    $("#openTerminal")?.addEventListener("click", open);
    addEventListener("keydown", (e) => {
      const typing = /input|textarea/i.test(document.activeElement?.tagName || "");
      if (!typing && (e.key === "`" || e.key === "Dead" && e.code === "Backquote")) { e.preventDefault(); open(); }
    });
  }

  /* ---------------- Easter eggs ---------------- */
  function shake() {
    document.body.classList.remove("is-shaking");
    void document.body.offsetWidth;
    document.body.classList.add("is-shaking");
    setTimeout(() => document.body.classList.remove("is-shaking"), 700);
  }

  function initEasterEggs() {
    // Konami code → modo dev (mostra o "esqueleto" do layout)
    const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let k = 0;
    // Digitar "ominy" faz o nome brilhar
    let typed = "";

    addEventListener("keydown", (e) => {
      if (/input|textarea/i.test(document.activeElement?.tagName || "")) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      k = key === konami[k] ? k + 1 : key === konami[0] ? 1 : 0;
      if (k === konami.length) {
        k = 0;
        const on = document.body.classList.toggle("dev-mode");
        toast(on ? "🛠️ Modo dev ativado — agora você vê o grid por trás da mágica." : "Modo dev desativado.");
      }

      if (e.key.length === 1) {
        typed = (typed + key).slice(-5);
        if (typed === "ominy") {
          const word = $(".ominy__logo");
          word?.classList.remove("is-glow");
          void word?.offsetWidth;
          word?.classList.add("is-glow");
          toast("✦ Chamou a Ominy? ominydesenvolvimentos.com");
        }
      }
    });

    // 5 cliques no logo → o site "pula" de alegria
    const brand = $("#brand");
    let clicks = 0, timer;
    brand?.addEventListener("click", () => {
      clicks++;
      clearTimeout(timer);
      timer = setTimeout(() => { clicks = 0; }, 1500);
      if (clicks === 5) { clicks = 0; shake(); toast("✦ Curiosidade desbloqueada! Disciplina, criatividade e determinação."); }
    });

    // Aba em segundo plano
    const original = document.title;
    document.addEventListener("visibilitychange", () => {
      document.title = document.hidden ? "👀 Volta aqui! | Kauã Lima" : original;
    });

    // Mensagem para devs curiosos
    console.log(
      "%cKL%c  Olá, dev curioso! 👋\nEste site foi feito à mão por Kauã Lima.\nDica: pressione ` (crase) para abrir o terminal secreto.\n→ " + GITHUB,
      "background:#fff;color:#000;font:800 18px sans-serif;padding:4px 8px;border-radius:4px",
      "color:#aaa;font:13px monospace"
    );
  }

  /* ---------------- Inicialização ---------------- */
  function init() {
    prepareText();
    initHeader();
    initMenu();
    initReveal();
    initTilt();
    initMagnetic();
    initProjects();
    initTerminal();
    initEasterEggs();
    initScrollCinema();
    runLoader(revealHero);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
