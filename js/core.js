// =========================================================================
// БАЗОВОЕ ЯДРО И РОДИТЕЛЬСКИЙ КЛАСС ХОЛСТОВ (js/core.js)
// =========================================================================
window.WG = window.WG || {};

/**
 * Родительский класс для всех интерактивных Canvas-модулей.
 * Инкапсулирует получение контекста, пересчёт координат указателя и игровой цикл.
 */
WG.CanvasWidget = class CanvasWidget {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this._boundLoop = this._loop.bind(this);
    }

    get isReady() {
        return !!(this.canvas && this.ctx);
    }

    /**
     * Переводит экранные координаты мыши/пальца во внутренние координаты Canvas
     */
    getCanvasPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    startLoop() {
        if (!this.isReady) return;
        requestAnimationFrame(this._boundLoop);
    }

    _loop() {
        this.update();
        this.render();
        requestAnimationFrame(this._boundLoop);
    }

    // Переопределяются в классах-наследниках
    update() {}
    render() {}
};

/**
 * Глобальный контроллер адаптивного масштаба и кинематики страницы
 */
WG.Engine = {
    gearTargetSpeed: 0.2,

    isMobile() {
        return window.innerWidth <= 820;
    },

    boostGears(speed = 0.9, durationMs = 1600) {
        this.gearTargetSpeed = speed;
        clearTimeout(this._boostTimer);
        this._boostTimer = setTimeout(() => {
            this.gearTargetSpeed = 0.2;
        }, durationMs);
    },

    updateResponsiveScale() {
        const root = document.documentElement;
        const header = document.querySelector('.site-header');
        const gearChain = document.querySelector('.gear-chain');

        const vw = window.innerWidth;
        const mobile = this.isMobile();

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
                const hasPuzzle = !!gearChain.querySelector('.gear-chain__item--puzzle');
                const extraPuzzleHeight = hasPuzzle ? (mobile ? 720 : 220) : 0;
                const baseHeight = 30 + 600 + (itemsCount - 1) * stepY + 130 + extraPuzzleHeight;
                root.style.setProperty('--chain-base-height', `${baseHeight}px`);
            }
        }

        if (header) {
            header.style.height = `${Math.round(345 * logoScale + 48)}px`;
        }
    },

    initKineticLoop() {
        const cluster = document.querySelector('.content__gear-cluster');
        const gearChain = document.querySelector('.gear-chain');
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
            devMoreBtn.addEventListener('mouseenter', () => { this.gearTargetSpeed = 1; });
            devMoreBtn.addEventListener('mouseleave', () => { this.gearTargetSpeed = 0.2; });
        }

        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (gearChain || cluster) {
                this.gearTargetSpeed = 0.85;
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => { this.gearTargetSpeed = 0.2; }, 180);
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

        const step = () => {
            gearSpeed += (this.gearTargetSpeed - gearSpeed) * 0.05;
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
        };

        step();
    },

    init() {
        window.addEventListener('resize', () => this.updateResponsiveScale());
        this.updateResponsiveScale();
        this.initKineticLoop();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    WG.Engine.init();
});
