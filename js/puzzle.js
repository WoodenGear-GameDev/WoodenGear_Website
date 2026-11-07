window.WG = window.WG || {};

WG.GEAR_TOL = 2.5;

// Gear rings present on an axle. A dual axle always carries its built-in ring;
// the ring the player adds (always the larger one) turns on the same shaft.
WG.gearRings = function (node, specs) {
    if (node.type === 'dual') {
        return node.size ? [specs[node.base], specs[node.size]] : [specs[node.base]];
    }
    return node.size ? [specs[node.size]] : [];
};

// Two axles may stand side by side if some pair of their rings meshes
// or if they do not touch at all.
WG.gearsCompatible = function (a, b, specs) {
    const ringsA = WG.gearRings(a, specs);
    const ringsB = WG.gearRings(b, specs);
    if (ringsA.length === 0 || ringsB.length === 0) return true;
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    let maxA = 0;
    let maxB = 0;
    for (const p of ringsA) {
        maxA = Math.max(maxA, p.radius);
        for (const q of ringsB) {
            if (Math.abs(dist - (p.radius + q.radius)) <= WG.GEAR_TOL) return true;
        }
    }
    for (const q of ringsB) maxB = Math.max(maxB, q.radius);
    return dist >= maxA + maxB - WG.GEAR_TOL;
};

// Speed check of a spinning target shaft: 'ok', 'slow' or 'fast'.
WG.targetSpeedState = function (t) {
    const v = Math.abs(t.speed);
    if (t.exactSpeed) {
        if (v < t.exactSpeed - 0.05) return 'slow';
        if (v > t.exactSpeed + 0.05) return 'fast';
        return 'ok';
    }
    if (t.minSpeed && v < t.minSpeed) return 'slow';
    if (t.maxSpeed && v > t.maxSpeed + 0.05) return 'fast';
    return 'ok';
};

// Spreads rotation from the motors through meshing rings and belts.
// Sets node.speed / node.jammed and reports what, if anything, jammed the drive.
WG.computeGearKinematics = function (nodes, belts, specs) {
    nodes.forEach(n => {
        n.speed = 0;
        n.jammed = false;
    });

    const active = nodes.filter(n => WG.gearRings(n, specs).length > 0);
    const rings = new Map(active.map(n => [n, WG.gearRings(n, specs)]));
    const beltLinks = new Map();
    (belts || []).forEach(belt => {
        if (!rings.has(belt.a) || !rings.has(belt.b)) return;
        if (!beltLinks.has(belt.a)) beltLinks.set(belt.a, []);
        if (!beltLinks.has(belt.b)) beltLinks.set(belt.b, []);
        beltLinks.get(belt.a).push({ other: belt.b, cross: !!belt.cross });
        beltLinks.get(belt.b).push({ other: belt.a, cross: !!belt.cross });
    });

    let conflict = false;
    let ratchetLock = false;
    let stuckHit = false;
    const queue = [];

    const drive = (curr, next, expectedSpeed) => {
        if (next.type === 'stuck') {
            stuckHit = true;
            curr.jammed = true;
            next.jammed = true;
            return;
        }
        if (next.speed === 0) {
            next.speed = expectedSpeed;
            if (next.type === 'ratchet' && Math.sign(expectedSpeed) !== next.allowDir) {
                ratchetLock = true;
                next.jammed = true;
            }
            queue.push(next);
        } else if (Math.abs(next.speed - expectedSpeed) > 0.05) {
            conflict = true;
            curr.jammed = true;
            next.jammed = true;
        }
    };

    active.forEach(n => {
        if (n.type === 'driver') {
            n.speed = n.dir * 1.0;
            queue.push(n);
        }
    });

    while (queue.length > 0) {
        const curr = queue.shift();
        const currRings = rings.get(curr);

        for (const next of active) {
            if (next === curr) continue;
            const dist = Math.hypot(curr.x - next.x, curr.y - next.y);
            for (const a of currRings) {
                for (const b of rings.get(next)) {
                    if (Math.abs(dist - (a.radius + b.radius)) <= WG.GEAR_TOL) {
                        drive(curr, next, -curr.speed * (a.teeth / b.teeth));
                    }
                }
            }
        }

        for (const link of (beltLinks.get(curr) || [])) {
            const za = currRings[0].teeth;
            const zb = rings.get(link.other)[0].teeth;
            drive(curr, link.other, (link.cross ? -1 : 1) * curr.speed * (za / zb));
        }
    }

    const isJammed = conflict || ratchetLock || stuckHit;
    if (isJammed) {
        active.forEach(n => {
            if (n.speed !== 0) n.jammed = true;
            n.speed = 0;
        });
    }
    let jamKind = null;
    if (stuckHit) jamKind = 'stuck';
    else if (ratchetLock) jamKind = 'ratchet';
    else if (conflict) jamKind = 'conflict';
    return { isJammed, jamKind };
};

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
                hint: 'От центрального мотора и паразитной шестерни запитай все 3 замка, использовав каждую деталь со склада и не угодив в треугольник клина.',
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
            },
            {
                name: 'Три мотора',
                hint: 'Три мотора, четыре вала — здесь нужен каждый мотор. Вал «2x» должен вращаться вдвое быстрее мотора: считай зубья мотора и вала, а не только направление.',
                inventory: { S: 6, M: 4, L: 0 },
                nodes: [
                    { id: 'drvA',  x: -156, y:    0, type: 'driver', size: 'L', dir: 1 },
                    { id: 'drvB',  x:  132, y:   24, type: 'driver', size: 'S', dir: -1 },
                    { id: 'drvC',  x:  -12, y:   72, type: 'driver', size: 'M', dir: -1 },
                    { id: 'idler', x:  168, y:  -84, type: 'fixed',  size: 'S' },
                    { id: 'trgA',  x:   48, y:   36, type: 'target', size: 'S', targetDir: -1 },
                    { id: 'trgB',  x: -168, y:   84, type: 'target', size: 'S', targetDir: 1 },
                    { id: 'trgC',  x:   48, y:  -84, type: 'target', size: 'S', targetDir: -1 },
                    { id: 'trg2x', x:   24, y:  -24, type: 'target', size: 'S', targetDir: -1, minSpeed: 1.9 },
                    { id: 'p1',    x:  -84, y:    0, type: 'pin',    size: null },
                    { id: 'p2',    x:  168, y:  -24, type: 'pin',    size: null },
                    { id: 'p3',    x:  -72, y:   84, type: 'pin',    size: null },
                    { id: 'p4',    x:    0, y:  -84, type: 'pin',    size: null },
                    { id: 'p5',    x:  108, y:  -72, type: 'pin',    size: null },
                    { id: 'p6',    x:   96, y:   72, type: 'pin',    size: null },
                    { id: 'p7',    x: -120, y:   84, type: 'pin',    size: null },
                    { id: 'p8',    x:  -96, y:  -48, type: 'pin',    size: null },
                    { id: 'p9',    x:   84, y:  -12, type: 'pin',    size: null },
                    { id: 'p10',   x:  180, y:   24, type: 'pin',    size: null },
                    { id: 'p11',   x: -144, y:  -84, type: 'pin',    size: null },
                    { id: 'p12',   x:  -36, y:  -36, type: 'pin',    size: null }
                ]
            },
            {
                name: 'Сцепка паразитов',
                hint: 'Две паразитные шестерни зацеплены друг с другом: раскрутишь одну — вторая закрутится в обратную сторону. Считай чётность цепочки от каждого мотора до вала.',
                inventory: { S: 6, M: 3, L: 1 },
                nodes: [
                    { id: 'drvA',   x: -144, y:   12, type: 'driver', size: 'L', dir: -1 },
                    { id: 'drvB',   x:  144, y:  -72, type: 'driver', size: 'M', dir: 1 },
                    { id: 'idlerA', x:   96, y:   12, type: 'fixed',  size: 'S' },
                    { id: 'idlerB', x:  108, y:   60, type: 'fixed',  size: 'S' },
                    { id: 'trgA',   x:   36, y:   72, type: 'target', size: 'S', targetDir: 1 },
                    { id: 'trg2x',  x:   24, y:   12, type: 'target', size: 'S', targetDir: -1, minSpeed: 1.9 },
                    { id: 'trgB',   x: -108, y:   84, type: 'target', size: 'S', targetDir: -1 },
                    { id: 'trgC',   x:  168, y:   24, type: 'target', size: 'S', targetDir: -1 },
                    { id: 'p1',     x:  -60, y:   84, type: 'pin',    size: null },
                    { id: 'p2',     x:   96, y:  -36, type: 'pin',    size: null },
                    { id: 'p3',     x:  -12, y:   60, type: 'pin',    size: null },
                    { id: 'p4',     x:  -96, y:  -72, type: 'pin',    size: null },
                    { id: 'p5',     x: -156, y:   84, type: 'pin',    size: null },
                    { id: 'p6',     x:   24, y:  -36, type: 'pin',    size: null },
                    { id: 'p7',     x:  156, y:   72, type: 'pin',    size: null },
                    { id: 'p8',     x:  -48, y:  -36, type: 'pin',    size: null },
                    { id: 'p9',     x:   60, y:  -84, type: 'pin',    size: null },
                    { id: 'p10',    x:  -60, y:   24, type: 'pin',    size: null },
                    { id: 'p11',    x: -156, y:  -72, type: 'pin',    size: null },
                    { id: 'p12',    x:  -12, y:  -84, type: 'pin',    size: null }
                ]
            },
            {
                name: 'Финальный механизм',
                hint: 'Пять валов, три мотора разного размера, два вала — «2x». Каждый вал берёт вращение у своего мотора, а сети разных моторов соединять нельзя — привод заклинит.',
                inventory: { S: 6, M: 4, L: 1 },
                nodes: [
                    { id: 'drvA',   x: -144, y:  -12, type: 'driver', size: 'L', dir: -1 },
                    { id: 'drvB',   x:  132, y:    0, type: 'driver', size: 'M', dir: -1 },
                    { id: 'drvC',   x:   24, y:  -24, type: 'driver', size: 'S', dir: 1 },
                    { id: 'idlerA', x:  -60, y:   36, type: 'fixed',  size: 'S' },
                    { id: 'idlerB', x:  -48, y:   84, type: 'fixed',  size: 'S' },
                    { id: 'trgA',   x:  -12, y:  -84, type: 'target', size: 'S', targetDir: 1 },
                    { id: 'trg2x',  x: -144, y:   84, type: 'target', size: 'S', targetDir: 1, minSpeed: 1.9 },
                    { id: 'trg2x2', x: -108, y:  -84, type: 'target', size: 'S', targetDir: -1, minSpeed: 1.9 },
                    { id: 'trgB',   x:  144, y:  -84, type: 'target', size: 'S', targetDir: 1 },
                    { id: 'trgC',   x:  132, y:   72, type: 'target', size: 'S', targetDir: -1 },
                    { id: 'p1',     x:  -60, y:  -24, type: 'pin',    size: null },
                    { id: 'p2',     x:   84, y:  -36, type: 'pin',    size: null },
                    { id: 'p3',     x:   24, y:   24, type: 'pin',    size: null },
                    { id: 'p4',     x:   36, y:  -72, type: 'pin',    size: null },
                    { id: 'p5',     x:   96, y:  -84, type: 'pin',    size: null },
                    { id: 'p6',     x: -156, y:  -84, type: 'pin',    size: null },
                    { id: 'p7',     x:   72, y:   60, type: 'pin',    size: null },
                    { id: 'p8',     x:  -96, y:   84, type: 'pin',    size: null },
                    { id: 'p9',     x:   12, y:   84, type: 'pin',    size: null },
                    { id: 'p10',    x:  180, y:   36, type: 'pin',    size: null },
                    { id: 'p11',    x:  180, y:  -36, type: 'pin',    size: null },
                    { id: 'p12',    x:  180, y:   84, type: 'pin',    size: null },
                    { id: 'p13',    x:  -60, y:  -84, type: 'pin',    size: null }
                ]
            },
            {
                name: 'Ремённая передача',
                hint: 'Ремень крутит обе шестерни в ОДНУ сторону. Ржавые шестерни не вращаются: задел такую — и привод заклинило. Вал «≤1x» хрупкий: не крути его быстрее мотора.',
                inventory: { S: 6, M: 3, L: 1 },
                belts: [{ a: 'idlerA', b: 'trgB', cross: false }],
                nodes: [
                    { id: 'drvA',   x: -156, y:  -24, type: 'driver',  size: 'L', dir: -1 },
                    { id: 'drvB',   x:  132, y:  -24, type: 'driver',  size: 'M', dir: 1 },
                    { id: 'idlerA', x:   48, y:  -12, type: 'fixed',   size: 'S' },
                    { id: 'rustA',  x:   60, y:  -72, type: 'stuck',   size: 'S' },
                    { id: 'rustB',  x:   84, y:   84, type: 'stuck',   size: 'S' },
                    { id: 'trgA',   x:  168, y:  -84, type: 'target',  size: 'S', targetDir: 1 },
                    { id: 'trgB',   x:  -84, y:  -84, type: 'target',  size: 'M', targetDir: -1, maxSpeed: 1 },
                    { id: 'trgC',   x:  156, y:   72, type: 'target',  size: 'S', targetDir: 1 },
                    { id: 'trgD',   x:  -24, y:   24, type: 'target',  size: 'S', targetDir: -1, minSpeed: 1.9 },
                    { id: 'p1',     x: -156, y:   48, type: 'pin',     size: null },
                    { id: 'p2',     x:  120, y:  -84, type: 'pin',     size: null },
                    { id: 'p3',     x:  -96, y:   60, type: 'pin',     size: null },
                    { id: 'p4',     x:  -36, y:   72, type: 'pin',     size: null },
                    { id: 'p5',     x:   96, y:   24, type: 'pin',     size: null },
                    { id: 'p6',     x:   48, y:   36, type: 'pin',     size: null },
                    { id: 'p7',     x:  168, y:   24, type: 'pin',     size: null },
                    { id: 'p8',     x:  -36, y:  -24, type: 'pin',     size: null },
                    { id: 'p9',     x:  -84, y:  -24, type: 'pin',     size: null },
                    { id: 'p10',    x:   36, y:   84, type: 'pin',     size: null },
                    { id: 'p11',    x: -132, y:   84, type: 'pin',     size: null },
                    { id: 'p12',    x:  -24, y:  -72, type: 'pin',     size: null }
                ]
            },
            {
                name: 'Храповик',
                hint: 'Бирюзовый храповик вращается только по своей стрелке, иначе стопорит весь привод. Перекрёстный ремень меняет направление, как обычное зацепление.',
                inventory: { S: 5, M: 2, L: 1 },
                belts: [{ a: 'idlerA', b: 'trgC', cross: true }],
                nodes: [
                    { id: 'drvA',     x: -156, y:  -12, type: 'driver',  size: 'L', dir: -1 },
                    { id: 'drvB',     x:  144, y:   48, type: 'driver',  size: 'M', dir: 1 },
                    { id: 'drvC',     x:   36, y:  -36, type: 'driver',  size: 'S', dir: -1 },
                    { id: 'ratchetA', x:  -96, y:   72, type: 'ratchet', size: 'L', allowDir: -1 },
                    { id: 'ratchetB', x:   24, y:   84, type: 'ratchet', size: 'S', allowDir: -1 },
                    { id: 'idlerA',   x:   72, y:   36, type: 'fixed',   size: 'S' },
                    { id: 'trgA',     x:  144, y:  -24, type: 'target',  size: 'M', targetDir: -1, maxSpeed: 1 },
                    { id: 'trgB',     x:  -60, y:  -84, type: 'target',  size: 'S', targetDir: 1 },
                    { id: 'trgC',     x:   84, y:  -72, type: 'target',  size: 'S', targetDir: 1 },
                    { id: 'trgD',     x:  -24, y:   24, type: 'target',  size: 'S', targetDir: -1, exactSpeed: 2 },
                    { id: 'p1',       x: -168, y:   60, type: 'pin',     size: null },
                    { id: 'p2',       x:  -12, y:  -36, type: 'pin',     size: null },
                    { id: 'p3',       x:  -24, y:   84, type: 'pin',     size: null },
                    { id: 'p4',       x:  -12, y:  -84, type: 'pin',     size: null },
                    { id: 'p5',       x:   72, y:   84, type: 'pin',     size: null },
                    { id: 'p6',       x:  132, y:  -84, type: 'pin',     size: null },
                    { id: 'p7',       x:   84, y:  -24, type: 'pin',     size: null },
                    { id: 'p8',       x:   24, y:   36, type: 'pin',     size: null },
                    { id: 'p9',       x:   36, y:  -84, type: 'pin',     size: null },
                    { id: 'p10',      x: -120, y:  -84, type: 'pin',     size: null },
                    { id: 'p11',      x: -168, y:  -84, type: 'pin',     size: null },
                    { id: 'p12',      x:  180, y:  -72, type: 'pin',     size: null }
                ]
            },
            {
                name: 'Двойные оси',
                hint: 'На фиолетовую ось надень шестерню крупнее встроенной: кольца вращаются вместе, а соседи цепляются за то, до которого дотянутся. Так скорость умножается: 3x, 0,5x.',
                inventory: { S: 4, M: 5, L: 1 },
                nodes: [
                    { id: 'drvA',  x: -144, y:    0, type: 'driver',  size: 'L', dir: -1 },
                    { id: 'drvB',  x:  132, y:  -24, type: 'driver',  size: 'S', dir: 1 },
                    { id: 'dualA', x:   12, y:  -12, type: 'dual',    base: 'S', size: null },
                    { id: 'dualB', x:  -96, y:  -84, type: 'dual',    base: 'S', size: null },
                    { id: 'rustA', x:   84, y:   60, type: 'stuck',   size: 'M' },
                    { id: 'trgA',  x:  -36, y:  -84, type: 'target',  size: 'S', targetDir: 1, exactSpeed: 3 },
                    { id: 'trgB',  x:  -36, y:    0, type: 'target',  size: 'S', targetDir: -1, exactSpeed: 0.5 },
                    { id: 'trgC',  x:  168, y:  -72, type: 'target',  size: 'S', targetDir: 1 },
                    { id: 'trgD',  x:    0, y:   84, type: 'target',  size: 'M', targetDir: 1 },
                    { id: 'p1',    x: -144, y:  -72, type: 'pin',     size: null },
                    { id: 'p2',    x:   84, y:  -12, type: 'pin',     size: null },
                    { id: 'p3',    x:  180, y:  -24, type: 'pin',     size: null },
                    { id: 'p4',    x: -132, y:   72, type: 'pin',     size: null },
                    { id: 'p5',    x:  -72, y:   72, type: 'pin',     size: null },
                    { id: 'p6',    x:  180, y:   24, type: 'pin',     size: null },
                    { id: 'p7',    x:  132, y:   24, type: 'pin',     size: null },
                    { id: 'p8',    x:   24, y:  -72, type: 'pin',     size: null },
                    { id: 'p9',    x:   96, y:  -72, type: 'pin',     size: null },
                    { id: 'p10',   x: -180, y:   72, type: 'pin',     size: null }
                ]
            },
            {
                name: 'Подвижные оси',
                hint: 'Оси на рельсах переставляются: нажми на свободную метку рельса. Для каждой такой оси подбери и положение, и размер шестерни.',
                inventory: { S: 5, M: 4, L: 0 },
                belts: [{ a: 'idlerA', b: 'trgA', cross: false }],
                nodes: [
                    { id: 'drvA',     x: -156, y:   36, type: 'driver',  size: 'L', dir: -1 },
                    { id: 'drvB',     x:  144, y:   36, type: 'driver',  size: 'M', dir: 1 },
                    { id: 'ratchetA', x:  132, y:  -72, type: 'ratchet', size: 'S', allowDir: 1 },
                    { id: 'idlerA',   x:  -24, y:  -24, type: 'fixed',   size: 'S' },
                    { id: 'rustA',    x:  -72, y:  -84, type: 'stuck',   size: 'S' },
                    { id: 'trgA',     x: -168, y:  -84, type: 'target',  size: 'S', targetDir: 1, minSpeed: 1.9 },
                    { id: 'trgB',     x:   36, y:  -12, type: 'target',  size: 'S', targetDir: 1 },
                    { id: 'trgC',     x:  -24, y:   84, type: 'target',  size: 'S', targetDir: 1 },
                    { id: 'trgD',     x:   36, y:  -84, type: 'target',  size: 'S', targetDir: 1 },
                    { id: 'p1',       x:  -72, y:  -24, type: 'pin',     size: null },
                    { id: 'p2',       x:  132, y:  -24, type: 'pin',     size: null },
                    { id: 'p3',       x:   84, y:  -72, type: 'pin',     size: null },
                    { id: 'p4',       x: -168, y:  -36, type: 'pin',     size: null },
                    { id: 'p5',       x:   84, y:  -24, type: 'pin',     size: null },
                    { id: 'p6',       x: -120, y:  -72, type: 'pin',     size: null },
                    { id: 'p7',       x:  -24, y:  -72, type: 'pin',     size: null },
                    { id: 'p8',       x:  108, y:   84, type: 'pin',     size: null },
                    { id: 'p9',       x:  180, y:  -12, type: 'pin',     size: null },
                    { id: 'r1',       type: 'pin', size: null, slot: 1, rail: [{ x: -72, y: 36 }, { x: -72, y: 84 }] },
                    { id: 'r2',       type: 'pin', size: null, slot: 1, rail: [{ x: -12, y: 36 }, { x: 24, y: 36 }] },
                    { id: 'r3',       type: 'pin', size: null, slot: 0, rail: [{ x: 24, y: 84 }, { x: 72, y: 36 }] }
                ]
            },
            {
                name: 'Коробка передач',
                hint: 'Рельсы, двойная ось и ремень вместе. Число на валу — точная скорость, «≤1x» — не быстрее мотора. Найди положения рельсов, потом кольцо для двойной оси.',
                inventory: { S: 7, M: 2, L: 1 },
                belts: [{ a: 'idlerA', b: 'trgB', cross: false }],
                nodes: [
                    { id: 'drvA',   x: -144, y:  -36, type: 'driver',  size: 'L', dir: 1 },
                    { id: 'drvB',   x:  156, y:  -24, type: 'driver',  size: 'M', dir: -1 },
                    { id: 'drvC',   x:  -24, y:  -84, type: 'driver',  size: 'S', dir: 1 },
                    { id: 'idlerA', x:  -72, y:   24, type: 'fixed',   size: 'S' },
                    { id: 'dualA',  x:  132, y:   72, type: 'dual',    base: 'S', size: null },
                    { id: 'rustA',  x:   84, y:  -24, type: 'stuck',   size: 'S' },
                    { id: 'trgA',   x:  -24, y:   72, type: 'target',  size: 'S', targetDir: 1, maxSpeed: 1 },
                    { id: 'trgB',   x: -168, y:   60, type: 'target',  size: 'M', targetDir: 1 },
                    { id: 'trgC',   x:  120, y:  -84, type: 'target',  size: 'S', targetDir: -1 },
                    { id: 'trgD',   x:   60, y:   84, type: 'target',  size: 'S', targetDir: 1, exactSpeed: 3 },
                    { id: 'p1',     x:  120, y:   24, type: 'pin',     size: null },
                    { id: 'p2',     x:   24, y:  -84, type: 'pin',     size: null },
                    { id: 'p3',     x:   24, y:  -36, type: 'pin',     size: null },
                    { id: 'p4',     x:  180, y:   36, type: 'pin',     size: null },
                    { id: 'p5',     x:  -24, y:  -24, type: 'pin',     size: null },
                    { id: 'p6',     x:   60, y:   36, type: 'pin',     size: null },
                    { id: 'p7',     x:   72, y:  -72, type: 'pin',     size: null },
                    { id: 'p8',     x:  168, y:  -84, type: 'pin',     size: null },
                    { id: 'r1',     type: 'pin', size: null, slot: 0, rail: [{ x: -24, y: 24 }, { x: 12, y: 24 }] },
                    { id: 'r2',     type: 'pin', size: null, slot: 0, rail: [{ x: -72, y: -72 }, { x: -72, y: -24 }] }
                ]
            },
            {
                name: 'Большой механизм',
                hint: 'Финал: две двойные оси, ржавые ловушки и валы с точной скоростью. Скорость вала — произведение передаточных чисел по всей цепочке от мотора.',
                inventory: { S: 5, M: 4, L: 1 },
                nodes: [
                    { id: 'drvA',  x: -156, y:   24, type: 'driver',  size: 'L', dir: -1 },
                    { id: 'drvB',  x:  120, y:  -24, type: 'driver',  size: 'S', dir: 1 },
                    { id: 'dualA', x:  -36, y:   36, type: 'dual',    base: 'S', size: null },
                    { id: 'dualB', x:   12, y:  -36, type: 'dual',    base: 'S', size: null },
                    { id: 'rustA', x:   84, y:   36, type: 'stuck',   size: 'M' },
                    { id: 'trgA',  x:  168, y:  -72, type: 'target',  size: 'S', targetDir: 1 },
                    { id: 'trgB',  x:   24, y:  -84, type: 'target',  size: 'S', targetDir: 1, exactSpeed: 2 },
                    { id: 'trgC',  x:  -96, y:  -72, type: 'target',  size: 'S', targetDir: -1, exactSpeed: 2 },
                    { id: 'trgD',  x:  144, y:   72, type: 'target',  size: 'S', targetDir: -1 },
                    { id: 'p1',    x: -156, y:  -60, type: 'pin',     size: null },
                    { id: 'p2',    x:  168, y:  -24, type: 'pin',     size: null },
                    { id: 'p3',    x:  156, y:   24, type: 'pin',     size: null },
                    { id: 'p4',    x:  -84, y:   24, type: 'pin',     size: null },
                    { id: 'p5',    x:  -48, y:  -24, type: 'pin',     size: null },
                    { id: 'p6',    x:   12, y:   24, type: 'pin',     size: null },
                    { id: 'p7',    x:   72, y:  -24, type: 'pin',     size: null },
                    { id: 'p8',    x:   84, y:  -72, type: 'pin',     size: null },
                    { id: 'p9',    x:  -96, y:   84, type: 'pin',     size: null },
                    { id: 'p10',   x:  -36, y:  -84, type: 'pin',     size: null }
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
        this.errorFlashR = 0;
        this.belts = [];
        this.jamKind = null;

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
            if ((n.type === 'pin' || n.type === 'dual') && n.size) used[n.size]++;
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
        this.nodes = lvl.nodes.map(n => {
            const node = { ...n, phase0: 0, speed: 0, jammed: false };
            if (n.rail) {
                node.slot = n.slot || 0;
                node.x = n.rail[node.slot].x;
                node.y = n.rail[node.slot].y;
            }
            return node;
        });
        const byId = new Map(this.nodes.map(n => [n.id, n]));
        this.belts = (lvl.belts || []).map(b => ({ a: byId.get(b.a), b: byId.get(b.b), cross: !!b.cross }));
        if (this.taskText) this.taskText.textContent = lvl.hint;
        this.updateInventoryUI();
        this.recalculateKinematics();
        this.renderLevelSelector();
    }

    isTargetSatisfied(t) {
        if (this.isJammed || t.speed === 0) return false;
        if (Math.sign(t.speed) !== t.targetDir) return false;
        return WG.targetSpeedState(t) === 'ok';
    }

    speedLabel(t) {
        const fmt = v => String(Math.round(v * 100) / 100).replace('.', ',');
        if (t.exactSpeed) return `${fmt(t.exactSpeed)}x`;
        if (t.minSpeed) return t.minSpeed === 1.9 ? '2x' : `≥${fmt(t.minSpeed)}x`;
        if (t.maxSpeed) return `≤${fmt(t.maxSpeed)}x`;
        return '';
    }

    synchronizeToothPhases(activeNodes) {
        const priority = { driver: 0, fixed: 1, ratchet: 1, stuck: 1, dual: 1, pin: 2, target: 3 };
        const sorted = [...activeNodes].sort((a, b) => priority[a.type] - priority[b.type]);
        const visited = new Set();

        for (const rootNode of sorted) {
            if (visited.has(rootNode)) continue;
            visited.add(rootNode);
            if (rootNode.type === 'driver') rootNode.phase0 = 0;

            const q = [rootNode];
            while (q.length > 0) {
                const curr = q.shift();
                const currRings = WG.gearRings(curr, this.GEAR_SPECS);

                for (const next of activeNodes) {
                    if (visited.has(next) || next === curr) continue;
                    const dist = Math.hypot(curr.x - next.x, curr.y - next.y);
                    let linked = false;

                    for (const a of currRings) {
                        for (const b of WG.gearRings(next, this.GEAR_SPECS)) {
                            if (linked || Math.abs(dist - (a.radius + b.radius)) > WG.GEAR_TOL) continue;
                            const alpha = Math.atan2(next.y - curr.y, next.x - curr.x);
                            const dt1 = (Math.PI * 2) / a.teeth;
                            const dt2 = (Math.PI * 2) / b.teeth;
                            next.phase0 = (alpha + Math.PI) - dt2 * (0.5 - (alpha - curr.phase0) / dt1);
                            linked = true;
                        }
                    }

                    if (linked) {
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
        this.jamKind = null;

        const activeNodes = this.nodes.filter(n => WG.gearRings(n, this.GEAR_SPECS).length > 0);
        this.synchronizeToothPhases(activeNodes);

        const result = WG.computeGearKinematics(this.nodes, this.belts, this.GEAR_SPECS);
        this.isJammed = result.isJammed;
        this.jamKind = result.jamKind;

        const targets = this.nodes.filter(n => n.type === 'target');
        this.isSolved = !this.isJammed && targets.every(t => this.isTargetSatisfied(t));

        if (this.isSolved && !this.solvedLevels.has(this.currentLevelIdx)) {
            this.solvedLevels.add(this.currentLevelIdx);
            this.renderLevelSelector();
        }

        if (this.statusBadge) {
            if (this.isJammed) {
                const jamText = {
                    stuck: '⚠ Задета ржавая шестерня!',
                    ratchet: '⛔ Храповик стопорит!',
                    conflict: '⚠ Клин привода!'
                };
                this.statusBadge.textContent = jamText[this.jamKind] || jamText.conflict;
                this.statusBadge.style.borderColor = '#ef4444';
                this.statusBadge.style.background = 'rgba(239, 68, 68, 0.22)';
            } else if (this.isSolved) {
                this.statusBadge.textContent = `✓ Ур. ${this.currentLevelIdx + 1} решён!`;
                this.statusBadge.style.borderColor = '#4ade80';
                this.statusBadge.style.background = 'rgba(74, 222, 128, 0.22)';
                if (window.WG && WG.Engine) WG.Engine.boostGears(0.9, 1600);
            } else {
                const wrongDir = targets.some(t => t.speed !== 0 && Math.sign(t.speed) !== t.targetDir);
                const speedIssue = targets.find(t => t.speed !== 0 && Math.sign(t.speed) === t.targetDir && WG.targetSpeedState(t) !== 'ok');

                if (wrongDir) {
                    this.statusBadge.textContent = '↺ Не та сторона!';
                } else if (speedIssue) {
                    const need = this.speedLabel(speedIssue);
                    this.statusBadge.textContent = WG.targetSpeedState(speedIssue) === 'slow'
                        ? `⚡ Медленно (нужно ${need})!`
                        : `🔥 Слишком быстро (нужно ${need})!`;
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

            // A click on a free slot of a rail moves that axle there
            for (const node of this.nodes) {
                if (!node.rail) continue;
                for (let s = 0; s < node.rail.length; s++) {
                    if (s === node.slot) continue;
                    if (Math.hypot(physX - node.rail[s].x, physY - node.rail[s].y) <= 11) {
                        this.moveRailPin(node, s);
                        return;
                    }
                }
            }

            for (const node of this.nodes) {
                if (node.type !== 'pin' && node.type !== 'dual') continue;
                const rings = WG.gearRings(node, this.GEAR_SPECS);
                const hitR = rings.length ? Math.max(...rings.map(r => r.radius)) : 24;
                if (Math.hypot(physX - node.x, physY - node.y) > hitR) continue;

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
                    this.flashError(node, this.GEAR_SPECS[this.selectedSize].radius, 20);
                    return;
                }

                // A dual axle only takes a gear larger than its built-in ring
                let blocked = node.type === 'dual' &&
                    this.GEAR_SPECS[this.selectedSize].radius <= this.GEAR_SPECS[node.base].radius;
                const candidate = { ...node, size: this.selectedSize };
                for (const other of this.nodes) {
                    if (blocked) break;
                    if (other === node) continue;
                    if (!WG.gearsCompatible(candidate, other, this.GEAR_SPECS)) blocked = true;
                }

                if (blocked) {
                    this.flashError(node, this.GEAR_SPECS[this.selectedSize].radius, 25);
                } else {
                    node.size = this.selectedSize;
                    this.updateInventoryUI();
                    this.recalculateKinematics();
                }
                return;
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

    moveRailPin(node, slot) {
        const spot = node.rail[slot];
        if (node.size) {
            const candidate = { ...node, x: spot.x, y: spot.y };
            for (const other of this.nodes) {
                if (other === node) continue;
                if (!WG.gearsCompatible(candidate, other, this.GEAR_SPECS)) {
                    this.flashError(spot, this.GEAR_SPECS[node.size].radius, 25);
                    return;
                }
            }
        }
        node.slot = slot;
        node.x = spot.x;
        node.y = spot.y;
        this.recalculateKinematics();
    }

    flashError(spot, radius, frames) {
        this.errorFlashNode = spot;
        this.errorFlashR = radius;
        this.errorFlashTimer = frames;
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

    drawDirectionArrow(x, y, dir, color, label = '') {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 4;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';

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
        const tangent = tipAngle + (dir > 0 ? Math.PI / 2 : -Math.PI / 2);

        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(tangent);
        ctx.beginPath();
        ctx.moveTo(4.5, 0);
        ctx.lineTo(-4.5, -3.8);
        ctx.lineTo(-2.2, 0);
        ctx.lineTo(-4.5, 3.8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        if (label) {
            ctx.shadowBlur = 0;
            ctx.font = label.length > 3 ? 'bold 7px sans-serif' : 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#09090b';
            ctx.fillText(label, 0, 0.5);
        }

        ctx.restore();
    }

    gearPalette(node, ring = 'main') {
        if (node.jammed) return { fill: '#7f1d1d', stroke: '#ef4444', hub: '#fca5a5' };
        if (node.type === 'driver') return { fill: '#92400e', stroke: '#f59e0b', hub: '#fde68a' };
        if (node.type === 'fixed') return { fill: '#3f3f46', stroke: '#a1a1aa', hub: '#e4e4e7' };
        if (node.type === 'ratchet') return { fill: '#134e4a', stroke: '#2dd4bf', hub: '#99f6e4' };
        if (node.type === 'stuck') return { fill: '#431407', stroke: '#c2410c', hub: '#fdba74' };
        if (node.type === 'dual' && ring === 'base') return { fill: '#2e1065', stroke: '#a78bfa', hub: '#ddd6fe' };
        if (node.type === 'target') {
            if (this.isTargetSatisfied(node)) return { fill: '#14532d', stroke: '#4ade80', hub: '#bbf7d0' };
            if (node.speed !== 0) return { fill: '#7f1d1d', stroke: '#f87171', hub: '#fecaca' };
            return { fill: '#1e293b', stroke: '#38bdf8', hub: '#bae6fd' };
        }
        return { fill: '#78350f', stroke: '#b45309', hub: '#d97706' };
    }

    drawBelt(belt) {
        const ctx = this.ctx;
        const a = belt.a;
        const b = belt.b;
        if (!a || !b) return;
        const ringsA = WG.gearRings(a, this.GEAR_SPECS);
        const ringsB = WG.gearRings(b, this.GEAR_SPECS);
        const live = ringsA.length > 0 && ringsB.length > 0;
        const r1 = (ringsA.length ? ringsA[0].radius : 12) - 6;
        const r2 = (ringsB.length ? ringsB[0].radius : 12) - 6;
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        const k = belt.cross ? (r1 + r2) / dist : (r1 - r2) / dist;
        if (Math.abs(k) >= 1) return;

        const theta = Math.atan2(b.y - a.y, b.x - a.x);
        const phi = Math.acos(k);
        const far = belt.cross ? -1 : 1;
        ctx.save();
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = !live ? 'rgba(113, 113, 122, 0.5)' : (a.speed !== 0 ? '#a1a1aa' : '#71717a');
        if (!live) ctx.setLineDash([6, 6]);
        for (const side of [1, -1]) {
            const ang = theta + side * phi;
            ctx.beginPath();
            ctx.moveTo(a.x + r1 * Math.cos(ang), a.y + r1 * Math.sin(ang));
            ctx.lineTo(b.x + far * r2 * Math.cos(ang), b.y + far * r2 * Math.sin(ang));
            ctx.stroke();
        }
        ctx.restore();
    }

    drawRail(node) {
        const ctx = this.ctx;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.beginPath();
        node.rail.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 9;
        ctx.stroke();
        ctx.strokeStyle = '#52525b';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    drawRailSlots(node) {
        const ctx = this.ctx;
        node.rail.forEach((p, s) => {
            if (s === node.slot) return;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6.5, 0, Math.PI * 2);
            ctx.fillStyle = '#18181b';
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.6;
            ctx.fill();
            ctx.stroke();
        });
    }

    drawPawl(node) {
        const ctx = this.ctx;
        const r = this.GEAR_SPECS[node.size].radius;
        const d = node.allowDir;
        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.fillStyle = '#5eead4';
        ctx.beginPath();
        ctx.moveTo(7 * d, -r - 3);
        ctx.lineTo(-5 * d, -r - 9);
        ctx.lineTo(-5 * d, -r + 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawStuckMark(node) {
        const ctx = this.ctx;
        const s = this.GEAR_SPECS[node.size].radius * 0.42;
        ctx.save();
        ctx.strokeStyle = node.jammed ? '#fecaca' : '#fdba74';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(node.x - s, node.y - s);
        ctx.lineTo(node.x + s, node.y + s);
        ctx.moveTo(node.x + s, node.y - s);
        ctx.lineTo(node.x - s, node.y + s);
        ctx.stroke();
        ctx.restore();
    }

    drawDualMark(node) {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = '#2e1065';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(node.x - 4.5, node.y);
        ctx.lineTo(node.x + 4.5, node.y);
        ctx.moveTo(node.x, node.y - 4.5);
        ctx.lineTo(node.x, node.y + 4.5);
        ctx.stroke();
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
            if (node.rail) this.drawRail(node);
        });
        this.belts.forEach(belt => this.drawBelt(belt));

        this.nodes.forEach(node => {
            if (node.type !== 'pin' || node.size !== null) return;
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
        });

        if (this.errorFlashTimer > 0 && this.errorFlashNode) {
            this.errorFlashTimer--;
            ctx.beginPath();
            ctx.arc(this.errorFlashNode.x, this.errorFlashNode.y, this.errorFlashR || this.GEAR_SPECS[this.selectedSize].radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.78)';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }

        const angleOf = node => node.phase0 + node.speed * this.masterPhase;

        // the large ring a player put on a dual axle lies underneath
        this.nodes.forEach(node => {
            if (node.type !== 'dual' || !node.size) return;
            const spec = this.GEAR_SPECS[node.size];
            this.drawGearShape(node.x, node.y, spec.radius, spec.teeth, angleOf(node), this.gearPalette(node, 'added'));
        });

        this.nodes.forEach(node => {
            if (node.type === 'dual' || !node.size) return;
            const spec = this.GEAR_SPECS[node.size];
            this.drawGearShape(node.x, node.y, spec.radius, spec.teeth, angleOf(node), this.gearPalette(node));
        });

        // the built-in ring of a dual axle lies on top
        this.nodes.forEach(node => {
            if (node.type !== 'dual') return;
            const spec = this.GEAR_SPECS[node.base];
            this.drawGearShape(node.x, node.y, spec.radius, spec.teeth, angleOf(node), this.gearPalette(node, 'base'));
            if (!node.size) this.drawDualMark(node);
        });

        this.nodes.forEach(node => {
            if (node.type === 'driver') {
                this.drawDirectionArrow(node.x, node.y, node.dir, '#fde68a');
            } else if (node.type === 'target') {
                const ok = this.isTargetSatisfied(node);
                this.drawDirectionArrow(node.x, node.y, node.targetDir, ok ? '#4ade80' : '#fbbf24', this.speedLabel(node));
            } else if (node.type === 'ratchet') {
                this.drawDirectionArrow(node.x, node.y, node.allowDir, '#5eead4');
                this.drawPawl(node);
            } else if (node.type === 'stuck') {
                this.drawStuckMark(node);
            }
        });

        this.nodes.forEach(node => {
            if (node.rail) this.drawRailSlots(node);
        });

        ctx.restore();
    }

};

document.addEventListener('DOMContentLoaded', () => {
    new WG.GearPuzzleWidget('gearPuzzleCanvas');
});
