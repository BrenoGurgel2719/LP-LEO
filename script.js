            (function () {
                const navbar = document.getElementById('navbar');
                const toggle = document.getElementById('navbarToggle');
                const links = document.getElementById('navbarLinks');

                let ticking = false;
                function onScroll() {
                    if (!ticking) {
                        requestAnimationFrame(() => {
                            navbar.classList.toggle('is-scrolled', window.scrollY > 12);
                            ticking = false;
                        });
                        ticking = true;
                    }
                }
                window.addEventListener('scroll', onScroll, { passive: true });

                toggle.addEventListener('click', () => {
                    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
                    toggle.setAttribute('aria-expanded', String(!isOpen));
                    toggle.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
                    links.classList.toggle('is-open');
                });

                links.querySelectorAll('a').forEach(a => {
                    a.addEventListener('click', () => {
                        toggle.setAttribute('aria-expanded', 'false');
                        toggle.setAttribute('aria-label', 'Abrir menu');
                        links.classList.remove('is-open');
                    });
                });
            })();

            (function () {
                const sections = document.querySelectorAll('main section, body > section');
                const revealSelector = [
                    '.especialidades-head', '.mzaCarousel',
                    '.equipe-head', '.equipe-member', '.equipe-images',
                    '.depoimentos-head', '.depoimento-card',
                    '.cta-inner', '.contato-form-inner', '.form-wrapper',
                    '.contato-text-wrapper', '.footer-watermark', '.footer .reveal',
                    '.section-tag', 'h2', 'h3', 'p', 'li', '.sobre-tag',
                    '.sobre-stats', '.sobre-cta', '.cta-btn', '.submit-btn',
                    '.input-group'
                ].join(', ');
                const revealEls = Array.from(document.querySelectorAll(revealSelector))
                    .filter(el => !el.closest('header') && !el.classList.contains('reveal'));

                sections.forEach(section => {
                    const sectionEls = revealEls.filter(el => section.contains(el));
                    sectionEls.forEach((el, index) => {
                        el.classList.add('scroll-reveal');
                        el.style.setProperty('--scroll-delay', `${Math.min(index * 0.07, 0.42)}s`);
                    });
                });

                const allRevealEls = document.querySelectorAll('.scroll-reveal, .sobre .reveal');
                if (!allRevealEls.length) return;

                const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                if (prefersReducedMotion || !('IntersectionObserver' in window)) {
                    allRevealEls.forEach(el => el.classList.add('is-visible'));
                    return;
                }

                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible');
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

                allRevealEls.forEach(el => observer.observe(el));
            })();

            (function () {
                const section = document.querySelector('.equipe');
                if (!section) return;

                const members = Array.from(section.querySelectorAll('.equipe-member'));
                const images = Array.from(section.querySelectorAll('.eq-img-wrapper'));
                const desktopQuery = window.matchMedia('(min-width: 901px)');
                let frame = 0;

                function updateActiveMember() {
                    frame = 0;
                    if (!desktopQuery.matches) return;

                    const target = window.innerHeight * .5;
                    let activeIndex = 0;
                    let closestDistance = Infinity;

                    members.forEach((member, index) => {
                        const memberRect = member.getBoundingClientRect();
                        const distance = Math.abs(memberRect.top + memberRect.height / 2 - target);
                        if (distance < closestDistance) {
                            closestDistance = distance;
                            activeIndex = index;
                        }
                    });

                    images.forEach((image, index) => image.classList.toggle('is-active', index <= activeIndex));
                }

                function requestUpdate() {
                    if (!frame) frame = requestAnimationFrame(updateActiveMember);
                }

                window.addEventListener('scroll', requestUpdate, { passive: true });
                window.addEventListener('resize', requestUpdate);
                if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', requestUpdate);
                else desktopQuery.addListener(requestUpdate);
                requestUpdate();
            })();

            (function () {
                const cards = document.querySelectorAll('.depoimento-card');
                if (!cards.length) return;

                const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                if (prefersReducedMotion) {
                    cards.forEach(card => card.classList.add('is-visible'));
                    return;
                }

                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible');
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });

                cards.forEach(card => observer.observe(card));
            })();

            (function () {
                class MzaCarousel {
                    constructor(root, opts = {}) {
                        this.root = root;
                        this.viewport = root.querySelector(".mzaCarousel-viewport");
                        this.track = root.querySelector(".mzaCarousel-track");
                        this.slides = Array.from(root.querySelectorAll(".mzaCarousel-slide"));
                        this.prevBtn = root.querySelector(".mzaCarousel-prev");
                        this.nextBtn = root.querySelector(".mzaCarousel-next");
                        this.pagination = root.querySelector(".mzaCarousel-pagination");
                        this.isFF = typeof InstallTrigger !== "undefined";
                        this.n = this.slides.length;
                        this.state = {
                            index: 0, pos: 0, width: 0, height: 0, gap: 28,
                            dragging: false, pointerId: null, x0: 0, v: 0, t0: 0,
                            animating: false, hovering: false, startTime: 0, pausedAt: 0, rafId: 0
                        };
                        this.viewportRect = { left: 0, top: 0, width: 0, height: 0 };
                        this.opts = Object.assign({
                            gap: 28, peek: 0.15, rotateY: 34, zDepth: 150, scaleDrop: 0.09,
                            blurMax: 2.0, activeLeftBias: 0.12, interval: 4500, transitionMs: 900,
                            keyboard: true,
                            breakpoints: [
                                { mq: "(max-width: 1200px)", gap: 24, peek: 0.12, rotateY: 28, zDepth: 120, scaleDrop: 0.08, activeLeftBias: 0.1 }
                            ]
                        }, opts);
                        if (this.isFF) { this.opts.rotateY = 10; this.opts.zDepth = 0; this.opts.blurMax = 0; }

                        this._onPrev = () => this.prev();
                        this._onNext = () => this.next();
                        this._onKeydown = (e) => { if (e.key === "ArrowLeft") this.prev(); if (e.key === "ArrowRight") this.next(); };
                        this._onDragStartBound = (e) => this._onDragStart(e);
                        this._onDragMoveBound = (e) => this._onDragMove(e);
                        this._onDragEndBound = (e) => this._onDragEnd(e);
                        this._onEnter = () => { this.state.hovering = true; this.state.pausedAt = performance.now(); };
                        this._onLeave = () => {
                            if (this.state.pausedAt) { this.state.startTime += performance.now() - this.state.pausedAt; this.state.pausedAt = 0; }
                            this.state.hovering = false;
                        };
                        this._onTiltBound = (e) => this._onTilt(e);

                        this._init();
                    }

                    _init() {
                        this._setupDots();
                        this._bind();
                        this._measure();
                        this.slides.forEach((slide, index) => {
                            const active = index === 0;
                            slide.setAttribute("aria-hidden", String(!active));
                            slide.inert = !active;
                            slide.removeAttribute("tabindex");
                        });
                        this.goTo(0, false);
                        this._startCycle();
                        this._loop();
                    }

                    _setupDots() {
                        this.pagination.innerHTML = "";
                        this.dots = this.slides.map((slide, i) => {
                            const b = document.createElement("button");
                            b.type = "button";
                            b.className = "mzaCarousel-dot";
                            b.setAttribute("role", "tab");
                            b.setAttribute("aria-label", `Ir para o slide ${i + 1}`);
                            b.setAttribute("aria-controls", slide.id);
                            b.setAttribute("aria-selected", i === 0 ? "true" : "false");
                            b.tabIndex = i === 0 ? 0 : -1;
                            b.addEventListener("click", () => this.goTo(i));
                            this.pagination.appendChild(b);
                            return b;
                        });
                    }

                    _bind() {
                        this.prevBtn.addEventListener("click", this._onPrev);
                        this.nextBtn.addEventListener("click", this._onNext);
                        if (this.opts.keyboard) this.root.addEventListener("keydown", this._onKeydown);

                        this.viewport.addEventListener("pointerdown", this._onDragStartBound);
                        this.viewport.addEventListener("pointermove", this._onDragMoveBound);
                        this.viewport.addEventListener("pointerup", this._onDragEndBound);
                        this.viewport.addEventListener("pointercancel", this._onDragEndBound);
                        this.viewport.addEventListener("pointermove", this._onTiltBound);

                        this.root.addEventListener("mouseenter", this._onEnter);
                        this.root.addEventListener("mouseleave", this._onLeave);

                        this.ro = new ResizeObserver(() => this._measure());
                        this.ro.observe(this.viewport);
                    }

                    _measure() {
                        const viewRect = this.viewport.getBoundingClientRect();
                        this.viewportRect = viewRect;
                        this.state.width = viewRect.width;
                        this.state.gap = this.opts.gap;
                        this.slideW = Math.min(760, this.state.width * (1 - this.opts.peek * 2));
                    }

                    _onTilt(e) {
                        const r = this.viewportRect;
                        if (!r.width || !r.height) return;
                        const mx = (e.clientX - r.left) / r.width - 0.5;
                        const my = (e.clientY - r.top) / r.height - 0.5;
                        this.root.style.setProperty("--mzaTiltX", (my * -6).toFixed(3));
                        this.root.style.setProperty("--mzaTiltY", (mx * 6).toFixed(3));
                    }

                    _onDragStart(e) {
                        if (e.pointerType === "mouse" && e.button !== 0) return;
                        e.preventDefault();
                        this.state.dragging = true;
                        this.state.pointerId = e.pointerId;
                        this.viewport.setPointerCapture(e.pointerId);
                        this.state.x0 = e.clientX;
                        this.state.t0 = performance.now();
                        this.state.v = 0;
                        this.state.pausedAt = performance.now();
                    }

                    _onDragMove(e) {
                        if (!this.state.dragging || e.pointerId !== this.state.pointerId) return;
                        const dx = e.clientX - this.state.x0;
                        const dt = Math.max(16, performance.now() - this.state.t0);
                        this.state.v = dx / dt;
                        const slideSpan = this.slideW + this.state.gap;
                        this.state.pos = this._mod(this.state.index - dx / slideSpan, this.n);
                        this._render();
                    }

                    _onDragEnd(e) {
                        if (!this.state.dragging || (e && e.pointerId !== this.state.pointerId)) return;
                        this.state.dragging = false;
                        try { if (this.state.pointerId != null) this.viewport.releasePointerCapture(this.state.pointerId); } catch { }
                        this.state.pointerId = null;
                        if (this.state.pausedAt) { this.state.startTime += performance.now() - this.state.pausedAt; this.state.pausedAt = 0; }
                        const v = this.state.v;
                        const threshold = 0.18;
                        let target = Math.round(this.state.pos - Math.sign(v) * (Math.abs(v) > threshold ? 0.5 : 0));
                        this.goTo(this._mod(target, this.n));
                    }

                    _startCycle() { this.state.startTime = performance.now(); }

                    _loop() {
                        const step = (t) => {
                            if (!this.state.dragging && !this.state.hovering && !this.state.animating) {
                                const elapsed = t - this.state.startTime;
                                if (elapsed >= this.opts.interval) this.next();
                            }
                            this.state.rafId = requestAnimationFrame(step);
                        };
                        this.state.rafId = requestAnimationFrame(step);
                    }

                    prev() { this.goTo(this._mod(this.state.index - 1, this.n)); }
                    next() { this.goTo(this._mod(this.state.index + 1, this.n)); }

                    goTo(i, animate = true) {
                        const start = this.state.pos || this.state.index;
                        const end = this._nearest(start, i);
                        const dur = animate ? this.opts.transitionMs : 0;
                        const t0 = performance.now();
                        const ease = (x) => 1 - Math.pow(1 - x, 4);
                        this.state.animating = true;
                        const step = (now) => {
                            const t = Math.min(1, (now - t0) / dur);
                            const p = dur ? ease(t) : 1;
                            this.state.pos = start + (end - start) * p;
                            this._render();
                            if (t < 1) requestAnimationFrame(step);
                            else this._afterSnap(i);
                        };
                        requestAnimationFrame(step);
                    }

                    _afterSnap(i) {
                        this.state.index = this._mod(Math.round(this.state.pos), this.n);
                        this.state.pos = this.state.index;
                        this.state.animating = false;
                        this._render(true);
                        this._startCycle();
                        this.dots.forEach((d, idx) => {
                            const active = idx === this.state.index;
                            d.setAttribute("aria-selected", String(active));
                            d.tabIndex = active ? 0 : -1;
                        });
                        this.slides.forEach((slide, idx) => {
                            const active = idx === this.state.index;
                            slide.setAttribute("aria-hidden", String(!active));
                            slide.inert = !active;
                            slide.removeAttribute("tabindex");
                        });
                    }

                    _nearest(from, target) {
                        let d = target - Math.round(from);
                        if (d > this.n / 2) d -= this.n;
                        if (d < -this.n / 2) d += this.n;
                        return Math.round(from) + d;
                    }

                    _mod(i, n) { return ((i % n) + n) % n; }

                    _render(markActive = false) {
                        const span = this.slideW + this.state.gap;
                        const tiltX = parseFloat(this.root.style.getPropertyValue("--mzaTiltX") || 0);
                        const tiltY = parseFloat(this.root.style.getPropertyValue("--mzaTiltY") || 0);
                        for (let i = 0; i < this.n; i++) {
                            let d = i - this.state.pos;
                            if (d > this.n / 2) d -= this.n;
                            if (d < -this.n / 2) d += this.n;
                            const weight = Math.max(0, 1 - Math.abs(d) * 2);
                            const biasActive = -this.slideW * this.opts.activeLeftBias * weight;
                            const tx = d * span + biasActive;
                            const depth = -Math.abs(d) * this.opts.zDepth;
                            const rot = -d * this.opts.rotateY;
                            const scale = 1 - Math.min(Math.abs(d) * this.opts.scaleDrop, 0.42);
                            const blur = Math.min(Math.abs(d) * this.opts.blurMax, this.opts.blurMax);
                            const z = Math.round(1000 - Math.abs(d) * 10);
                            const s = this.slides[i];
                            if (this.isFF) {
                                s.style.transform = `translate(${tx}px,-50%) scale(${scale})`;
                                s.style.filter = "none";
                            } else {
                                s.style.transform = `translate3d(${tx}px,-50%,${depth}px) rotateY(${rot}deg) scale(${scale})`;
                                s.style.filter = `blur(${blur}px)`;
                            }
                            s.style.zIndex = z;
                            if (markActive) s.dataset.state = Math.round(this.state.index) === i ? "active" : "rest";
                            const card = s.querySelector(".mzaCard");
                            const parBase = Math.max(-1, Math.min(1, -d));
                            const parX = parBase * 48 + tiltY * 2.0;
                            const parY = tiltX * -1.5;
                            card.style.setProperty("--mzaParX", `${parX.toFixed(2)}px`);
                            card.style.setProperty("--mzaParY", `${parY.toFixed(2)}px`);
                        }
                    }

                    // Desliga o carrossel de forma limpa (usado ao cruzar o breakpoint mobile)
                    destroy() {
                        cancelAnimationFrame(this.state.rafId);
                        this.ro?.disconnect();
                        this.prevBtn.removeEventListener("click", this._onPrev);
                        this.nextBtn.removeEventListener("click", this._onNext);
                        this.root.removeEventListener("keydown", this._onKeydown);
                        this.viewport.removeEventListener("pointerdown", this._onDragStartBound);
                        this.viewport.removeEventListener("pointermove", this._onDragMoveBound);
                        this.viewport.removeEventListener("pointerup", this._onDragEndBound);
                        this.viewport.removeEventListener("pointercancel", this._onDragEndBound);
                        this.viewport.removeEventListener("pointermove", this._onTiltBound);
                        this.root.removeEventListener("mouseenter", this._onEnter);
                        this.root.removeEventListener("mouseleave", this._onLeave);
                        this.slides.forEach(s => {
                            s.style.transform = "";
                            s.style.filter = "";
                            s.style.zIndex = "";
                            delete s.dataset.state;
                        });
                        this.pagination.innerHTML = "";
                    }
                }

                // Só roda o carrossel 3D em telas acima de 900px; no mobile, ficam cards empilhados
                const el = document.getElementById("mzaCarousel");
                if (!el) return;

                const mq = window.matchMedia("(min-width: 901px)");
                let instance = null;

                function sync(e) {
                    if (e.matches && !instance) {
                        instance = new MzaCarousel(el);
                    } else if (!e.matches && instance) {
                        instance.destroy();
                        instance = null;
                    }
                }

                if (mq.addEventListener) mq.addEventListener("change", sync);
                else mq.addListener(sync);
                sync(mq);
            })();

            (function () {
                const phoneInput = document.getElementById('telefone');
                if (!phoneInput) return;

                phoneInput.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, ''); // Remove tudo o que não for dígito

                    if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos

                    // Aplica a máscara dinamicamente (suporta fixo com 10 dígitos e celular com 11)
                    if (value.length <= 2) {
                        value = value.length ? `(${value}` : '';
                    } else if (value.length <= 6) {
                        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                    } else if (value.length <= 10) {
                        value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
                    } else {
                        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
                    }

                    e.target.value = value;
                });
            })();

            // Status "aberto/fechado" calculado no fuso de Natal/RN, não no do visitante
            (function () {
                const statusEl = document.getElementById('footerStatus');
                const labelEl = document.getElementById('footerStatusLabel');
                if (!statusEl || !labelEl) return;

                const nowRN = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Fortaleza' }));
                const day = nowRN.getDay();
                const hour = nowRN.getHours();
                const isOpen = day >= 1 && day <= 5 && hour >= 8 && hour < 18;

                statusEl.dataset.open = String(isOpen);
                labelEl.textContent = isOpen ? 'Aberto agora' : 'Fechado no momento';
            })();

            // Reveal em cascata do footer ao entrar na viewport
            (function () {
                const revealEls = document.querySelectorAll('.footer .reveal');
                if (!revealEls.length) return;

                const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                if (prefersReducedMotion) {
                    revealEls.forEach(el => el.classList.add('is-visible'));
                    return;
                }

                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible');
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

                revealEls.forEach(el => observer.observe(el));
            })();
