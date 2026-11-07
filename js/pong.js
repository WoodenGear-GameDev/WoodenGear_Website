// =========================================================================
// МОДУЛЬ ARDUINO PING PONG 8x8 (js/pong.js)
// Наследует базовый класс WG.CanvasWidget
// =========================================================================
window.WG = window.WG || {};

WG.PongWidget = class PongWidget extends WG.CanvasWidget {
    constructor(canvasId = 'ledPongCanvas') {
        super(canvasId);
        if (!this.isReady) return;

        this.COLS = 8;
        this.ROWS = 8;
        this.PADDLE_H = 3;
        this.BOARD_OFFSET = 57;
        this.CELL_STEP = 27;

        this.p1Y = 2;
        this.p2Y = 2;
        this.ball = { x: 3.5, y: 3.5, vx: 0.065, vy: 0.045 };
        this.s1 = 0;
        this.s2 = 0;
        this.isRunning = false;
        this.blinkTick = 0;
        this.moveDir = 0;

        this.scoreBadge = document.getElementById('pongScoreBadge');
        this.startBtn = document.getElementById('pongStartBtn');
        this.resetBtn = document.getElementById('pongResetBtn');
        this.upBtn = document.getElementById('pongUp');
        this.downBtn = document.getElementById('pongDown');

        this.bindEvents();
        this.startLoop();
    }

    resetBall(dir = 1) {
        this.ball.x = 3.5;
        this.ball.y = 3.5;
        this.ball.vx = 0.065 * dir;
        this.ball.vy = (Math.random() > 0.5 ? 1 : -1) * 0.045;
    }

    setRunningState(state) {
        this.isRunning = state;
        if (this.startBtn) {
            this.startBtn.textContent = this.isRunning ? '⏸ Пауза' : '▶ Подача';
            this.startBtn.classList.toggle('active', !this.isRunning);
        }
    }

    updateScoreText() {
        if (this.scoreBadge) {
            this.scoreBadge.textContent = `Счёт: ${this.s1} : ${this.s2}`;
        }
    }

    updatePaddleFromPointer(e) {
        const pos = this.getCanvasPos(e);
        const row = (pos.y - this.BOARD_OFFSET) / this.CELL_STEP - 1;
        this.p1Y = Math.max(0, Math.min(this.ROWS - this.PADDLE_H, row));
    }

    bindHoldButton(btn, dir) {
        if (!btn) return;
        btn.addEventListener('pointerdown', e => {
            e.preventDefault();
            this.p1Y = Math.max(0, Math.min(this.ROWS - this.PADDLE_H, this.p1Y + dir * 0.7));
            this.moveDir = dir;
        });
        const stopHold = () => {
            if (this.moveDir === dir) this.moveDir = 0;
        };
        btn.addEventListener('pointerup', stopHold);
        btn.addEventListener('pointerleave', stopHold);
        btn.addEventListener('pointercancel', stopHold);
    }

    bindEvents() {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.setRunningState(!this.isRunning));
        }

        this.canvas.addEventListener('pointerdown', e => {
            if (!this.isRunning) this.setRunningState(true);
            this.updatePaddleFromPointer(e);
        });

        this.canvas.addEventListener('pointermove', e => {
            this.updatePaddleFromPointer(e);
        });

        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => {
                this.s1 = 0;
                this.s2 = 0;
                this.p1Y = 2;
                this.p2Y = 2;
                this.updateScoreText();
                this.resetBall(1);
                this.setRunningState(false);
            });
        }

        this.bindHoldButton(this.upBtn, -1);
        this.bindHoldButton(this.downBtn, 1);
    }

    update() {
        this.blinkTick += 0.08;

        if (this.moveDir !== 0) {
            this.p1Y = Math.max(0, Math.min(this.ROWS - this.PADDLE_H, this.p1Y + this.moveDir * 0.085));
        }

        if (!this.isRunning) return;

        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        if (this.ball.y <= 0) {
            this.ball.y = 0;
            this.ball.vy = Math.abs(this.ball.vy) + (Math.random() * 0.008);
        }
        if (this.ball.y >= this.ROWS - 1) {
            this.ball.y = this.ROWS - 1;
            this.ball.vy = -Math.abs(this.ball.vy) - (Math.random() * 0.008);
        }

        const targetY = this.ball.y - 1 + (Math.sin(this.blinkTick * 1.5) * 0.35);
        if (this.p2Y < targetY - 0.1) this.p2Y = Math.min(this.ROWS - this.PADDLE_H, this.p2Y + 0.038);
        if (this.p2Y > targetY + 0.1) this.p2Y = Math.max(0, this.p2Y - 0.038);

        const p1 = Math.round(this.p1Y);
        const p2 = Math.round(this.p2Y);

        if (this.ball.vx < 0 && this.ball.x <= 1.05 && this.ball.x >= 0.4) {
            if (Math.round(this.ball.y) >= p1 && Math.round(this.ball.y) < p1 + this.PADDLE_H) {
                this.ball.vx = Math.abs(this.ball.vx);
                this.ball.vy += (Math.random() - 0.5) * 0.03;
            }
        }

        if (this.ball.vx > 0 && this.ball.x >= this.COLS - 2.05 && this.ball.x <= this.COLS - 1.4) {
            if (Math.round(this.ball.y) >= p2 && Math.round(this.ball.y) < p2 + this.PADDLE_H) {
                this.ball.vx = -Math.abs(this.ball.vx);
                this.ball.vy += (Math.random() - 0.5) * 0.03;
            }
        }

        if (this.ball.x < -0.3) {
            this.s2++;
            this.updateScoreText();
            this.resetBall(1);
            this.setRunningState(false);
        } else if (this.ball.x > this.COLS - 0.7) {
            this.s1++;
            this.updateScoreText();
            this.resetBall(-1);
            this.setRunningState(false);
        }
    }

    render() {
        const ctx = this.ctx;
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, 330, 330);

        ctx.fillStyle = '#111318';
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            this.BOARD_OFFSET - 6,
            this.BOARD_OFFSET - 6,
            this.COLS * this.CELL_STEP + 12,
            this.ROWS * this.CELL_STEP + 12
        );
        ctx.fillRect(
            this.BOARD_OFFSET - 6,
            this.BOARD_OFFSET - 6,
            this.COLS * this.CELL_STEP + 12,
            this.ROWS * this.CELL_STEP + 12
        );

        const bx = Math.round(this.ball.x);
        const by = Math.round(this.ball.y);
        const p1 = Math.round(this.p1Y);
        const p2 = Math.round(this.p2Y);
        const ballVisible = this.isRunning || Math.sin(this.blinkTick * 2.5) > -0.3;

        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                const isLeftPaddle = (c === 0 && r >= p1 && r < p1 + this.PADDLE_H);
                const isRightPaddle = (c === this.COLS - 1 && r >= p2 && r < p2 + this.PADDLE_H);
                const isBall = (c === bx && r === by) && ballVisible;

                const cx = this.BOARD_OFFSET + c * this.CELL_STEP + this.CELL_STEP / 2;
                const cy = this.BOARD_OFFSET + r * this.CELL_STEP + this.CELL_STEP / 2;

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
    }
};

document.addEventListener('DOMContentLoaded', () => {
    new WG.PongWidget('ledPongCanvas');
});
