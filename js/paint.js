// =========================================================================
// МОДУЛЬ РИСОВАНИЯ REMOTE PAINTING (js/paint.js)
// Наследует базовый класс WG.CanvasWidget
// =========================================================================
window.WG = window.WG || {};

WG.PaintWidget = class PaintWidget extends WG.CanvasWidget {
    constructor(canvasId = 'paintCanvas') {
        super(canvasId);
        if (!this.isReady) return;

        this.drawing = false;
        this.brushColor = '#d97706';
        this.brushSize = 4;

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.clearCanvas();
        this.bindEvents();
    }

    clearCanvas() {
        this.ctx.fillStyle = '#121215';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    bindEvents() {
        const colorDots = document.querySelectorAll('.color-dot');
        const sizeButtons = document.querySelectorAll('[data-size]');
        const clearBtn = document.getElementById('clearPaintBtn');

        this.canvas.addEventListener('pointerdown', e => {
            this.drawing = true;
            const pos = this.getCanvasPos(e);
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
        });

        this.canvas.addEventListener('pointermove', e => {
            if (!this.drawing) return;
            const pos = this.getCanvasPos(e);
            this.ctx.strokeStyle = this.brushColor;
            this.ctx.lineWidth = this.brushSize;
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();
        });

        window.addEventListener('pointerup', () => {
            this.drawing = false;
        });

        colorDots.forEach(dot => {
            dot.addEventListener('click', () => {
                colorDots.forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                this.brushColor = dot.dataset.color;
            });
        });

        sizeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                sizeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.brushSize = Number(btn.dataset.size);
            });
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearCanvas());
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    new WG.PaintWidget('paintCanvas');
});
