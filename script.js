document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const header = document.querySelector('.site-header');
    const gearChain = document.querySelector('.gear-chain');

    let gearTargetSpeed = 0.2;

    function isMobileLayout() {
        return window.innerWidth <= 820;
    }

    function updateResponsiveScale() {
        const vw = window.innerWidth;
        const mobile = isMobileLayout();

        const logoScale = Math.min(1, (vw - 24) / 780);
        const devScale = Math.min(1, (vw - 16) / 1340);
        const poetryScale = Math.min(1, vw / 1600);

        const devHomeScale = mobile ? Math.min(1, (vw - 12) / 640) : devScale;
        const poetryHomeScale = mobile ? Math.min(1, vw / 760) : poetryScale;
        const chainScale = mobile ? Math.min(1, (vw - 8) / 920) : devScale;

        root.style.setProperty('--logo-scale', logoScale.toFixed(4));
        root.style.setProperty('--dev-scale', devScale.toFixed(4));
        root.style.setProperty('--poetry-scale', poetryScale.toFixed(4));
        root.style.setProperty('--dev-home-scale', devHomeScale.toFixed(4));
        root.style.setProperty('--poetry-home-scale', poetryHomeScale.toFixed(4));
        root.style.setProperty('--chain-scale', chainScale.toFixed(4));

        if (gearChain) {
            const itemsCount = gearChain.querySelectorAll('.gear-chain__item').length;
            if (itemsCount > 0) {
                const stepY = mobile ? 488 : 423;
                const baseHeight = 30 + 600 + (itemsCount - 1) * stepY + 130;
                root.style.setProperty('--chain-base-height', `${baseHeight}px`);
            }
        }

        if (header) {
            header.style.height = `${Math.round(345 * logoScale + 48)}px`;
        }
    }

    window.addEventListener('resize', updateResponsiveScale);
    updateResponsiveScale();

    function initKineticLoop() {
        const cluster = document.querySelector('.content__gear-cluster');
        const devMoreBtn = document.querySelector('.dev__more-btn');
        const wheelMesh = document.querySelector('.poetry__wheel-mesh');
        const oilStream = document.querySelector('.poetry__oil-stream');
        const poetryBtn = document.querySelector('.poetry__more-btn');

        let gearAngle = 0;
        let gearSpeed = 0.2;

        let wheelAngle = 0;
        let wheelSpeed = 0.18;
        let wheelTargetSpeed = 0.18;

        let oilPos = 0;
        let oilSpeed = 1.2;
        let oilTargetSpeed = 1.2;
        const viscosity = 0.015;

        if (devMoreBtn) {
            devMoreBtn.addEventListener('mouseenter', () => { gearTargetSpeed = 1; });
            devMoreBtn.addEventListener('mouseleave', () => { gearTargetSpeed = 0.2; });
        }

        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (gearChain || cluster) {
                gearTargetSpeed = 0.85;
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => { gearTargetSpeed = 0.2; }, 180);
            }
        }, { passive: true });

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

        function step() {
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

            requestAnimationFrame(step);
        }

        step();
    }

    function initPaintCanvas() {
        const paintCanvas = document.getElementById('paintCanvas');
        if (!paintCanvas) return;

        const ctx = paintCanvas.getContext('2d');
        const colorDots = document.querySelectorAll('.color-dot');
        const sizeButtons = document.querySelectorAll('[data-size]');
        const clearBtn = document.getElementById('clearPaintBtn');

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

        colorDots.forEach(dot => {
            dot.addEventListener('click', () => {
                colorDots.forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                brushColor = dot.dataset.color;
            });
        });

        sizeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                sizeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                brushSize = Number(btn.dataset.size);
            });
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                ctx.fillStyle = '#121215';
                ctx.fillRect(0, 0, 330, 330);
            });
        }
    }

    function initLedPong() {
        const ledCanvas = document.getElementById('ledPongCanvas');
        if (!ledCanvas) return;

        const ctx = ledCanvas.getContext('2d');
        const pongScoreBadge = document.getElementById('pongScoreBadge');
        const startBtn = document.getElementById('pongStartBtn');
        const resetBtn = document.getElementById('pongResetBtn');
        const pongUp = document.getElementById('pongUp');
        const pongDown = document.getElementById('pongDown');

        const COLS = 8;
        const ROWS = 8;
        const PADDLE_H = 3;
        const BOARD_OFFSET = 57;
        const CELL_STEP = 27;

        let p1Y = 2;
        let p2Y = 2;
        let ball = { x: 3.5, y: 3.5, vx: 0.065, vy: 0.045 };
        let s1 = 0;
        let s2 = 0;
        let isRunning = false;
        let blinkTick = 0;

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
            startBtn.addEventListener('click', () => setRunningState(!isRunning));
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
            const row = Math.floor((canvasY - BOARD_OFFSET) / CELL_STEP) - 1;
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
            ctx.strokeRect(BOARD_OFFSET - 6, BOARD_OFFSET - 6, COLS * CELL_STEP + 12, ROWS * CELL_STEP + 12);
            ctx.fillRect(BOARD_OFFSET - 6, BOARD_OFFSET - 6, COLS * CELL_STEP + 12, ROWS * CELL_STEP + 12);

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

                    const cx = BOARD_OFFSET + c * CELL_STEP + CELL_STEP / 2;
                    const cy = BOARD_OFFSET + r * CELL_STEP + CELL_STEP / 2;

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

    function initGearPuzzle() {
        const puzzleCanvas = document.getElementById('gearPuzzleCanvas');
        if (!puzzleCanvas) return;

        const ctx = puzzleCanvas.getContext('2d');
        const statusBadge = document.getElementById('puzzleStatusBadge');
        const taskText = document.getElementById('puzzleTaskText');
        const resetPuzzleBtn = document.getElementById('puzzleResetBtn');
        const sizeButtons = document.querySelectorAll('[data-gear-size]');
        const levelButtons = document.querySelectorAll('[data-puzzle-level]');

        const CENTER = 165;
        const GEAR_SPECS = {
            S: { radius: 24, teeth: 8,  label: 'Малая' },
            M: { radius: 36, teeth: 12, label: 'Средняя' },
            L: { radius: 48, teeth: 16, label: 'Большая' }
        };

        const PUZZLE_LEVELS = [
            {
                hint: 'Уровень 1 (Инверсия): Запусти правый вал ПРОТИВ часовой стрелки. Ось в самом центре — ловушка (даёт неверное направление вращения)!',
                inventory: { S: 0, M: 2, L: 1 },
                nodes: [
                    { id: 'drv', x: -84, y:   0, type: 'driver', size: 'M', dir: 1 },
                    { id: 'trg', x:  84, y:   0, type: 'target', size: 'M', targetDir: -1 },
                    { id: 'p1',  x:   0, y:   0, type: 'pin',    size: null },
                    { id: 'p2',  x: -36, y: -54, type: 'pin',    size: null },
                    { id: 'p3',  x:  36, y: -54, type: 'pin',    size: null }
                ]
            },
            {
                hint: 'Уровень 2 (Двойной контур): Запитай сразу два ведомых вала справа — верхний должен вращаться ПРОТИВ часовой стрелки, а нижний — ПО часовой.',
                inventory: { S: 2, M: 2, L: 0 },
                nodes: [
                    { id: 'drv',  x: -92, y: -12, type: 'driver', size: 'S', dir: 1 },
                    { id: 'p1',   x: -32, y: -12, type: 'pin',    size: null },
                    { id: 'p2',   x:  16, y: -48, type: 'pin',    size: null },
                    { id: 'trgA', x:  64, y: -48, type: 'target', size: 'S', targetDir: -1 },
                    { id: 'p3',   x: -32, y:  60, type: 'pin',    size: null },
                    { id: 'p4',   x:  28, y:  60, type: 'pin',    size: null },
                    { id: 'trgB', x:  76, y:  24, type: 'target', size: 'M', targetDir: 1 }
                ]
            },
            {
                hint: 'Уровень 3 (Обход клина): В центре закреплена стальная паразитная шестерня. Запитай оба вала справа, избегая оси-ловушки слева вверху (она заклинит привод)!',
                inventory: { S: 3, M: 0, L: 0 },
                nodes: [
                    { id: 'drv',   x: -90, y:   0, type: 'driver', size: 'M', dir: 1 },
                    { id: 'fixed', x: -18, y:   0, type: 'fixed',  size: 'M' },
                    { id: 'trap',  x: -54, y: -48, type: 'pin',    size: null },
                    { id: 'pUp',   x:  18, y: -48, type: 'pin',    size: null },
                    { id: 'trgA',  x:  66, y: -48, type: 'target', size: 'S', targetDir: -1 },
                    { id: 'pLow1', x: -18, y:  60, type: 'pin',    size: null },
                    { id: 'pLow2', x:  30, y:  60, type: 'pin',    size: null },
                    { id: 'trgB',  x:  78, y:  24, type: 'target', size: 'M', targetDir: 1 }
                ]
            },
            {
                hint: 'Уровень 4 (Тройной распределитель): Установи центральный маховик так, чтобы одновременно раздать крутящий момент на все ТРИ ведомых вала по краям платы!',
                inventory: { S: 2, M: 1, L: 1 },
                nodes: [
                    { id: 'drv',    x: -90, y:   0, type: 'driver', size: 'S', dir: 1 },
                    { id: 'pHub',   x: -18, y:   0, type: 'pin',    size: null },
                    { id: 'pUp',    x: -18, y: -72, type: 'pin',    size: null },
                    { id: 'trgA',   x:  30, y: -72, type: 'target', size: 'S', targetDir: -1 },
                    { id: 'pRight', x:  54, y:   0, type: 'pin',    size: null },
                    { id: 'trgB',   x:  90, y:  48, type: 'target', size: 'M', targetDir: -1 },
                    { id: 'pLow',   x: -18, y:  84, type: 'pin',    size: null },
                    { id: 'trgC',   x: -78, y:  84, type: 'target', size: 'S', targetDir: -1 },
                    { id: 'pDecoy', x: -54, y: -48, type: 'pin',    size: null }
                ]
            },
            {
                hint: 'Уровень 5 (Повышающая передача 2x): Правый вал с меткой «2x» требует двойной скорости вращения! Прямой мост от малого верхнего мотора даст лишь 1x — подай привод от большого нижнего маховика (16 зубьев).',
                inventory: { S: 2, M: 2, L: 0 },
                nodes: [
                    { id: 'drv1x',   x: -72, y: -48, type: 'driver', size: 'S', dir: 1 },
                    { id: 'drv2x',   x: -72, y:  48, type: 'driver', size: 'L', dir: 1 },
                    { id: 'pTop',    x: -36, y: -96, type: 'pin',    size: null },
                    { id: 'trgB',    x:  24, y: -96, type: 'target', size: 'S', targetDir: 1 },
                    { id: 'pTrap1',  x: -24, y: -48, type: 'pin',    size: null },
                    { id: 'pTrap2',  x:  24, y: -48, type: 'pin',    size: null },
                    { id: 'pLow1',   x:   0, y:  48, type: 'pin',    size: null },
                    { id: 'pBridge', x:  36, y:   0, type: 'pin',    size: null },
                    { id: 'trgA',    x:  72, y: -48, type: 'target', size: 'S', targetDir: -1, minSpeed: 1.9 }
                ]
            },
            {
                hint: 'Уровень 6 (Часовой лабиринт): Финальное испытание! От центрального мотора и паразитной шестерни запитай все 3 замка, использовав каждую деталь со склада и не угодив в треугольник клина.',
                inventory: { S: 2, M: 1, L: 1 },
                nodes: [
                    { id: 'drv',    x:   0, y:   0, type: 'driver', size: 'S', dir: 1 },
                    { id: 'fixed1', x: -48, y:   0, type: 'fixed',  size: 'S' },
                    { id: 'p1',     x: -48, y: -60, type: 'pin',    size: null },
                    { id: 'p2',     x:  12, y: -60, type: 'pin',    size: null },
                    { id: 'trgA',   x:  60, y: -60, type: 'target', size: 'S', targetDir: 1 },
                    { id: 'p3',     x: -48, y:  72, type: 'pin',    size: null },
                    { id: 'trgB',   x:  24, y:  72, type: 'target', size: 'S', targetDir: -1 },
                    { id: 'p4',     x:  48, y:   0, type: 'pin',    size: null },
                    { id: 'trgC',   x:  96, y:   0, type: 'target', size: 'S', targetDir: 1 },
                    { id: 'pTrap',  x: -24, y:  41, type: 'pin',    size: null },
                    { id: 'pDecoy', x:  60, y:  40, type: 'pin',    size: null }
                ]
            }
        ];

        let currentLevelIdx = 0;
        let selectedSize = 'M';
        let nodes = [];
        let remainingStock = { S: 0, M: 0, L: 0 };
        let isJammed = false;
        let isSolved = false;
        let errorFlashNode = null;
        let errorFlashTimer = 0;

        function updateInventoryUI() {
            const lvlInv = PUZZLE_LEVELS[currentLevelIdx].inventory;
            const used = { S: 0, M: 0, L: 0 };
            nodes.forEach(n => {
                if (n.type === 'pin' && n.size) used[n.size]++;
            });

            ['S', 'M', 'L'].forEach(sz => {
                remainingStock[sz] = Math.max(0, lvlInv[sz] - used[sz]);
            });

            sizeButtons.forEach(btn => {
                const sz = btn.dataset.gearSize;
                const count = remainingStock[sz];
                btn.textContent = `⚙ ${GEAR_SPECS[sz].label} [${count}]`;
                btn.style.opacity = count === 0 ? '0.45' : '1';
            });

            if (remainingStock[selectedSize] === 0) {
                const available = ['S', 'M', 'L'].find(sz => remainingStock[sz] > 0);
                if (available) {
                    selectedSize = available;
                    sizeButtons.forEach(b => b.classList.toggle('active', b.dataset.gearSize === selectedSize));
                }
            }
        }

        function loadLevel(idx) {
            currentLevelIdx = idx;
            const lvl = PUZZLE_LEVELS[idx];
            nodes = lvl.nodes.map(n => ({
                ...n,
                cx: CENTER + n.x,
                cy: CENTER + n.y,
                angle: 0,
                speed: 0,
                jammed: false
            }));
            if (taskText) taskText.textContent = lvl.hint;
            levelButtons.forEach((b, i) => b.classList.toggle('active', i === idx));
            updateInventoryUI();
            recalculateKinematics();
        }

        function isTargetSatisfied(t) {
            if (isJammed || t.speed === 0) return false;
            if (Math.sign(t.speed) !== t.targetDir) return false;
            if (t.minSpeed && Math.abs(t.speed) < t.minSpeed) return false;
            return true;
        }

        function recalculateKinematics() {
            isJammed = false;
            isSolved = false;

            nodes.forEach(n => {
                n.speed = 0;
                n.jammed = false;
            });

            const activeNodes = nodes.filter(n => n.size !== null);
            const queue = [];

            activeNodes.forEach(n => {
                if (n.type === 'driver') {
                    n.speed = n.dir * 1.0;
                    queue.push(n);
                }
            });

            while (queue.length > 0) {
                const curr = queue.shift();
                const r1 = GEAR_SPECS[curr.size].radius;
                const z1 = GEAR_SPECS[curr.size].teeth;

                for (const next of activeNodes) {
                    if (next === curr) continue;
                    const r2 = GEAR_SPECS[next.size].radius;
                    const z2 = GEAR_SPECS[next.size].teeth;
                    const dist = Math.hypot(curr.cx - next.cx, curr.cy - next.cy);

                    if (Math.abs(dist - (r1 + r2)) <= 2.5) {
                        const expectedSpeed = -curr.speed * (z1 / z2);

                        if (next.speed === 0) {
                            next.speed = expectedSpeed;
                            queue.push(next);
                        } else if (Math.abs(next.speed - expectedSpeed) > 0.05) {
                            isJammed = true;
                            curr.jammed = true;
                            next.jammed = true;
                        }
                    }
                }
            }

            if (isJammed) {
                activeNodes.forEach(n => {
                    if (n.speed !== 0) n.jammed = true;
                    n.speed = 0;
                });
            }

            const targets = nodes.filter(n => n.type === 'target');
            isSolved = !isJammed && targets.every(isTargetSatisfied);

            if (statusBadge) {
                if (isJammed) {
                    statusBadge.textContent = '⚠ Клин привода!';
                    statusBadge.style.borderColor = '#ef4444';
                    statusBadge.style.background = 'rgba(239, 68, 68, 0.22)';
                } else if (isSolved) {
                    statusBadge.textContent = `✓ Ур. ${currentLevelIdx + 1} решён!`;
                    statusBadge.style.borderColor = '#4ade80';
                    statusBadge.style.background = 'rgba(74, 222, 128, 0.22)';
                    gearTargetSpeed = 0.9;
                    setTimeout(() => { gearTargetSpeed = 0.2; }, 1600);
                } else {
                    const wrongDir = targets.some(t => t.speed !== 0 && Math.sign(t.speed) !== t.targetDir);
                    const tooSlow = targets.some(t => t.speed !== 0 && Math.sign(t.speed) === t.targetDir && t.minSpeed && Math.abs(t.speed) < t.minSpeed);

                    if (wrongDir) {
                        statusBadge.textContent = '↺ Не та сторона!';
                    } else if (tooSlow) {
                        statusBadge.textContent = '⚡ Медленно (нужно 2x)!';
                    } else {
                        statusBadge.textContent = `Уровень ${currentLevelIdx + 1} / ${PUZZLE_LEVELS.length}`;
                    }
                    statusBadge.style.borderColor = 'var(--color-accent)';
                    statusBadge.style.background = 'rgba(217, 119, 6, 0.15)';
                }
            }
        }

        puzzleCanvas.addEventListener('pointerdown', e => {
            const rect = puzzleCanvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (puzzleCanvas.width / rect.width);
            const my = (e.clientY - rect.top) * (puzzleCanvas.height / rect.height);

            for (const node of nodes) {
                if (node.type !== 'pin') continue;
                const hitR = node.size ? GEAR_SPECS[node.size].radius : 22;

                if (Math.hypot(mx - node.cx, my - node.cy) <= hitR) {
                    if (node.size !== null) {
                        const removedSize = node.size;
                        node.size = null;
                        selectedSize = removedSize;
                        sizeButtons.forEach(b => b.classList.toggle('active', b.dataset.gearSize === selectedSize));
                        updateInventoryUI();
                        recalculateKinematics();
                        return;
                    }

                    if (remainingStock[selectedSize] <= 0) {
                        errorFlashNode = node;
                        errorFlashTimer = 20;
                        return;
                    }

                    const candR = GEAR_SPECS[selectedSize].radius;
                    let overlaps = false;
                    for (const other of nodes) {
                        if (other === node || other.size === null) continue;
                        const otherR = GEAR_SPECS[other.size].radius;
                        const dist = Math.hypot(node.cx - other.cx, node.cy - other.cy);
                        if (dist < (candR + otherR) - 2.5) {
                            overlaps = true;
                            break;
                        }
                    }

                    if (overlaps) {
                        errorFlashNode = node;
                        errorFlashTimer = 25;
                    } else {
                        node.size = selectedSize;
                        updateInventoryUI();
                        recalculateKinematics();
                    }
                    return;
                }
            }
        });

        sizeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                sizeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedSize = btn.dataset.gearSize;
            });
        });

        levelButtons.forEach(btn => {
            btn.addEventListener('click', () => loadLevel(Number(btn.dataset.puzzleLevel)));
        });

        if (resetPuzzleBtn) {
            resetPuzzleBtn.addEventListener('click', () => loadLevel(currentLevelIdx));
        }

        function drawGearShape(x, y, radius, teeth, angle, palette) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            const outerR = radius + 4.5;
            const innerR = radius - 4.5;
            const step = (Math.PI * 2) / teeth;

            ctx.beginPath();
            for (let i = 0; i < teeth; i++) {
                const a0 = i * step;
                const a1 = a0 + step * 0.18;
                const a2 = a0 + step * 0.45;
                const a3 = a0 + step * 0.63;
                const a4 = a0 + step;

                ctx.lineTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
                ctx.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
                ctx.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
                ctx.lineTo(Math.cos(a3) * innerR, Math.sin(a3) * innerR);
                ctx.lineTo(Math.cos(a4) * innerR, Math.sin(a4) * innerR);
            }
            ctx.closePath();

            ctx.fillStyle = palette.fill;
            ctx.strokeStyle = palette.stroke;
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.58, 0, Math.PI * 2);
            ctx.fillStyle = '#121216';
            ctx.fill();
            ctx.stroke();

            for (let s = 0; s < 4; s++) {
                const sa = s * (Math.PI / 2);
                ctx.beginPath();
                ctx.moveTo(Math.cos(sa) * 7, Math.sin(sa) * 7);
                ctx.lineTo(Math.cos(sa) * (radius * 0.58), Math.sin(sa) * (radius * 0.58));
                ctx.lineWidth = 3.5;
                ctx.strokeStyle = palette.stroke;
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
            ctx.fillStyle = palette.hub;
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#09090b';
            ctx.stroke();

            ctx.restore();
        }

        function drawDirectionArrow(x, y, dir, color, isTurbo = false) {
            ctx.save();
            ctx.translate(x, y);
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = 2.2;

            const r = 13.5;
            ctx.beginPath();
            if (dir > 0) {
                ctx.arc(0, 0, r, -Math.PI * 0.75, Math.PI * 0.25, false);
            } else {
                ctx.arc(0, 0, r, -Math.PI * 0.25, Math.PI * 0.75, true);
            }
            ctx.stroke();

            const tipAngle = dir > 0 ? Math.PI * 0.25 : Math.PI * 0.75;
            const tx = Math.cos(tipAngle) * r;
            const ty = Math.sin(tipAngle) * r;
            ctx.beginPath();
            ctx.arc(tx, ty, 3, 0, Math.PI * 2);
            ctx.fill();

            if (isTurbo) {
                ctx.font = 'bold 9px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#09090b';
                ctx.fillText('2x', 0, 0.5);
            }

            ctx.restore();
        }

        function renderPuzzle() {
            ctx.fillStyle = '#0d0d11';
            ctx.fillRect(0, 0, 330, 330);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.lineWidth = 1;
            for (const r of [50, 95, 140]) {
                ctx.beginPath();
                ctx.arc(CENTER, CENTER, r, 0, Math.PI * 2);
                ctx.stroke();
            }

            nodes.forEach(node => {
                if (node.size === null) {
                    ctx.beginPath();
                    ctx.arc(node.cx, node.cy, 9, 0, Math.PI * 2);
                    ctx.fillStyle = '#27272a';
                    ctx.strokeStyle = '#d97706';
                    ctx.lineWidth = 2;
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(node.cx, node.cy, 3.5, 0, Math.PI * 2);
                    ctx.fillStyle = '#fbbf24';
                    ctx.fill();
                }
            });

            if (errorFlashTimer > 0 && errorFlashNode) {
                errorFlashTimer--;
                ctx.beginPath();
                ctx.arc(errorFlashNode.cx, errorFlashNode.cy, GEAR_SPECS[selectedSize].radius, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
                ctx.lineWidth = 2.5;
                ctx.stroke();
            }

            nodes.forEach(node => {
                if (!node.size) return;
                const spec = GEAR_SPECS[node.size];
                node.angle += node.speed * 0.022;

                let palette = { fill: '#78350f', stroke: '#b45309', hub: '#d97706' };

                if (node.jammed) {
                    palette = { fill: '#7f1d1d', stroke: '#ef4444', hub: '#fca5a5' };
                } else if (node.type === 'driver') {
                    palette = { fill: '#92400e', stroke: '#f59e0b', hub: '#fde68a' };
                } else if (node.type === 'fixed') {
                    palette = { fill: '#3f3f46', stroke: '#a1a1aa', hub: '#e4e4e7' };
                } else if (node.type === 'target') {
                    const ok = isTargetSatisfied(node);
                    const spinningButWrong = node.speed !== 0 && !ok;
                    if (ok) {
                        palette = { fill: '#14532d', stroke: '#4ade80', hub: '#bbf7d0' };
                    } else if (spinningButWrong) {
                        palette = { fill: '#7f1d1d', stroke: '#f87171', hub: '#fecaca' };
                    } else {
                        palette = { fill: '#1e293b', stroke: '#38bdf8', hub: '#bae6fd' };
                    }
                }

                drawGearShape(node.cx, node.cy, spec.radius, spec.teeth, node.angle, palette);

                if (node.type === 'driver') {
                    drawDirectionArrow(node.cx, node.cy, node.dir, '#fde68a', false);
                } else if (node.type === 'target') {
                    const ok = isTargetSatisfied(node);
                    const arrowColor = ok ? '#4ade80' : '#38bdf8';
                    drawDirectionArrow(node.cx, node.cy, node.targetDir, arrowColor, !!node.minSpeed);
                }
            });

            requestAnimationFrame(renderPuzzle);
        }

        loadLevel(0);
        renderPuzzle();
    }

    function initPoetryReader() {
        const flywheelGear = document.getElementById('flywheelGear');
        const flywheelNumbers = document.getElementById('flywheelNumbers');
        const tocList = document.getElementById('tocList');
        if (!flywheelGear || !flywheelNumbers || !tocList) return;

        const buildPageList = (prefix, startIdx, endIdx) => {
            const list = [];
            for (let i = startIdx; i <= endIdx; i++) {
                list.push(`assets/img/poems/${prefix}_${String(i).padStart(3, '0')}.webp`);
            }
            return list;
        };

        const POETRY_DATA = {
            collections: [
                {
                    id: 'woodengear',
                    title: 'I. WoodenGear',
                    cover: 'assets/img/poems/wg_page_001.webp',
                    chapters: [
                        { title: 'Глава I Pt. 1: WoodenGear', startPage: 5 },
                        { title: 'Глава I Pt. 2: Жуткий лес', startPage: 15 },
                        { title: 'Глава II Pt. 1: Мир больше не детский', startPage: 23 },
                        { title: 'Глава II Pt. 2: Весь мазут течёт из детства', startPage: 30 },
                        { title: 'Глава III Pt. 1: Чистилище', startPage: 38 },
                        { title: 'Глава III Pt. 2: Путь', startPage: 49 }
                    ],
                    pages: buildPageList('wg_page', 2, 56)
                },
                {
                    id: 'castle',
                    title: 'II. Непримечательный замок',
                    cover: '',
                    chapters: [
                        { title: 'Непримечательный замок', startPage: 1 }
                    ],
                    pages: buildPageList('csl_page', 1, 5)
                }
            ],
            singles: [
                {
                    id: 'rain',
                    title: 'Дождь',
                    pages: [
                        'assets/img/poems/poem_page_004.webp',
                        'assets/img/poems/poem_page_005.webp'
                    ]
                },
                {
                    id: 'from_above',
                    title: 'Свыше',
                    pages: [
                        'assets/img/poems/poem_page_001.webp'
                    ]
                },
                {
                    id: 'writer',
                    title: 'Писатель',
                    pages: [
                        'assets/img/poems/poem_page_002.webp'
                    ]
                },
                {
                    id: 'cat',
                    title: 'Котёнок',
                    pages: [
                        'assets/img/poems/poem_page_003.webp'
                    ]
                }
            ]
        };

        const TOOTH_OFFSETS = [
            0.0, 18.05, 35.1, 52.0, 69.7, 90.25, 109.7,
            128.05, 145.0, 161.95, 180.0, 197.65, 214.4, 230.6,
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

        let pageLoadRequestId = 0;
        let activeLoadingImg = null;
        let currentLoadedPath = '';

        function getActivePages() {
            if (currentMode === 'collections') {
                const book = POETRY_DATA.collections[currentBookIndex];
                return book.cover ? [book.cover, ...book.pages] : book.pages;
            }
            return POETRY_DATA.singles[currentSingleIndex].pages;
        }

        function hasCover() {
            return currentMode === 'collections' && !!POETRY_DATA.collections[currentBookIndex].cover;
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
            goToPage(1, true);
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
                    li.addEventListener('click', () => goToPage(1, true));
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
                    li.addEventListener('click', () => goToPage(realStartPage, true));
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
                        goToPage(1, true);
                    });
                    tocList.appendChild(li);
                });
            }
        }

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
                    placeholderPath.textContent = `Файл листа: ${imgPath}`;
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
                goToPage(1, true);
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

            let dragStartX = null;
            let dragStartY = null;

            flywheelArea.addEventListener('pointerdown', e => {
                if (e.target.closest('.flywheel-tooth-num')) return;
                dragStartX = e.clientX;
                dragStartY = e.clientY;
            });

            flywheelArea.addEventListener('pointerup', e => {
                if (dragStartX === null) return;
                const dx = e.clientX - dragStartX;
                const dy = e.clientY - dragStartY;
                dragStartX = null;
                dragStartY = null;

                if (isMobileLayout() && Math.abs(dx) > 28) {
                    if (dx < 0) goToPage(currentPage + 1);
                    else goToPage(currentPage - 1);
                } else if (!isMobileLayout() && Math.abs(dy) > 28) {
                    if (dy < 0) goToPage(currentPage + 1);
                    else goToPage(currentPage - 1);
                }
            });
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
            const mobileMode = isMobileLayout();

            const gearVisualDeg = mobileMode ? (wheelCurrentDeg + 90) : wheelCurrentDeg;
            flywheelGear.style.transform = `rotate(${gearVisualDeg}deg)`;

            const totalPages = getActivePages().length;
            const currentWheelWidth = flywheelGear.offsetWidth || 1700;
            const activeRadius = (currentWheelWidth / 1700) * NUMBER_RADIUS;
            const baseAngleDeg = mobileMode ? 270.05 : 180.05;

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

                const angleRad = (baseAngleDeg - relDeg) * (Math.PI / 180);
                const x = Math.cos(angleRad) * activeRadius;
                const y = Math.sin(angleRad) * activeRadius;

                el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
            });

            requestAnimationFrame(animateFlywheel);
        }

        goToPage(1, true);
        animateFlywheel();
    }

    initKineticLoop();
    initPaintCanvas();
    initLedPong();
    initGearPuzzle();
    initPoetryReader();
});