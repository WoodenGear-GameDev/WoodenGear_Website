// =========================================================================
// МОДУЛЬ ЧИТАЛКИ ПОЭЗИИ С МАХОВИКОМ (js/poetry.js)
// =========================================================================
window.WG = window.WG || {};

WG.PoetryReader = class PoetryReader {
    constructor() {
        this.flywheelGear = document.getElementById('flywheelGear');
        this.flywheelNumbers = document.getElementById('flywheelNumbers');
        this.tocList = document.getElementById('tocList');
        if (!this.flywheelGear || !this.flywheelNumbers || !this.tocList) return;

        const buildPageList = (prefix, startIdx, endIdx) => {
            const list = [];
            for (let i = startIdx; i <= endIdx; i++) {
                list.push(`assets/img/poems/${prefix}_${String(i).padStart(3, '0')}.webp`);
            }
            return list;
        };

        this.POETRY_DATA = {
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
                    pages: ['assets/img/poems/poem_page_001.webp']
                },
                {
                    id: 'writer',
                    title: 'Писатель',
                    pages: ['assets/img/poems/poem_page_002.webp']
                },
                {
                    id: 'cat',
                    title: 'Котёнок',
                    pages: ['assets/img/poems/poem_page_003.webp']
                }
            ]
        };

        this.TOOTH_OFFSETS = [
            0.0, 18.05, 35.1, 52.0, 69.7, 90.25, 109.7,
            128.05, 145.0, 161.95, 180.0, 197.65, 214.4, 230.6,
            250.45, 269.95, 289.55, 309.4, 325.6, 342.35
        ];
        this.TEETH_COUNT = this.TOOTH_OFFSETS.length;
        this.NUMBER_RADIUS = 698;

        this.bookShelf = document.getElementById('bookShelf');
        this.bookSelectorWrap = document.getElementById('bookSelectorWrap');
        this.prevBookBtn = document.getElementById('prevBookBtn');
        this.nextBookBtn = document.getElementById('nextBookBtn');
        this.tocTitle = document.getElementById('tocTitle');
        this.tocModeGear = document.getElementById('tocModeGear');
        this.poemSheet = document.getElementById('poemSheet');
        this.poemPageImg = document.getElementById('poemPageImg');
        this.placeholderBadge = document.getElementById('placeholderBadge');
        this.placeholderTitle = document.getElementById('placeholderTitle');
        this.placeholderPath = document.getElementById('placeholderPath');
        this.placeholderPage = document.getElementById('placeholderPage');
        this.pageIndicator = document.getElementById('pageIndicator');
        this.prevPageBtn = document.getElementById('prevPageBtn');
        this.nextPageBtn = document.getElementById('nextPageBtn');
        this.flywheelArea = document.getElementById('flywheelArea');

        this.currentMode = 'collections';
        this.currentBookIndex = 0;
        this.currentSingleIndex = 0;
        this.currentPage = 1;

        this.wheelCurrentDeg = 0;
        this.wheelTargetDeg = 0;

        this.pageLoadRequestId = 0;
        this.activeLoadingImg = null;
        this.currentLoadedPath = '';

        this.toothButtons = [];
        this.createToothButtons();
        this.bindEvents();
        this.goToPage(1, true);
        this.animateFlywheel();
    }

    isMobile() {
        return window.WG && WG.Engine ? WG.Engine.isMobile() : window.innerWidth <= 820;
    }

    getToothAngle(pageIndexZeroBased) {
        const fullTurns = Math.floor(pageIndexZeroBased / this.TEETH_COUNT);
        const rem = ((pageIndexZeroBased % this.TEETH_COUNT) + this.TEETH_COUNT) % this.TEETH_COUNT;
        if (this.isMobile() && rem !== 0) {
            return fullTurns * 360 + (360 - this.TOOTH_OFFSETS[this.TEETH_COUNT - rem]);
        }
        return fullTurns * 360 + this.TOOTH_OFFSETS[rem];
    }

    getActivePages() {
        if (this.currentMode === 'collections') {
            const book = this.POETRY_DATA.collections[this.currentBookIndex];
            return book.cover ? [book.cover, ...book.pages] : book.pages;
        }
        return this.POETRY_DATA.singles[this.currentSingleIndex].pages;
    }

    hasCover() {
        return this.currentMode === 'collections' && !!this.POETRY_DATA.collections[this.currentBookIndex].cover;
    }

    formatPageLabel(pageIndex) {
        if (this.hasCover() && pageIndex === 0) return 'Обл';
        return this.hasCover() ? pageIndex : pageIndex + 1;
    }

    getCurrentChapterTitle(page) {
        if (this.currentMode === 'singles') {
            return this.POETRY_DATA.singles[this.currentSingleIndex].title;
        }
        const book = this.POETRY_DATA.collections[this.currentBookIndex];
        const chapters = book.chapters;
        const coverOffset = book.cover ? 1 : 0;
        const effectivePage = page - coverOffset;

        let activeChap = chapters[0].title;
        for (const ch of chapters) {
            if (effectivePage >= ch.startPage) activeChap = ch.title;
        }
        return activeChap;
    }

    selectBook(index) {
        const totalBooks = this.POETRY_DATA.collections.length;
        this.currentBookIndex = ((index % totalBooks) + totalBooks) % totalBooks;
        if (this.tocModeGear) {
            this.tocModeGear.style.transform = `rotate(${this.currentBookIndex * 90}deg)`;
        }
        this.goToPage(1, true);
    }

    renderTOC() {
        this.tocList.innerHTML = '';

        if (this.currentMode === 'collections') {
            if (this.bookShelf) this.bookShelf.style.display = 'block';
            this.bookSelectorWrap.innerHTML = '';

            this.POETRY_DATA.collections.forEach((book, idx) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `reader-book-btn ${idx === this.currentBookIndex ? 'active' : ''}`;
                btn.innerHTML = `
                    <span>${book.title}</span>
                    <span class="reader-book-btn__meta">${book.chapters.length} гл.</span>
                `;
                btn.addEventListener('click', () => this.selectBook(idx));
                this.bookSelectorWrap.appendChild(btn);
            });

            const book = this.POETRY_DATA.collections[this.currentBookIndex];
            this.tocTitle.textContent = book.title;

            if (book.cover) {
                const isCoverActive = (this.currentPage === 1);
                const li = document.createElement('li');
                li.className = `reader-toc__item ${isCoverActive ? 'active' : ''}`;
                li.innerHTML = `
                    <span>📖 Обложка сборника</span>
                    <span class="reader-toc__dots"></span>
                    <span class="reader-toc__page">Обл</span>
                `;
                li.addEventListener('click', () => this.goToPage(1, true));
                this.tocList.appendChild(li);
            }

            book.chapters.forEach((ch, idx) => {
                const coverOffset = book.cover ? 1 : 0;
                const realStartPage = ch.startPage + coverOffset;
                const nextCh = book.chapters[idx + 1];
                const realNextStart = nextCh ? nextCh.startPage + coverOffset : Infinity;
                const isCurrent = this.currentPage >= realStartPage && this.currentPage < realNextStart;

                const li = document.createElement('li');
                li.className = `reader-toc__item ${isCurrent ? 'active' : ''}`;
                li.innerHTML = `
                    <span>${ch.title}</span>
                    <span class="reader-toc__dots"></span>
                    <span class="reader-toc__page">стр. ${ch.startPage}</span>
                `;
                li.addEventListener('click', () => this.goToPage(realStartPage, true));
                this.tocList.appendChild(li);
            });
        } else {
            if (this.bookShelf) this.bookShelf.style.display = 'none';
            this.tocTitle.textContent = 'Отдельные произведения';

            this.POETRY_DATA.singles.forEach((poem, idx) => {
                const isCurrent = idx === this.currentSingleIndex;
                const li = document.createElement('li');
                li.className = `reader-toc__item ${isCurrent ? 'active' : ''}`;
                li.innerHTML = `
                    <span>${poem.title}</span>
                    <span class="reader-toc__dots"></span>
                    <span class="reader-toc__page">${poem.pages.length} л.</span>
                `;
                li.addEventListener('click', () => {
                    this.currentSingleIndex = idx;
                    this.goToPage(1, true);
                });
                this.tocList.appendChild(li);
            });
        }
    }

    goToPage(pageNumber, forceReload = false) {
        const pages = this.getActivePages();
        const clamped = Math.max(1, Math.min(pages.length, pageNumber));
        const imgPath = pages[clamped - 1];

        if (!forceReload && clamped === this.currentPage && imgPath === this.currentLoadedPath) {
            return;
        }

        const changed = clamped !== this.currentPage || imgPath !== this.currentLoadedPath;
        this.currentPage = clamped;
        this.currentLoadedPath = imgPath;

        const currentRequestId = ++this.pageLoadRequestId;
        this.wheelTargetDeg = this.getToothAngle(this.currentPage - 1);

        if (changed && this.poemSheet) {
            this.poemSheet.classList.add('sheet-turning');
            setTimeout(() => this.poemSheet.classList.remove('sheet-turning'), 220);
        }

        if (this.activeLoadingImg) {
            this.activeLoadingImg.onload = null;
            this.activeLoadingImg.onerror = null;
            this.activeLoadingImg = null;
        }

        this.poemPageImg.style.transition = 'none';
        this.poemPageImg.style.opacity = '0';

        const tempImg = new Image();
        this.activeLoadingImg = tempImg;

        tempImg.onload = () => {
            if (currentRequestId === this.pageLoadRequestId) {
                this.poemPageImg.src = imgPath;
                this.poemPageImg.style.display = 'block';
                this.poemPageImg.style.transition = 'opacity 0.25s ease';
                this.poemPageImg.style.opacity = '1';
                this.activeLoadingImg = null;
            }
        };

        tempImg.onerror = () => {
            if (currentRequestId === this.pageLoadRequestId) {
                this.poemPageImg.style.display = 'none';
                this.placeholderPath.textContent = `Файл листа: ${imgPath}`;
                this.activeLoadingImg = null;
            }
        };

        tempImg.src = imgPath;

        const pageIndex0 = this.currentPage - 1;
        const labelStr = this.formatPageLabel(pageIndex0);

        this.placeholderBadge.textContent = this.currentMode === 'collections'
            ? this.POETRY_DATA.collections[this.currentBookIndex].title
            : 'Отдельное стихотворение';

        if (this.hasCover() && pageIndex0 === 0) {
            this.placeholderTitle.textContent = 'Обложка сборника';
            this.placeholderPath.textContent = 'Загрузка обложки...';
            this.placeholderPage.textContent = 'Обложка';
            this.pageIndicator.textContent = `Обложка (${pages.length - 1} стр.)`;
        } else {
            this.placeholderTitle.textContent = this.getCurrentChapterTitle(this.currentPage);
            this.placeholderPath.textContent = 'Загрузка страницы...';
            this.placeholderPage.textContent = `Страница ${labelStr}`;
            this.pageIndicator.textContent = `Стр. ${labelStr} из ${this.hasCover() ? pages.length - 1 : pages.length}`;
        }

        if (this.prevPageBtn) this.prevPageBtn.disabled = (this.currentPage <= 1);
        if (this.nextPageBtn) this.nextPageBtn.disabled = (this.currentPage >= pages.length);

        this.renderTOC();
    }

    attachPageScrollAndSwipe(targetEl) {
        if (!targetEl) return;

        targetEl.addEventListener('wheel', e => {
            e.preventDefault();
            if (e.deltaY > 0) this.goToPage(this.currentPage + 1);
            else if (e.deltaY < 0) this.goToPage(this.currentPage - 1);
        }, { passive: false });

        let dragStartX = null;
        let dragStartY = null;

        targetEl.addEventListener('pointerdown', e => {
            if (e.target.closest('.flywheel-tooth-num')) return;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
        });

        targetEl.addEventListener('pointerup', e => {
            if (dragStartX === null) return;
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;
            dragStartX = null;
            dragStartY = null;

            if (this.isMobile() && Math.abs(dx) > 28) {
                if (dx < 0) this.goToPage(this.currentPage + 1);
                else this.goToPage(this.currentPage - 1);
            } else if (!this.isMobile() && (Math.abs(dy) > 28 || Math.abs(dx) > 28)) {
                const delta = Math.abs(dy) >= Math.abs(dx) ? dy : dx;
                if (delta < 0) this.goToPage(this.currentPage + 1);
                else this.goToPage(this.currentPage - 1);
            }
        });
    }

    createToothButtons() {
        const totalPagesMax = 80;
        for (let p = 1; p <= totalPagesMax; p++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'flywheel-tooth-num';
            btn.addEventListener('click', () => this.goToPage(p));
            this.flywheelNumbers.appendChild(btn);
            this.toothButtons.push({ page: p, el: btn });
        }
    }

    bindEvents() {
        if (this.prevBookBtn) this.prevBookBtn.addEventListener('click', () => this.selectBook(this.currentBookIndex - 1));
        if (this.nextBookBtn) this.nextBookBtn.addEventListener('click', () => this.selectBook(this.currentBookIndex + 1));

        document.querySelectorAll('[data-poetry-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-poetry-mode]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentMode = btn.dataset.poetryMode;
                if (this.tocModeGear) {
                    this.tocModeGear.style.transform = `rotate(${this.currentMode === 'singles' ? 180 : 0}deg)`;
                }
                this.goToPage(1, true);
            });
        });

        if (this.prevPageBtn) this.prevPageBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        if (this.nextPageBtn) this.nextPageBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));

        this.attachPageScrollAndSwipe(this.flywheelArea);
        this.attachPageScrollAndSwipe(this.poemSheet);
    }

    animateFlywheel() {
        this.wheelTargetDeg = this.getToothAngle(this.currentPage - 1);
        this.wheelCurrentDeg += (this.wheelTargetDeg - this.wheelCurrentDeg) * 0.08;
        const mobileMode = this.isMobile();

        const gearVisualDeg = mobileMode ? (90 - this.wheelCurrentDeg) : this.wheelCurrentDeg;
        this.flywheelGear.style.transform = `rotate(${gearVisualDeg}deg)`;

        const totalPages = this.getActivePages().length;
        const currentWheelWidth = this.flywheelGear.offsetWidth || 1700;
        const activeRadius = (currentWheelWidth / 1700) * this.NUMBER_RADIUS;
        const baseAngleDeg = mobileMode ? 270.05 : 180.05;

        this.toothButtons.forEach(({ page, el }, idx) => {
            if (page > totalPages) {
                el.style.display = 'none';
                return;
            }

            el.textContent = this.formatPageLabel(idx);

            const toothDeg = this.getToothAngle(page - 1);
            const relDeg = toothDeg - this.wheelCurrentDeg;

            if (relDeg < -62 || relDeg > 62) {
                el.style.display = 'none';
                return;
            }

            el.style.display = 'flex';
            el.classList.toggle('active', page === this.currentPage);

            const angleDeg = mobileMode ? (baseAngleDeg + relDeg) : (baseAngleDeg - relDeg);
            const angleRad = angleDeg * (Math.PI / 180);
            const x = Math.cos(angleRad) * activeRadius;
            const y = Math.sin(angleRad) * activeRadius;

            el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        });

        requestAnimationFrame(() => this.animateFlywheel());
    }
};

document.addEventListener('DOMContentLoaded', () => {
    new WG.PoetryReader();
});
