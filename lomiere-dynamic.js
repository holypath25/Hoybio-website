/* ============================================================
   LOMIERE Dynamic Layer
   모든 페이지 공용 — </body> 직전에 <script src="lomiere-dynamic.js" defer>
   골드 파티클 · 패럴랙스 · 카운트업 · 3D 틸트 · 마그네틱 버튼
   스크롤 진행바 · 커서 글로우 · 페이지 전환 페이드
   ============================================================ */
(function () {
    'use strict';

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ── 0. 공용 CSS 주입 ─────────────────────────────── */
    var css = [
        /* 리빌 업그레이드: 블러 + 정교한 이징 */
        '.reveal{opacity:0;transform:translateY(42px);filter:blur(10px);',
        'transition:opacity 1.1s cubic-bezier(.16,1,.3,1),transform 1.1s cubic-bezier(.16,1,.3,1),filter 1.1s cubic-bezier(.16,1,.3,1);}',
        '.reveal.visible{opacity:1;transform:translateY(0);filter:blur(0);}',

        /* 스크롤 진행바 */
        '#lmProgress{position:fixed;top:0;left:0;height:2px;width:0%;z-index:2000;pointer-events:none;',
        'background:linear-gradient(to right,#B5924C,#E8D5A8);box-shadow:0 0 8px rgba(181,146,76,.55);transition:width .1s linear;}',

        /* 페이지 전환 페이드 */
        'body{animation:lmPageIn .8s ease both;}',
        '@keyframes lmPageIn{from{opacity:0}to{opacity:1}}',
        'body.lm-leaving{opacity:0;transition:opacity .35s ease;}',

        /* 파티클 캔버스 */
        '.lm-particles{position:absolute;inset:0;pointer-events:none;z-index:2;}',

        /* 카드 틸트 + 골드 하이라이트 */
        '.lm-tilt{transform-style:preserve-3d;will-change:transform;position:relative;',
        'transition:transform .5s cubic-bezier(.16,1,.3,1),box-shadow .5s ease;}',
        '.lm-tilt::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .4s ease;',
        'background:radial-gradient(480px circle at var(--lm-x,50%) var(--lm-y,50%),rgba(212,175,111,.16),transparent 65%);}',
        '.lm-tilt:hover::after{opacity:1;}',
        '.lm-tilt:hover{box-shadow:0 24px 60px -24px rgba(37,32,24,.28);}',

        /* 이미지 Ken Burns (스크롤 진입 시 서서히 줌아웃) */
        '.story-img-col{overflow:hidden;}',
        '.story-img-col img{will-change:transform;transition:transform .2s linear;}',

        /* 골드 디바이더 시머 */
        '.hero-divider,.section-title+.hero-divider{position:relative;overflow:hidden;}',
        '.hero-divider::after{content:"";position:absolute;inset:0;',
        'background:linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent);',
        'transform:translateX(-100%);animation:lmShimmer 3.2s ease-in-out infinite;}',
        '@keyframes lmShimmer{0%{transform:translateX(-100%)}55%,100%{transform:translateX(100%)}}',

        /* 히어로 title의 금색 이탤릭 글자에 은은한 광택 순환 */
        '.hero-title em,.section-title em{background:linear-gradient(110deg,#B5924C 20%,#EAD9AC 42%,#B5924C 60%);',
        'background-size:220% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;',
        'animation:lmGoldFlow 5.5s ease-in-out infinite;}',
        '@keyframes lmGoldFlow{0%,100%{background-position:100% 0}50%{background-position:0% 0}}',

        /* 마퀴: 호버 시 일시정지 */
        '.marquee-strip:hover .marquee-inner{animation-play-state:paused;}',

        /* 커서 글로우 */
        '#lmCursorGlow{position:fixed;top:0;left:0;width:520px;height:520px;pointer-events:none;z-index:1;',
        'border-radius:50%;background:radial-gradient(circle,rgba(212,175,111,.10) 0%,rgba(212,175,111,.04) 40%,transparent 70%);',
        'transform:translate(-50%,-50%);mix-blend-mode:multiply;}',

        /* 버튼 마그네틱 준비 */
        '.btn{will-change:transform;}',

        /* 감속 모션 환경: 애니메이션 최소화 */
        '@media (prefers-reduced-motion: reduce){',
        '.reveal{opacity:1!important;transform:none!important;filter:none!important;transition:none!important;}',
        '.hero-divider::after,.hero-title em,.section-title em{animation:none!important;}',
        'body{animation:none;}}'
    ].join('');
    var styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    if (reducedMotion) return; // 이하 동적 효과는 모두 건너뜀

    /* ── 1. 스크롤 진행바 ─────────────────────────────── */
    var progress = document.createElement('div');
    progress.id = 'lmProgress';
    document.body.appendChild(progress);

    /* ── 2. 페이지 전환 페이드 ────────────────────────── */
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        var href = a.getAttribute('href');
        if (!href || href.charAt(0) === '#' || a.target === '_blank') return;
        if (!/\.html(\?|#|$)/i.test(href)) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        document.body.classList.add('lm-leaving');
        setTimeout(function () { window.location.href = href; }, 320);
    });
    // 뒤로가기(bfcache) 복원 시 페이드 상태 해제
    window.addEventListener('pageshow', function () {
        document.body.classList.remove('lm-leaving');
    });

    /* ── 3. 골드 파티클 (히어로 영역) ─────────────────── */
    var hero = document.querySelector(
        '#hero,#about-hero,#product-hero,#partnership-hero,#contact-hero,#story-hero'
    );
    var particleState = { running: false };
    if (hero) {
        if (getComputedStyle(hero).position === 'static') hero.style.position = 'relative';
        var canvas = document.createElement('canvas');
        canvas.className = 'lm-particles';
        hero.appendChild(canvas);
        var ctx = canvas.getContext('2d');
        var particles = [];
        var COUNT = Math.min(46, Math.floor(window.innerWidth / 30));

        function resizeCanvas() {
            canvas.width = hero.clientWidth;
            canvas.height = hero.clientHeight;
        }
        function makeParticle(fresh) {
            return {
                x: Math.random() * canvas.width,
                y: fresh ? canvas.height + 10 : Math.random() * canvas.height,
                r: 0.6 + Math.random() * 1.8,
                vy: 0.12 + Math.random() * 0.35,
                vx: (Math.random() - 0.5) * 0.15,
                phase: Math.random() * Math.PI * 2,
                twinkle: 0.008 + Math.random() * 0.02
            };
        }
        function initParticles() {
            particles = [];
            for (var i = 0; i < COUNT; i++) particles.push(makeParticle(false));
        }
        function drawParticles() {
            if (!particleState.running) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                p.y -= p.vy;
                p.x += p.vx + Math.sin(p.phase) * 0.12;
                p.phase += p.twinkle;
                if (p.y < -12) particles[i] = p = makeParticle(true);
                var alpha = 0.25 + Math.abs(Math.sin(p.phase * 2)) * 0.45;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(222,186,120,' + alpha.toFixed(2) + ')';
                ctx.shadowBlur = 6;
                ctx.shadowColor = 'rgba(212,175,111,.8)';
                ctx.fill();
            }
            requestAnimationFrame(drawParticles);
        }
        resizeCanvas();
        initParticles();
        window.addEventListener('resize', function () { resizeCanvas(); });
        // 히어로가 화면에 있을 때만 렌더 (성능)
        new IntersectionObserver(function (entries) {
            var visible = entries[0].isIntersecting;
            if (visible && !particleState.running) {
                particleState.running = true;
                drawParticles();
            } else if (!visible) {
                particleState.running = false;
            }
        }, { threshold: 0.05 }).observe(hero);
    }

    /* ── 4. 패럴랙스 (rAF 스로틀) ─────────────────────── */
    var heroVideo = document.querySelector('.hero-video');
    var parallaxImgs = Array.prototype.slice.call(
        document.querySelectorAll('.story-img-col img')
    );
    parallaxImgs.forEach(function (img) {
        img.style.transform = 'scale(1.15)';
    });
    var ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            ticking = false;
            var sy = window.scrollY;
            // 진행바
            var max = document.documentElement.scrollHeight - window.innerHeight;
            progress.style.width = (max > 0 ? (sy / max) * 100 : 0) + '%';
            // 히어로 비디오: 은은한 패럴랙스 + 줌
            if (heroVideo) {
                var h = window.innerHeight;
                var t = Math.min(sy / h, 1);
                heroVideo.style.transform =
                    'translateY(' + (t * 60).toFixed(1) + 'px) scale(' + (1 + t * 0.08).toFixed(3) + ')';
            }
            // 스토리 이미지: 뷰포트 내 위치 기반 패럴랙스
            parallaxImgs.forEach(function (img) {
                var rect = img.parentElement.getBoundingClientRect();
                if (rect.bottom < 0 || rect.top > window.innerHeight) return;
                var progress01 = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
                var shift = (progress01 - 0.5) * 60; // -30 ~ +30px
                img.style.transform = 'scale(1.15) translateY(' + shift.toFixed(1) + 'px)';
            });
        });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ── 5. 숫자 카운트업 (.stat-num) ─────────────────── */
    var statNums = document.querySelectorAll('.stat-num');
    if (statNums.length) {
        var countObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                countObserver.unobserve(entry.target);
                var el = entry.target;
                var m = el.textContent.trim().match(/^(\d+)(.*)$/);
                if (!m) return; // "GMP", "K" 등 숫자 아님 → 그대로
                var target = parseInt(m[1], 10);
                var suffix = m[2] || '';
                var dur = 1400, start = null;
                function step(ts) {
                    if (!start) start = ts;
                    var p = Math.min((ts - start) / dur, 1);
                    var eased = 1 - Math.pow(1 - p, 3);
                    el.textContent = Math.round(target * eased) + suffix;
                    if (p < 1) requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
            });
        }, { threshold: 0.5 });
        statNums.forEach(function (el) { countObserver.observe(el); });
    }

    /* ── 6. 3D 틸트 카드 ──────────────────────────────── */
    if (finePointer) {
        var tiltTargets = document.querySelectorAll(
            '.explore-card,.tech-card,.partner-card,.effect-card'
        );
        tiltTargets.forEach(function (card) {
            card.classList.add('lm-tilt');
            var raf = null;
            card.addEventListener('pointermove', function (e) {
                if (raf) return;
                raf = requestAnimationFrame(function () {
                    raf = null;
                    var r = card.getBoundingClientRect();
                    var px = (e.clientX - r.left) / r.width;
                    var py = (e.clientY - r.top) / r.height;
                    card.style.setProperty('--lm-x', (px * 100).toFixed(1) + '%');
                    card.style.setProperty('--lm-y', (py * 100).toFixed(1) + '%');
                    var rx = (0.5 - py) * 5;
                    var ry = (px - 0.5) * 5;
                    card.style.transform =
                        'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-4px)';
                });
            });
            card.addEventListener('pointerleave', function () {
                card.style.transform = '';
            });
        });
    }

    /* ── 7. 마그네틱 버튼 ─────────────────────────────── */
    if (finePointer) {
        document.querySelectorAll('.btn').forEach(function (btn) {
            btn.addEventListener('pointermove', function (e) {
                var r = btn.getBoundingClientRect();
                var dx = e.clientX - (r.left + r.width / 2);
                var dy = e.clientY - (r.top + r.height / 2);
                btn.style.transform = 'translate(' + (dx * 0.18).toFixed(1) + 'px,' + (dy * 0.3).toFixed(1) + 'px)';
            });
            btn.addEventListener('pointerleave', function () {
                btn.style.transition = 'transform .45s cubic-bezier(.16,1,.3,1)';
                btn.style.transform = '';
                setTimeout(function () { btn.style.transition = ''; }, 450);
            });
        });
    }

    /* ── 8. 커서 글로우 ───────────────────────────────── */
    if (finePointer) {
        var glow = document.createElement('div');
        glow.id = 'lmCursorGlow';
        glow.style.opacity = '0';
        document.body.appendChild(glow);
        var gx = 0, gy = 0, tx = 0, ty = 0, glowRunning = false;
        function glowLoop() {
            gx += (tx - gx) * 0.12;
            gy += (ty - gy) * 0.12;
            glow.style.left = gx + 'px';
            glow.style.top = gy + 'px';
            if (Math.abs(tx - gx) > 0.3 || Math.abs(ty - gy) > 0.3) {
                requestAnimationFrame(glowLoop);
            } else {
                glowRunning = false;
            }
        }
        document.addEventListener('pointermove', function (e) {
            tx = e.clientX; ty = e.clientY;
            glow.style.opacity = '1';
            if (!glowRunning) { glowRunning = true; requestAnimationFrame(glowLoop); }
        }, { passive: true });
        document.addEventListener('pointerleave', function () {
            glow.style.opacity = '0';
        });
    }
})();
