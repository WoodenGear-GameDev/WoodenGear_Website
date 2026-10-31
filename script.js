document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const header = document.querySelector('.site-header');

    function updateResponsiveScale() {
        const vw = window.innerWidth;

        const logoScale = Math.min(1, (vw - 24) / 780);
        const devScale = Math.min(1.1, (vw - 16) / 1340 * 1.1);
        const penScale = Math.min(1.1, (vw - 16) / 1340 * 1.1);
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
            blinkTick += 0.03;

            if (isRunning) {
                ball.x += ball.vx;
                ball.y += ball.vy;

                if (ball.y <= 0) { ball.y = 0; ball.vy = Math.abs(ball.vy); }
                if (ball.y >= ROWS - 1) { ball.y = ROWS - 1; ball.vy = -Math.abs(ball.vy); }

                const targetY = ball.y - 1;
                const aiSpeed = 0.022; 
                if (p2Y < targetY - 0.4) p2Y = Math.min(ROWS - PADDLE_H, p2Y + aiSpeed);
                if (p2Y > targetY + 0.4) p2Y = Math.max(0, p2Y - aiSpeed);

                const p1 = Math.round(p1Y);
                const p2 = Math.round(p2Y);

                // Отскок от левой платформы (игрока)
                if (ball.vx < 0 && ball.x <= 1.05 && ball.x >= 0.4) {
                    if (Math.round(ball.y) >= p1 && Math.round(ball.y) < p1 + PADDLE_H) {
                        ball.vx = Math.abs(ball.vx);
                    }
                }

                if (ball.vx > 0 && ball.x >= COLS - 2.05 && ball.x <= COLS - 1.4) {
                    if (Math.round(ball.y) >= p2 && Math.round(ball.y) < p2 + PADDLE_H) {
                        ball.vx = -Math.abs(ball.vx);
                    }
                }

                // Гол
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
});