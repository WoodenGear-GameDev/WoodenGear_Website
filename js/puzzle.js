window.WG = window.WG || {};

WG.GearPuzzleWidget = class GearPuzzleWidget extends WG.CanvasWidget {
    constructor(canvasId = 'gearPuzzleCanvas') {
        super(canvasId);
        if (!this.isReady) return;

        this.CANVAS_W = 680;
        this.CANVAS_H = 400;
        this.ORIGIN_X = 340;
        this.ORIGIN_Y = 204;
        this.VIEW_SCALE = 1.42;

        this.GEAR_SPECS = {
            S: { radius: 24, teeth: 8,  label: 'Малая (8)' },
            M: { radius: 36, teeth: 12, label: 'Средняя (12)' },
            L: { radius: 48, teeth: 16, label: 'Большая (16)' }
        };

        this.PUZZLE_LEVELS = [
            {
                name: 'Инверсия вращения',
                hint: 'Запусти правый ведомый вал ПРОТИВ часовой стрелки. Ось в самом центре — ловушка (даёт неверное направление вращения)!',
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
                name: 'Двойной контур',
                hint: 'Запитай сразу два ведомых вала справа — верхний должен вращаться ПРОТИВ часовой стрелки, а нижний — ПО часовой.',
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
                name: 'Обход клина',
                hint: 'В центре закреплена стальная паразитная шестерня. Запитай оба вала справа, избегая оси-ловушки слева вверху (она заклинит привод)!',
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
                name: 'Тройной распределитель',
                hint: 'Установи центральный маховик так, чтобы одновременно раздать крутящий момент на все ТРИ ведомых вала по краям экрана!',
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
                name: 'Повышающая передача 2x',
                hint: 'Правый вал с меткой «2x» требует двойной скорости вращения! Прямой мост от малого верхнего мотора даст лишь 1x — подай привод от большого нижнего маховика (16 зубьев).',
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
                name: 'Часовой лабиринт',
                hint: 'Финальное испытание! От центрального мотора и паразитной шестерни запитай все 3 замка, использовав каждую деталь со склада и не угодив в треугольник клина.',
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
            },
            {
                name: 'Правило чётности',
                hint: 'Верхний вал — ПРОТИВ часовой стрелки, нижний — ПО часовой. Соседние шестерни крутятся в разные стороны, поэтому всё решает число шестерён в цепи, а не их размер.',
                inventory: { S: 2, M: 2, L: 2 },
                nodes: [
                    { id: 'drv',  x: -120, y:   12, type: 'driver', size: 'S', dir: 1 },
                    { id: 'trgA', x:   84, y:  -48, type: 'target', size: 'S', targetDir: -1 },
                    { id: 'trgB', x:   96, y:   48, type: 'target', size: 'M', targetDir: 1 },
                    { id: 'p1',   x:   12, y:  -36, type: 'pin',    size: null },
                    { id: 'p2',   x: -120, y:   84, type: 'pin',    size: null },
                    { id: 'p3',   x:  -96, y:  -84, type: 'pin',    size: null },
                    { id: 'p4',   x:  -72, y:   48, type: 'pin',    size: null },
                    { id: 'p5',   x:  -60, y:  -36, type: 'pin',    size: null },
                    { id: 'p6',   x: -180, y:    0, type: 'pin',    size: null },
                    { id: 'p7',   x:   12, y:   60, type: 'pin',    size: null },
                    { id: 'p8',   x: -132, y:  -36, type: 'pin',    size: null },
                    { id: 'p9',   x:  156, y:   48, type: 'pin',    size: null }
                ]
            },
            {
                name: 'Встречные приводы',
                hint: 'Два мотора крутятся навстречу друг другу. Питать вал можно от любого из них — лишь бы направление совпало. Но если связать цепи двух моторов, привод заклинит.',
                inventory: { S: 4, M: 2, L: 2 },
                nodes: [
                    { id: 'drvA', x: -144, y:  -12, type: 'driver', size: 'M', dir: 1 },
                    { id: 'drvB', x:  156, y:   36, type: 'driver', size: 'S', dir: -1 },
                    { id: 'trgA', x:  -48, y:   48, type: 'target', size: 'S', targetDir: -1 },
                    { id: 'trgB', x:   36, y:   60, type: 'target', size: 'M', targetDir: 1 },
                    { id: 'trgC', x:   36, y:  -60, type: 'target', size: 'M', targetDir: -1 },
                    { id: 'p1',   x:  -48, y:  -72, type: 'pin',    size: null },
                    { id: 'p2',   x:  -48, y:    0, type: 'pin',    size: null },
                    { id: 'p3',   x:  -96, y:   48, type: 'pin',    size: null },
                    { id: 'p4',   x: -144, y:   48, type: 'pin',    size: null },
                    { id: 'p5',   x:   96, y:   60, type: 'pin',    size: null },
                    { id: 'p6',   x:   48, y:    0, type: 'pin',    size: null },
                    { id: 'p7',   x:  168, y:  -12, type: 'pin',    size: null },
                    { id: 'p8',   x: -132, y:  -84, type: 'pin',    size: null },
                    { id: 'p9',   x:  120, y:  -72, type: 'pin',    size: null },
                    { id: 'p10',  x:  108, y:    0, type: 'pin',    size: null }
                ]
            },
            {
                name: 'Главный синхронизатор',
                hint: 'Вал «2x» должен вращаться вдвое быстрее мотора: скорость зависит от числа зубьев мотора и вала. Паразитная шестерня в центре передаёт вращение всем, кто её коснётся.',
                inventory: { S: 4, M: 3, L: 2 },
                nodes: [
                    { id: 'drvL',  x: -132, y:   24, type: 'driver', size: 'L', dir: -1 },
                    { id: 'drvS',  x:  144, y:  -24, type: 'driver', size: 'S', dir: 1 },
                    { id: 'idler', x:    0, y:   36, type: 'fixed',  size: 'M' },
                    { id: 'trg2x', x:  120, y:   72, type: 'target', size: 'S', targetDir: -1, minSpeed: 1.9 },
                    { id: 'trgB',  x:  -12, y:  -72, type: 'target', size: 'S', targetDir: 1 },
                    { id: 'trgC',  x:  -96, y:  -48, type: 'target', size: 'S', targetDir: -1 },
                    { id: 'p1',    x:  -12, y:  -24, type: 'pin',    size: null },
                    { id: 'p2',    x:   72, y:   36, type: 'pin',    size: null },
                    { id: 'p3',    x:  132, y:   24, type: 'pin',    size: null },
                    { id: 'p4',    x:  144, y:  -84, type: 'pin',    size: null },
                    { id: 'p5',    x:   84, y:  -84, type: 'pin',    size: null },
                    { id: 'p6',    x:   36, y:  -72, type: 'pin',    size: null },
                    { id: 'p7',    x:  -60, y:   24, type: 'pin',    size: null },
                    { id: 'p8',    x:   84, y:  -36, type: 'pin',    size: null },
                    { id: 'p9',    x:  168, y:   72, type: 'pin',    size: null },
                    { id: 'p10',   x:  -36, y:   84, type: 'pin',    size: null },
                    { id: 'p11',   x: -144, y:  -48, type: 'pin',    size: null }
                ]
            }
        ];

        this.statusBadge = document.getElementById('puzzleStatusBadge');
        this.taskText = document.getElementById('puzzleTaskText');
        this.resetPuzzleBtn = document.getElementById('puzzleResetBtn');
        this.prevLevelBtn = document.getElementById('puzzlePrevLevelBtn');
        this.nextLevelBtn = document.getElementById('puzzleNextLevelBtn');
        this.levelSelect = document.getElementById('puzzleLevelSelect');
        this.sizeButtons = document.querySelectorAll('[data-gear-size]');

        this.currentLevelIdx = 0;
        this.selectedSize = 'M';
        this.nodes = [];
        this.remainingStock = { S: 0, M: 0, L: 0 };
        this.solvedLevels = new Set();

        this.masterPhase = 0;
        this.isJammed = false;
        this.isSolved = false;
        this.errorFlashNode = null;
        this.errorFlashTimer = 0;

        this.bindEvents();
        this.loadLevel(0);
        this.startLoop();
    }

    renderLevelSelector() {
        if (!this.levelSelect) return;
        this.levelSelect.innerHTML = '';
        this.PUZZLE_LEVELS.forEach((lvl, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            const check = this.solvedLevels.has(idx) ? '✓ ' : '';
            opt.textContent = `${check}Уровень ${idx + 1} из ${this.PUZZLE_LEVELS.length}: ${lvl.name}`;
            if (idx === this.currentLevelIdx) opt.selected = true;
            this.levelSelect.appendChild(opt);
        });

        if (this.prevLevelBtn) this.prevLevelBtn.disabled = (this.currentLevelIdx <= 0);
        if (this.nextLevelBtn) this.nextLevelBtn.disabled = (this.currentLevelIdx >= this.PUZZLE_LEVELS.length - 1);
    }

    updateInventoryUI() {
        const lvlInv = this.PUZZLE_LEVELS[this.currentLevelIdx].inventory;
        const used = { S: 0, M: 0, L: 0 };
        this.nodes.forEach(n => {
            if (n.type === 'pin' && n.size) used[n.size]++;
        });

        ['S', 'M', 'L'].forEach(sz => {
            this.remainingStock[sz] = Math.max(0, lvlInv[sz] - used[sz]);
        });

        this.sizeButtons.forEach(btn => {
            const sz = btn.dataset.gearSize;
            const count = this.remainingStock[sz];
            btn.textContent = `⚙ ${this.GEAR_SPECS[sz].label} [${count}]`;
            btn.style.opacity = count === 0 ? '0.45' : '1';
        });

        if (this.remainingStock[this.selectedSize] === 0) {
            const available = ['S', 'M', 'L'].find(sz => this.remainingStock[sz] > 0);
            if (available) {
                this.selectedSize = available;
                this.sizeButtons.forEach(b => b.classList.toggle('active', b.dataset.gearSize === this.selectedSize));
            }
        }
    }

    loadLevel(idx) {
        this.currentLevelIdx = Math.max(0, Math.min(this.PUZZLE_LEVELS.length - 1, idx));
        const lvl = this.PUZZLE_LEVELS[this.currentLevelIdx];
        this.nodes = lvl.nodes.map(n => ({
            ...n,
            phase0: 0,
            speed: 0,
            jammed: false
        }));
        if (this.taskText) this.taskText.textContent = lvl.hint;
        this.updateInventoryUI();
        this.recalculateKinematics();
        this.renderLevelSelector();
    }

    isTargetSatisfied(t) {
        if (this.isJammed || t.speed === 0) return false;
        if (Math.sign(t.speed) !== t.targetDir) return false;
        if (t.minSpeed && Math.abs(t.speed) < t.minSpeed) return false;
        return true;
    }

    synchronizeToothPhases(activeNodes) {
        const priority = { driver: 0, fixed: 1, pin: 2, target: 3 };
        const sorted = [...activeNodes].sort((a, b) => priority[a.type] - priority[b.type]);
        const visited = new Set();

        for (const rootNode of sorted) {
            if (visited.has(rootNode)) continue;
            visited.add(rootNode);
            if (rootNode.type === 'driver') rootNode.phase0 = 0;

            const q = [rootNode];
            while (q.length > 0) {
                const curr = q.shift();
                const r1 = this.GEAR_SPECS[curr.size].radius;
                const z1 = this.GEAR_SPECS[curr.size].teeth;
                const dt1 = (Math.PI * 2) / z1;

                for (const next of activeNodes) {
                    if (visited.has(next) || next === curr) continue;
                    const r2 = this.GEAR_SPECS[next.size].radius;
                    const z2 = this.GEAR_SPECS[next.size].teeth;
                    const dist = Math.hypot(curr.x - next.x, curr.y - next.y);

                    if (Math.abs(dist - (r1 + r2)) <= 2.5) {
                        const alpha = Math.atan2(next.y - curr.y, next.x - curr.x);
                        const dt2 = (Math.PI * 2) / z2;
                        next.phase0 = (alpha + Math.PI) - dt2 * (0.5 - (alpha - curr.phase0) / dt1);
                        visited.add(next);
                        q.push(next);
                    }
                }
            }
        }
    }

    recalculateKinematics() {
        this.isJammed = false;
        this.isSolved = false;

        this.nodes.forEach(n => {
            n.speed = 0;
            n.jammed = false;
        });

        const activeNodes = this.nodes.filter(n => n.size !== null);
        this.synchronizeToothPhases(activeNodes);

        const queue = [];
        activeNodes.forEach(n => {
            if (n.type === 'driver') {
                n.speed = n.dir * 1.0;
                queue.push(n);
            }
        });

        while (queue.length > 0) {
            const curr = queue.shift();
            const r1 = this.GEAR_SPECS[curr.size].radius;
            const z1 = this.GEAR_SPECS[curr.size].teeth;

            for (const next of activeNodes) {
                if (next === curr) continue;
                const r2 = this.GEAR_SPECS[next.size].radius;
                const z2 = this.GEAR_SPECS[next.size].teeth;
                const dist = Math.hypot(curr.x - next.x, curr.y - next.y);

                if (Math.abs(dist - (r1 + r2)) <= 2.5) {
                    const expectedSpeed = -curr.speed * (z1 / z2);

                    if (next.speed === 0) {
                        next.speed = expectedSpeed;
                        queue.push(next);
                    } else if (Math.abs(next.speed - expectedSpeed) > 0.05) {
                        this.isJammed = true;
                        curr.jammed = true;
                        next.jammed = true;
                    }
                }
            }
        }

        if (this.isJammed) {
            activeNodes.forEach(n => {
                if (n.speed !== 0) n.jammed = true;
                n.speed = 0;
            });
        }

        const targets = this.nodes.filter(n => n.type === 'target');
        this.isSolved = !this.isJammed && targets.every(t => this.isTargetSatisfied(t));

        if (this.isSolved && !this.solvedLevels.has(this.currentLevelIdx)) {
            this.solvedLevels.add(this.currentLevelIdx);
            this.renderLevelSelector();
        }

        if (this.statusBadge) {
            if (this.isJammed) {
                this.statusBadge.textContent = '⚠ Клин привода!';
                this.statusBadge.style.borderColor = '#ef4444';
                this.statusBadge.style.background = 'rgba(239, 68, 68, 0.22)';
            } else if (this.isSolved) {
                this.statusBadge.textContent = `✓ Ур. ${this.currentLevelIdx + 1} решён!`;
                this.statusBadge.style.borderColor = '#4ade80';
                this.statusBadge.style.background = 'rgba(74, 222, 128, 0.22)';
                if (window.WG && WG.Engine) WG.Engine.boostGears(0.9, 1600);
            } else {
                const wrongDir = targets.some(t => t.speed !== 0 && Math.sign(t.speed) !== t.targetDir);
                const tooSlow = targets.some(t => t.speed !== 0 && Math.sign(t.speed) === t.targetDir && t.minSpeed && Math.abs(t.speed) < t.minSpeed);

                if (wrongDir) {
                    this.statusBadge.textContent = '↺ Не та сторона!';
                } else if (tooSlow) {
                    this.statusBadge.textContent = '⚡ Медленно (нужно 2x)!';
                } else {
                    this.statusBadge.textContent = `Уровень ${this.currentLevelIdx + 1} / ${this.PUZZLE_LEVELS.length}`;
                }
                this.statusBadge.style.borderColor = 'var(--color-accent)';
                this.statusBadge.style.background = 'rgba(217, 119, 6, 0.15)';
            }
        }
    }

    bindEvents() {
        this.canvas.addEventListener('pointerdown', e => {
            const pos = this.getCanvasPos(e);
            const physX = (pos.x - this.ORIGIN_X) / this.VIEW_SCALE;
            const physY = (pos.y - this.ORIGIN_Y) / this.VIEW_SCALE;

            for (const node of this.nodes) {
                if (node.type !== 'pin') continue;
                const hitR = node.size ? this.GEAR_SPECS[node.size].radius : 24;

                if (Math.hypot(physX - node.x, physY - node.y) <= hitR) {
                    if (node.size !== null) {
                        const removedSize = node.size;
                        node.size = null;
                        this.selectedSize = removedSize;
                        this.sizeButtons.forEach(b => b.classList.toggle('active', b.dataset.gearSize === this.selectedSize));
                        this.updateInventoryUI();
                        this.recalculateKinematics();
                        return;
                    }

                    if (this.remainingStock[this.selectedSize] <= 0) {
                        this.errorFlashNode = node;
                        this.errorFlashTimer = 20;
                        return;
                    }

                    const candR = this.GEAR_SPECS[this.selectedSize].radius;
                    let overlaps = false;
                    for (const other of this.nodes) {
                        if (other === node || other.size === null) continue;
                        const otherR = this.GEAR_SPECS[other.size].radius;
                        const dist = Math.hypot(node.x - other.x, node.y - other.y);
                        if (dist < (candR + otherR) - 2.5) {
                            overlaps = true;
                            break;
                        }
                    }

                    if (overlaps) {
                        this.errorFlashNode = node;
                        this.errorFlashTimer = 25;
                    } else {
                        node.size = this.selectedSize;
                        this.updateInventoryUI();
                        this.recalculateKinematics();
                    }
                    return;
                }
            }
        });

        this.sizeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.sizeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedSize = btn.dataset.gearSize;
            });
        });

        if (this.levelSelect) {
            this.levelSelect.addEventListener('change', () => this.loadLevel(Number(this.levelSelect.value)));
        }
        if (this.prevLevelBtn) {
            this.prevLevelBtn.addEventListener('click', () => this.loadLevel(this.currentLevelIdx - 1));
        }
        if (this.nextLevelBtn) {
            this.nextLevelBtn.addEventListener('click', () => this.loadLevel(this.currentLevelIdx + 1));
        }
        if (this.resetPuzzleBtn) {
            this.resetPuzzleBtn.addEventListener('click', () => this.loadLevel(this.currentLevelIdx));
        }
    }

    drawGearShape(x, y, radius, teeth, angle, palette) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        const outerR = radius + 4.2;
        const innerR = radius - 5.2;
        const step = (Math.PI * 2) / teeth;

        ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
            const centerA = i * step;
            const a0 = centerA - step * 0.34;
            const a1 = centerA - step * 0.14;
            const a2 = centerA + step * 0.14;
            const a3 = centerA + step * 0.34;
            const a4 = centerA + step * 0.66;

            if (i === 0) {
                ctx.moveTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
            } else {
                ctx.lineTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
            }
            ctx.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
            ctx.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
            ctx.lineTo(Math.cos(a3) * innerR, Math.sin(a3) * innerR);
            ctx.lineTo(Math.cos(a4) * innerR, Math.sin(a4) * innerR);
        }
        ctx.closePath();

        ctx.fillStyle = palette.fill;
        ctx.strokeStyle = palette.stroke;
        ctx.lineWidth = 1.8;
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.56, 0, Math.PI * 2);
        ctx.fillStyle = '#121216';
        ctx.fill();
        ctx.stroke();

        for (let s = 0; s < 4; s++) {
            const sa = s * (Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(Math.cos(sa) * 7, Math.sin(sa) * 7);
            ctx.lineTo(Math.cos(sa) * (radius * 0.56), Math.sin(sa) * (radius * 0.56));
            ctx.lineWidth = 3.2;
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

    drawDirectionArrow(x, y, dir, color, isTurbo = false) {
        const ctx = this.ctx;
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

    update() {
        if (!this.isJammed) {
            this.masterPhase += 0.022;
        }
    }

    render() {
        const ctx = this.ctx;
        ctx.fillStyle = '#0b0c10';
        ctx.fillRect(0, 0, this.CANVAS_W, this.CANVAS_H);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
        ctx.lineWidth = 1;
        const gridStep = 34;
        for (let gx = gridStep; gx < this.CANVAS_W; gx += gridStep) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, this.CANVAS_H);
            ctx.stroke();
        }
        for (let gy = gridStep; gy < this.CANVAS_H; gy += gridStep) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(this.CANVAS_W, gy);
            ctx.stroke();
        }

        ctx.save();
        ctx.translate(this.ORIGIN_X, this.ORIGIN_Y);
        ctx.scale(this.VIEW_SCALE, this.VIEW_SCALE);

        this.nodes.forEach(node => {
            if (node.size === null) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, 9.5, 0, Math.PI * 2);
                ctx.fillStyle = '#27272a';
                ctx.strokeStyle = '#d97706';
                ctx.lineWidth = 2;
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(node.x, node.y, 3.8, 0, Math.PI * 2);
                ctx.fillStyle = '#fbbf24';
                ctx.fill();
            }
        });

        if (this.errorFlashTimer > 0 && this.errorFlashNode) {
            this.errorFlashTimer--;
            ctx.beginPath();
            ctx.arc(this.errorFlashNode.x, this.errorFlashNode.y, this.GEAR_SPECS[this.selectedSize].radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.78)';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }

        this.nodes.forEach(node => {
            if (!node.size) return;
            const spec = this.GEAR_SPECS[node.size];
            const currentAngle = node.phase0 + node.speed * this.masterPhase;

            let palette = { fill: '#78350f', stroke: '#b45309', hub: '#d97706' };

            if (node.jammed) {
                palette = { fill: '#7f1d1d', stroke: '#ef4444', hub: '#fca5a5' };
            } else if (node.type === 'driver') {
                palette = { fill: '#92400e', stroke: '#f59e0b', hub: '#fde68a' };
            } else if (node.type === 'fixed') {
                palette = { fill: '#3f3f46', stroke: '#a1a1aa', hub: '#e4e4e7' };
            } else if (node.type === 'target') {
                const ok = this.isTargetSatisfied(node);
                const spinningButWrong = node.speed !== 0 && !ok;
                if (ok) {
                    palette = { fill: '#14532d', stroke: '#4ade80', hub: '#bbf7d0' };
                } else if (spinningButWrong) {
                    palette = { fill: '#7f1d1d', stroke: '#f87171', hub: '#fecaca' };
                } else {
                    palette = { fill: '#1e293b', stroke: '#38bdf8', hub: '#bae6fd' };
                }
            }

            this.drawGearShape(node.x, node.y, spec.radius, spec.teeth, currentAngle, palette);

            if (node.type === 'driver') {
                this.drawDirectionArrow(node.x, node.y, node.dir, '#fde68a', false);
            } else if (node.type === 'target') {
                const ok = this.isTargetSatisfied(node);
                const arrowColor = ok ? '#4ade80' : '#38bdf8';
                this.drawDirectionArrow(node.x, node.y, node.targetDir, arrowColor, !!node.minSpeed);
            }
        });

        ctx.restore();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    new WG.GearPuzzleWidget('gearPuzzleCanvas');
});
