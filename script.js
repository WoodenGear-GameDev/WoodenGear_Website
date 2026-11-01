document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const header = document.querySelector('.site-header');

    function updateResponsiveScale() {
        const vw = window.innerWidth;

        const logoScale = Math.min(1, (vw - 24) / 780);
        const devScale = Math.min(1, (vw - 16) / 1340);
        const poetryScale = Math.min(1, vw / 1600);

        root.style.setProperty('--logo-scale', logoScale.toFixed(4));
        root.style.setProperty('--dev-scale', devScale.toFixed(4));
        root.style.setProperty('--poetry-scale', poetryScale.toFixed(4));

        if (header) {
            header.style.height = `${Math.round(345 * logoScale + 48)}px`;
        }
    }

    window.addEventListener('resize', updateResponsiveScale);
    updateResponsiveScale();

    const cluster = document.querySelector('.content__gear-cluster');
    const gearChain = document.querySelector('.gear-chain');
    const devMoreBtn = document.querySelector('.dev__more-btn');

    let gearAngle = 0;
    let gearSpeed = 0.2;
    let gearTargetSpeed = 0.2;

    if (devMoreBtn) {
        devMoreBtn.addEventListener('mouseenter', () => { gearTargetSpeed = 1; });
        devMoreBtn.addEventListener('mouseleave', () => { gearTargetSpeed = 0.2; });
    }

    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (gearChain) {
            gearTargetSpeed = 0.85;
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => { gearTargetSpeed = 0.2; }, 180);
        }
    }, { passive: true });

    const wheelMesh = document.querySelector('.poetry__wheel-mesh');
    const oilStream = document.querySelector('.poetry__oil-stream');
    const poetryBtn = document.querySelector('.poetry__more-btn');

    let wheelAngle = 0;
    let wheelSpeed = 0.18;
    let wheelTargetSpeed = 0.18;
    let oilPos = 0;
    let oilSpeed = 1.2;
    let oilTargetSpeed = 1.2;
    const viscosity = 0.015;

    if (poetryBtn) {
        poetryBtn.addEventListener('mouseenter', () => {
            wheelTargetSpeed = 0.6;
            oilTargetSpeed = 3.6;
        });
        poetryBtn.addEventListener('mouseleave', () => {
            wheelTargetSpeed = 0.18;
            oilTargetSpeed = 1.2;
        });
    }

    function loop() {
        gearSpeed += (gearTargetSpeed - gearSpeed) * 0.05;
        gearAngle = (gearAngle + gearSpeed) % 360;

        if (cluster) cluster.style.setProperty('--gear-deg', `${gearAngle}deg`);
        if (gearChain) gearChain.style.setProperty('--gear-deg', `${gearAngle}deg`);

        if (wheelMesh) {
            wheelSpeed += (wheelTargetSpeed - wheelSpeed) * viscosity;
            wheelAngle = (wheelAngle + wheelSpeed) % 360;
            wheelMesh.style.setProperty('--wheel-deg', `${wheelAngle}deg`);
        }

        if (oilStream) {
            oilSpeed += (oilTargetSpeed - oilSpeed) * viscosity;
            oilPos = (oilPos + oilSpeed) % 280;
            oilStream.style.setProperty('--oil-pos', `${oilPos}px`);
        }

        requestAnimationFrame(loop);
    }
    loop();

    const heroCanvas = document.getElementById('heroCanvas');
    if (heroCanvas) {
        const ctx = heroCanvas.getContext('2d');
        let action = 'idle';
        let tick = 0;

        document.querySelectorAll('[data-hero-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-hero-action]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                action = btn.dataset.heroAction;
            });
        });

        function drawHero() {
            tick += 0.08;
            ctx.fillStyle = '#121318';
            ctx.fillRect(0, 0, 330, 330);

            ctx.fillStyle = '#1c1917';
            ctx.fillRect(0, 235, 330, 95);
            ctx.fillStyle = '#3f6212';
            ctx.fillRect(0, 228, 330, 8);

            const bob = Math.sin(tick * 2) * 4;
            const hx = 130, hy = 145 + bob;

            if (action === 'chop') {
                const shake = Math.sin(tick * 6) > 0.7 ? 3 : 0;
                ctx.fillStyle = '#78350f';
                ctx.fillRect(210 + shake, 120, 22, 110);
                ctx.fillStyle = '#15803d';
                ctx.beginPath();
                ctx.arc(221 + shake, 105, 42, 0, Math.PI * 2);
                ctx.fill();
            } else if (action === 'cook') {
                ctx.fillStyle = '#78350f';
                ctx.fillRect(195, 215, 46, 12);
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.arc(218, 204 + Math.sin(tick * 5) * 4, 18, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(218, 198, 9, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = '#52525b';
            ctx.fillRect(hx - 14, 195, 11, 35);
            ctx.fillRect(hx + 5, 195, 11, 35);
            ctx.fillStyle = '#92400e';
            ctx.fillRect(hx - 20, hy + 10, 42, 46);
            ctx.fillStyle = '#fde68a';
            ctx.fillRect(hx - 15, hy - 20, 32, 30);
            ctx.fillStyle = '#a1a1aa';
            ctx.fillRect(hx - 18, hy - 26, 38, 12);

            ctx.save();
            ctx.translate(hx + 16, hy + 22);
            const swing = action === 'chop' ? Math.sin(tick * 6) * 0.95 : Math.sin(tick) * 0.15;
            ctx.rotate(swing);
            ctx.fillStyle = '#d97706';
            ctx.fillRect(0, -5, 34, 8);
            ctx.fillStyle = '#e4e4e7';
            ctx.fillRect(26, -16, 11, 22);
            ctx.restore();

            requestAnimationFrame(drawHero);
        }
        drawHero();
    }

    const paintCanvas = document.getElementById('paintCanvas');
    if (paintCanvas) {
        const ctx = paintCanvas.getContext('2d');
        let drawing = false;
        let brushColor = '#d97706';
        let brushSize = 4;

        ctx.fillStyle = '#121215';
        ctx.fillRect(0, 0, 330, 330);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        function getPos(e) {
            const rect = paintCanvas.getBoundingClientRect();
            return {
                x: (e.clientX - rect.left) * (paintCanvas.width / rect.width),
                y: (e.clientY - rect.top) * (paintCanvas.height / rect.height)
            };
        }

        paintCanvas.addEventListener('pointerdown', e => {
            drawing = true;
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        });

        paintCanvas.addEventListener('pointermove', e => {
            if (!drawing) return;
            const pos = getPos(e);
            ctx.strokeStyle = brushColor;
            ctx.lineWidth = brushSize;
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        });

        window.addEventListener('pointerup', () => { drawing = false; });

        document.querySelectorAll('.color-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                brushColor = dot.dataset.color;
            });
        });

        document.querySelectorAll('[data-size]').forEach(btn => {
            btn.addEventListener('click', () => {
                brushSize = Number(btn.dataset.size);
            });
        });

        const clearBtn = document.getElementById('clearPaintBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                ctx.fillStyle = '#121215';
                ctx.fillRect(0, 0, 330, 330);
            });
        }
    }

    const ledCanvas = document.getElementById('ledPongCanvas');
    if (ledCanvas) {
        const ctx = ledCanvas.getContext('2d');
        const pongScoreBadge = document.getElementById('pongScoreBadge');
        const startBtn = document.getElementById('pongStartBtn');
        const resetBtn = document.getElementById('pongResetBtn');
        const pongUp = document.getElementById('pongUp');
        const pongDown = document.getElementById('pongDown');

        const COLS = 8, ROWS = 8;
        const PADDLE_H = 3;

        let p1Y = 2;
        let p2Y = 2;
        let ball = { x: 3.5, y: 3.5, vx: 0.065, vy: 0.045 };
        let s1 = 0, s2 = 0;

        let isRunning = false;
        let blinkTick = 0;

        const boardOffset = 57;
        const cellStep = 27;

        function resetBall(dir = 1) {
            ball.x = 3.5;
            ball.y = 3.5;
            ball.vx = 0.065 * dir;
            ball.vy = (Math.random() > 0.5 ? 1 : -1) * 0.045;
        }

        function setRunningState(state) {
            isRunning = state;
            if (startBtn) {
                startBtn.textContent = isRunning ? '⏸ Пауза' : '▶ Подача';
                startBtn.classList.toggle('active', !isRunning);
            }
        }

        function updateScoreText() {
            if (pongScoreBadge) pongScoreBadge.textContent = `Счёт: ${s1} : ${s2}`;
        }

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                setRunningState(!isRunning);
            });
        }

        ledCanvas.addEventListener('click', () => {
            if (!isRunning) setRunningState(true);
        });

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                s1 = 0;
                s2 = 0;
                p1Y = 2;
                p2Y = 2;
                updateScoreText();
                resetBall(1);
                setRunningState(false);
            });
        }

        ledCanvas.addEventListener('pointermove', e => {
            const rect = ledCanvas.getBoundingClientRect();
            const canvasY = (e.clientY - rect.top) * (ledCanvas.height / rect.height);
            const row = Math.floor((canvasY - boardOffset) / cellStep) - 1;
            p1Y = Math.max(0, Math.min(ROWS - PADDLE_H, row));
        });

        if (pongUp) pongUp.addEventListener('click', () => { p1Y = Math.max(0, p1Y - 1); });
        if (pongDown) pongDown.addEventListener('click', () => { p1Y = Math.min(ROWS - PADDLE_H, p1Y + 1); });

        function drawLedPong() {
            blinkTick += 0.08;

            if (isRunning) {
                ball.x += ball.vx;
                ball.y += ball.vy;

                if (ball.y <= 0) { 
                    ball.y = 0; 
                    ball.vy = Math.abs(ball.vy) + (Math.random() * 0.008); 
                }
                if (ball.y >= ROWS - 1) { 
                    ball.y = ROWS - 1; 
                    ball.vy = -Math.abs(ball.vy) - (Math.random() * 0.008); 
                }

                const targetY = ball.y - 1 + (Math.sin(blinkTick * 1.5) * 0.35);
                if (p2Y < targetY - 0.1) p2Y = Math.min(ROWS - PADDLE_H, p2Y + 0.038);
                if (p2Y > targetY + 0.1) p2Y = Math.max(0, p2Y - 0.038);

                const p1 = Math.round(p1Y);
                const p2 = Math.round(p2Y);

                if (ball.vx < 0 && ball.x <= 1.05 && ball.x >= 0.4) {
                    if (Math.round(ball.y) >= p1 && Math.round(ball.y) < p1 + PADDLE_H) {
                        ball.vx = Math.abs(ball.vx);
                        ball.vy += (Math.random() - 0.5) * 0.03;
                    }
                }

                if (ball.vx > 0 && ball.x >= COLS - 2.05 && ball.x <= COLS - 1.4) {
                    if (Math.round(ball.y) >= p2 && Math.round(ball.y) < p2 + PADDLE_H) {
                        ball.vx = -Math.abs(ball.vx);
                        ball.vy += (Math.random() - 0.5) * 0.03;
                    }
                }

                if (ball.x < -0.3) {
                    s2++;
                    updateScoreText();
                    resetBall(1);
                    setRunningState(false);
                } else if (ball.x > COLS - 0.7) {
                    s1++;
                    updateScoreText();
                    resetBall(-1);
                    setRunningState(false);
                }
            }

            ctx.fillStyle = '#09090b';
            ctx.fillRect(0, 0, 330, 330);

            ctx.fillStyle = '#111318';
            ctx.strokeStyle = '#27272a';
            ctx.lineWidth = 2;
            ctx.strokeRect(boardOffset - 6, boardOffset - 6, COLS * cellStep + 12, ROWS * cellStep + 12);
            ctx.fillRect(boardOffset - 6, boardOffset - 6, COLS * cellStep + 12, ROWS * cellStep + 12);

            const bx = Math.round(ball.x);
            const by = Math.round(ball.y);
            const p1 = Math.round(p1Y);
            const p2 = Math.round(p2Y);

            const ballVisible = isRunning || Math.sin(blinkTick * 2.5) > -0.3;

            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const isLeftPaddle = (c === 0 && r >= p1 && r < p1 + PADDLE_H);
                    const isRightPaddle = (c === COLS - 1 && r >= p2 && r < p2 + PADDLE_H);
                    const isBall = (c === bx && r === by) && ballVisible;

                    const cx = boardOffset + c * cellStep + cellStep / 2;
                    const cy = boardOffset + r * cellStep + cellStep / 2;

                    ctx.beginPath();
                    ctx.arc(cx, cy, 9.5, 0, Math.PI * 2);

                    if (isBall || isLeftPaddle || isRightPaddle) {
                        ctx.fillStyle = '#ef4444';
                        ctx.shadowColor = '#ef4444';
                        ctx.shadowBlur = 8;
                    } else {
                        ctx.fillStyle = '#261619';
                        ctx.shadowBlur = 0;
                    }
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            requestAnimationFrame(drawLedPong);
        }
        drawLedPong();
    }

    const flywheelGear = document.getElementById('flywheelGear');
    const flywheelNumbers = document.getElementById('flywheelNumbers');
    const tocList = document.getElementById('tocList');

    if (flywheelGear && flywheelNumbers && tocList) {
        const POETRY_DATA = {
            collections: [
                {
                    id: 'woodengear',
                    title: 'I. WoodenGear',
                    cover: 'assets/img/poems/wg_page_001.webp',
                    chapters: [
                        { title: 'Глава I Pt. 1: WoodenGear', startPage: 5 },
                        { title: 'Глава I Pt. 2: Жуткий лес', startPage: 15 },
                        { title: 'Глава II Pt. 1: Мир больше не десткий', startPage: 23 },
                        { title: 'Глава II Pt. 2: Весь мазут течет из детства', startPage: 30 },
                        { title: 'Глава III Pt. 1: Чистилище', startPage: 38 },
                        { title: 'Глава III Pt. 2: Путь', startPage: 49 }
                    ],
                    pages: [
                        'assets/img/poems/wg_page_002.webp',
                        'assets/img/poems/wg_page_003.webp',
                        'assets/img/poems/wg_page_004.webp',
                        'assets/img/poems/wg_page_005.webp',
                        'assets/img/poems/wg_page_006.webp',
                        'assets/img/poems/wg_page_007.webp',
                        'assets/img/poems/wg_page_008.webp',
                        'assets/img/poems/wg_page_009.webp',
                        'assets/img/poems/wg_page_010.webp',
                        'assets/img/poems/wg_page_011.webp',
                        'assets/img/poems/wg_page_012.webp',
                        'assets/img/poems/wg_page_013.webp',
                        'assets/img/poems/wg_page_014.webp',
                        'assets/img/poems/wg_page_015.webp',
                        'assets/img/poems/wg_page_016.webp',
                        'assets/img/poems/wg_page_017.webp',
                        'assets/img/poems/wg_page_018.webp',
                        'assets/img/poems/wg_page_019.webp',
                        'assets/img/poems/wg_page_020.webp',
                        'assets/img/poems/wg_page_021.webp',
                        'assets/img/poems/wg_page_022.webp',
                        'assets/img/poems/wg_page_023.webp',
                        'assets/img/poems/wg_page_024.webp',
                        'assets/img/poems/wg_page_025.webp',
                        'assets/img/poems/wg_page_026.webp',
                        'assets/img/poems/wg_page_027.webp',
                        'assets/img/poems/wg_page_028.webp',
                        'assets/img/poems/wg_page_029.webp',
                        'assets/img/poems/wg_page_030.webp',
                        'assets/img/poems/wg_page_031.webp',
                        'assets/img/poems/wg_page_032.webp',
                        'assets/img/poems/wg_page_033.webp',
                        'assets/img/poems/wg_page_034.webp',
                        'assets/img/poems/wg_page_035.webp',
                        'assets/img/poems/wg_page_036.webp',
                        'assets/img/poems/wg_page_037.webp',
                        'assets/img/poems/wg_page_038.webp',
                        'assets/img/poems/wg_page_039.webp',
                        'assets/img/poems/wg_page_040.webp',
                        'assets/img/poems/wg_page_041.webp',
                        'assets/img/poems/wg_page_042.webp',
                        'assets/img/poems/wg_page_043.webp',
                        'assets/img/poems/wg_page_044.webp',
                        'assets/img/poems/wg_page_045.webp',
                        'assets/img/poems/wg_page_046.webp',
                        'assets/img/poems/wg_page_047.webp',
                        'assets/img/poems/wg_page_048.webp',
                        'assets/img/poems/wg_page_049.webp',
                        'assets/img/poems/wg_page_050.webp',
                        'assets/img/poems/wg_page_051.webp',
                        'assets/img/poems/wg_page_052.webp',
                        'assets/img/poems/wg_page_053.webp',
                        'assets/img/poems/wg_page_054.webp',
                        'assets/img/poems/wg_page_055.webp',
                        'assets/img/poems/wg_page_056.webp'
                    ]
                },
                {
                    id: 'castle',
                    title: 'II. Непримечательный замок',
                    cover: '',
                    chapters: [
                        { title: 'Непримечательный замок', startPage: 1 },
                    ],
                    pages: [
                        'assets/img/poems/csl_page_001.webp',
                        'assets/img/poems/csl_page_002.webp',
                        'assets/img/poems/csl_page_003.webp',
                        'assets/img/poems/csl_page_004.webp',
                        'assets/img/poems/csl_page_005.webp'
                    ]
                }
            ],
            singles: [
                {
                    id: 'rain',
                    title: 'Дождь',
                    cover: '',
                    pages: [
                        'assets/img/poems/poem_page_004.webp',
                        'assets/img/poems/poem_page_005.webp'
                    ]
                },
                {
                    id: 'from_above',
                    title: 'Свыше',
                    cover: '',
                    pages: [
                        'assets/img/poems/poem_page_001.webp'
                    ]
                },
                {
                    id: 'writer',
                    title: 'Писатель',
                    cover: '',
                    pages: [
                        'assets/img/poems/poem_page_002.webp',
                    ]
                },
                {
                    id: 'cat',
                    title: 'Котенок',
                    cover: '',
                    pages: [
                        'assets/img/poems/poem_page_003.webp'
                    ]
                }
            ]
        };

        const TOOTH_OFFSETS = [
            0.0, 18.05, 35.1, 52, 69.7, 90.25, 109.7,
            128.05, 145, 161.95, 180.0, 197.65, 214.4, 230.6,
            250.45, 269.95, 289.55, 309.4, 325.6, 342.35
        ];
        const TEETH_COUNT = TOOTH_OFFSETS.length;
        const NUMBER_RADIUS = 698;

        function getToothAngle(pageIndexZeroBased) {
            const fullTurns = Math.floor(pageIndexZeroBased / TEETH_COUNT);
            const rem = ((pageIndexZeroBased % TEETH_COUNT) + TEETH_COUNT) % TEETH_COUNT;
            return fullTurns * 360 + TOOTH_OFFSETS[rem];
        }

        const bookShelf = document.getElementById('bookShelf');
        const bookSelectorWrap = document.getElementById('bookSelectorWrap');
        const prevBookBtn = document.getElementById('prevBookBtn');
        const nextBookBtn = document.getElementById('nextBookBtn');
        const tocTitle = document.getElementById('tocTitle');
        const tocModeGear = document.getElementById('tocModeGear');
        const poemSheet = document.getElementById('poemSheet');
        const poemPageImg = document.getElementById('poemPageImg');
        const placeholderBadge = document.getElementById('placeholderBadge');
        const placeholderTitle = document.getElementById('placeholderTitle');
        const placeholderPath = document.getElementById('placeholderPath');
        const placeholderPage = document.getElementById('placeholderPage');
        const pageIndicator = document.getElementById('pageIndicator');
        const prevPageBtn = document.getElementById('prevPageBtn');
        const nextPageBtn = document.getElementById('nextPageBtn');
        const flywheelArea = document.getElementById('flywheelArea');

        let currentMode = 'collections';
        let currentBookIndex = 0;
        let currentSingleIndex = 0;
        let currentPage = 1;

        let wheelCurrentDeg = 0;
        let wheelTargetDeg = 0;

        function getActivePages() {
            if (currentMode === 'collections') {
                const book = POETRY_DATA.collections[currentBookIndex];
                return book.cover ? [book.cover, ...book.pages] : book.pages;
            }
            return POETRY_DATA.singles[currentSingleIndex].pages;
        }

        function hasCover() {
            if (currentMode === 'collections') {
                return !!POETRY_DATA.collections[currentBookIndex].cover;
            }
            return false;
        }

        function formatPageLabel(pageIndex) {
            if (hasCover() && pageIndex === 0) return 'Обл';
            return hasCover() ? pageIndex : pageIndex + 1;
        }

        function getCurrentChapterTitle(page) {
            if (currentMode === 'singles') {
                return POETRY_DATA.singles[currentSingleIndex].title;
            }
            const book = POETRY_DATA.collections[currentBookIndex];
            const chapters = book.chapters;
            const coverOffset = book.cover ? 1 : 0;
            const effectivePage = page - coverOffset;

            let activeChap = chapters[0].title;
            for (const ch of chapters) {
                if (effectivePage >= ch.startPage) activeChap = ch.title;
            }
            return activeChap;
        }

        function selectBook(index) {
            const totalBooks = POETRY_DATA.collections.length;
            currentBookIndex = ((index % totalBooks) + totalBooks) % totalBooks;
            if (tocModeGear) {
                tocModeGear.style.transform = `rotate(${currentBookIndex * 90}deg)`;
            }
            goToPage(1);
        }

        if (prevBookBtn) prevBookBtn.addEventListener('click', () => selectBook(currentBookIndex - 1));
        if (nextBookBtn) nextBookBtn.addEventListener('click', () => selectBook(currentBookIndex + 1));

        function renderTOC() {
            tocList.innerHTML = '';

            if (currentMode === 'collections') {
                if (bookShelf) bookShelf.style.display = 'block';
                bookSelectorWrap.innerHTML = '';

                POETRY_DATA.collections.forEach((book, idx) => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = `reader-book-btn ${idx === currentBookIndex ? 'active' : ''}`;
                    btn.innerHTML = `
                        <span>${book.title}</span>
                        <span class="reader-book-btn__meta">${book.chapters.length} гл.</span>
                    `;
                    btn.addEventListener('click', () => selectBook(idx));
                    bookSelectorWrap.appendChild(btn);
                });

                const book = POETRY_DATA.collections[currentBookIndex];
                tocTitle.textContent = book.title;

                if (book.cover) {
                    const isCoverActive = (currentPage === 1);
                    const li = document.createElement('li');
                    li.className = `reader-toc__item ${isCoverActive ? 'active' : ''}`;
                    li.innerHTML = `
                        <span>📖 Обложка сборника</span>
                        <span class="reader-toc__dots"></span>
                        <span class="reader-toc__page">Обл</span>
                    `;
                    li.addEventListener('click', () => goToPage(1));
                    tocList.appendChild(li);
                }

                book.chapters.forEach((ch, idx) => {
                    const coverOffset = book.cover ? 1 : 0;
                    const realStartPage = ch.startPage + coverOffset;
                    const nextCh = book.chapters[idx + 1];
                    const realNextStart = nextCh ? nextCh.startPage + coverOffset : Infinity;
                    const isCurrent = currentPage >= realStartPage && currentPage < realNextStart;

                    const li = document.createElement('li');
                    li.className = `reader-toc__item ${isCurrent ? 'active' : ''}`;
                    li.innerHTML = `
                        <span>${ch.title}</span>
                        <span class="reader-toc__dots"></span>
                        <span class="reader-toc__page">стр. ${ch.startPage}</span>
                    `;
                    li.addEventListener('click', () => goToPage(realStartPage));
                    tocList.appendChild(li);
                });
            } else {
                if (bookShelf) bookShelf.style.display = 'none';
                tocTitle.textContent = 'Отдельные произведения';

                POETRY_DATA.singles.forEach((poem, idx) => {
                    const isCurrent = idx === currentSingleIndex;
                    const li = document.createElement('li');
                    li.className = `reader-toc__item ${isCurrent ? 'active' : ''}`;
                    li.innerHTML = `
                        <span>${poem.title}</span>
                        <span class="reader-toc__dots"></span>
                        <span class="reader-toc__page">${poem.pages.length} л.</span>
                    `;
                    li.addEventListener('click', () => {
                        currentSingleIndex = idx;
                        goToPage(1);
                    });
                    tocList.appendChild(li);
                });
            }
        }

        let pageLoadRequestId = 0;
        let activeLoadingImg = null;
        let currentLoadedPath = '';

        function goToPage(pageNumber, forceReload = false) {
            const pages = getActivePages();
            const clamped = Math.max(1, Math.min(pages.length, pageNumber));
            const imgPath = pages[clamped - 1];

            if (!forceReload && clamped === currentPage && imgPath === currentLoadedPath) {
                return;
            }

            const changed = clamped !== currentPage || imgPath !== currentLoadedPath;
            currentPage = clamped;
            currentLoadedPath = imgPath;

            const currentRequestId = ++pageLoadRequestId;

            wheelTargetDeg = getToothAngle(currentPage - 1);

            if (changed && poemSheet) {
                poemSheet.classList.add('sheet-turning');
                setTimeout(() => poemSheet.classList.remove('sheet-turning'), 220);
            }

            if (activeLoadingImg) {
                activeLoadingImg.onload = null;
                activeLoadingImg.onerror = null;
                activeLoadingImg.src = '';
                activeLoadingImg = null;
            }

            poemPageImg.style.transition = 'none';
            poemPageImg.style.opacity = '0';

            const tempImg = new Image();
            activeLoadingImg = tempImg;

            tempImg.onload = () => {
                if (currentRequestId === pageLoadRequestId) {
                    poemPageImg.src = imgPath;
                    poemPageImg.style.display = 'block';
                    poemPageImg.style.transition = 'opacity 0.25s ease';
                    poemPageImg.style.opacity = '1';
                    activeLoadingImg = null;
                }
            };

            tempImg.onerror = () => {
                if (currentRequestId === pageLoadRequestId) {
                    poemPageImg.style.display = 'none';
                    activeLoadingImg = null;
                }
            };

            tempImg.src = imgPath;

            const pageIndex0 = currentPage - 1;
            const labelStr = formatPageLabel(pageIndex0);

            placeholderBadge.textContent = currentMode === 'collections'
                ? POETRY_DATA.collections[currentBookIndex].title
                : 'Отдельное стихотворение';

            if (hasCover() && pageIndex0 === 0) {
                placeholderTitle.textContent = 'Обложка сборника';
                placeholderPath.textContent = 'Загрузка обложки...';
                placeholderPage.textContent = 'Обложка';
                pageIndicator.textContent = `Обложка (${pages.length - 1} стр.)`;
            } else {
                placeholderTitle.textContent = getCurrentChapterTitle(currentPage);
                placeholderPath.textContent = 'Загрузка страницы...';
                placeholderPage.textContent = `Страница ${labelStr}`;
                pageIndicator.textContent = `Стр. ${labelStr} из ${hasCover() ? pages.length - 1 : pages.length}`;
            }

            if (prevPageBtn) prevPageBtn.disabled = (currentPage <= 1);
            if (nextPageBtn) nextPageBtn.disabled = (currentPage >= pages.length);

            renderTOC();
        }

        document.querySelectorAll('[data-poetry-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-poetry-mode]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMode = btn.dataset.poetryMode;
                if (tocModeGear) {
                    tocModeGear.style.transform = `rotate(${currentMode === 'singles' ? 180 : 0}deg)`;
                }
                goToPage(1);
            });
        });

        if (prevPageBtn) prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
        if (nextPageBtn) nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));

        if (flywheelArea) {
            flywheelArea.addEventListener('wheel', e => {
                e.preventDefault();
                if (e.deltaY > 0) goToPage(currentPage + 1);
                else if (e.deltaY < 0) goToPage(currentPage - 1);
            }, { passive: false });
        }

        const toothButtons = [];
        const totalPagesMax = 80;
        for (let p = 1; p <= totalPagesMax; p++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'flywheel-tooth-num';
            btn.addEventListener('click', () => goToPage(p));
            flywheelNumbers.appendChild(btn);
            toothButtons.push({ page: p, el: btn });
        }

        function animateFlywheel() {
            wheelCurrentDeg += (wheelTargetDeg - wheelCurrentDeg) * 0.08;
            flywheelGear.style.transform = `rotate(${wheelCurrentDeg}deg)`;

            const totalPages = getActivePages().length;

            toothButtons.forEach(({ page, el }, idx) => {
                if (page > totalPages) {
                    el.style.display = 'none';
                    return;
                }

                el.textContent = formatPageLabel(idx);

                const toothDeg = getToothAngle(page - 1);
                const relDeg = toothDeg - wheelCurrentDeg;

                if (relDeg < -62 || relDeg > 62) {
                    el.style.display = 'none';
                    return;
                }

                el.style.display = 'flex';
                el.classList.toggle('active', page === currentPage);

                const angleRad = (180.05 - relDeg) * (Math.PI / 180);
                const x = Math.cos(angleRad) * NUMBER_RADIUS;
                const y = Math.sin(angleRad) * NUMBER_RADIUS;

                el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
            });

            requestAnimationFrame(animateFlywheel);
        }

        goToPage(1);
        animateFlywheel();
    }
});