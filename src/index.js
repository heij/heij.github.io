import { sectionBannerBp } from './bannerBp.js';

class Board {
    constructor(sqx, sqy, sqBg, sqBackBg, sqMargin = 0) {
        this.sqx = sqx;
        this.sqy = sqy;
        this.sqBg = sqBg;
        this.sqBackBg = sqBackBg;
        this.sqMargin = sqMargin;
        this.sqSize = 0;
        this.wrapper = document.querySelector('#board-wrapper');
        this.canvas = document.querySelector('#board');
        this.inset = document.querySelector('#board-inset');
        this.ctx = this.canvas.getContext('2d');
        this.animLoop = null;
        this._startAnim = this.startAnim.bind(this);
        this.canvasXMargin = 0;
        this.canvasYMargin = 0;

        this.sqRef = [];
        for (let y = 0; y < this.sqy; y++) {
            this.sqRef.push([]);
            for (let x = 0; x < this.sqx; x++) {
                this.sqRef[y][x] = {
                    flip: 0,
                    baseX: 0,
                    baseY: 0,
                    x: 0,
                    y: 0
                }
            }
        }
        this.activeSq = {};
        this.resize();
    }

    draw() {
        this.sqRef.forEach((row, y) => {
            row.forEach((sq, x) => {
                let active = this.activeSq[`${x}_${y}`];
                this.ctx.fillStyle = active
                    ? active.color || this.sqBackBg
                    : this.sqBg;

                this.ctx.beginPath();
                this.ctx.fillRect(sq.x, sq.y, this.sqSize, this.sqSize);
            });
        });
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    resize() {
        let { width, height } = this.wrapper.getBoundingClientRect();

        // Fit largest of row/col against smallest of width/height
        let measure = Math.min(width, height);
        let sqCnt = Math.max(this.sqx, this.sqy);
        // Add 1 extra margin unit to account for border squares (half unit for each)
        let totalMargin = this.sqMargin * (sqCnt + 1);
        this.sqSize = (measure - totalMargin) / sqCnt;

        // Center canvas by distributing the remaining space evenly
        this.canvasXMargin = (width - (this.sqMargin * (this.sqx + 1) + this.sqSize * this.sqx)) / 2;
        this.canvasYMargin = (height - (this.sqMargin * (this.sqy + 1) + this.sqSize * this.sqy)) / 2;

        this.canvas.width = Math.ceil(width - this.canvasXMargin * 2);
        this.canvas.height = Math.ceil(height - this.canvasYMargin * 2);

        this.sqRef.forEach((row, y) => {
            let baseY = this.sqMargin + (this.sqSize * y) + (this.sqMargin * y);
            row.forEach((sq, x) => {
                let cx = this.sqMargin + (this.sqSize * x) + (this.sqMargin * x);

                sq.x = sq.baseX = cx;
                sq.y = sq.baseY = baseY;
            });
        });
    }

    startAnim() {
        this.clear();
        this.draw();
        requestAnimationFrame(this._startAnim);
    }

    stopAnim() {
        cancelAnimationFrame(this.animLoop);
        this.animLoop = null;
    }

    playIntro(delay = 0) {
        let sqsToAnimate = Array(Math.floor((this.sqy * this.sqx) / 10))
            .fill(1).map(() => {
                let y = getRandomBetween(0, this.sqy - 1);
                let x = getRandomBetween(0, this.sqx - 1);

                let sq = this.sqRef[y][x];
                sq.y = window.innerHeight;
                return sq;
            });

        return Promise.all(
            sqsToAnimate.map((sq) => {
                return new Promise((resolve) => {
                    anime({
                        targets: sq,
                        x: sq.baseX > (window.innerWidth / 2) ? [0, sq.baseX] : [window.innerWidth, sq.baseX],
                        y: sq.baseY > (window.innerHeight / 2) ? [0, sq.baseY] : [window.innerHeight, sq.baseY],
                        duration: getRandomBetween(500, 1000),
                        delay: delay + getRandomBetween(100, 500),
                        easing: 'easeOutQuart',
                        complete: () => {
                            resolve();
                            sq.y = sq.baseY;
                        }
                    });
                })
            })
        );
    }
}

class BoardBg {
    constructor() {
        this.sqRef = [];
        this.canvas = document.querySelector('#board-bg');
        this.ctx = this.canvas.getContext('2d');
        this._startAnim = this.startAnim.bind(this);
        this.animLoop = null;

        this.resize();
        this.set();
    }

    set() {
        this.sqRef = [];
        let sx = (board.canvasXMargin + board.sqMargin) / (board.sqSize + board.sqMargin);
        let sy = (board.canvasYMargin + board.sqMargin) / (board.sqSize + board.sqMargin);
        let dx = (Math.ceil(sx) - sx) * (board.sqSize + board.sqMargin) * -1;
        let dy = (Math.ceil(sy) - sy) * (board.sqSize + board.sqMargin) * -1;

        let sqInX = 0;
        let sqInY = 0;
        let x = dx;
        let y = dy;

        while (y < window.innerHeight) {
            x = dx;
            sqInX = 0;
            this.sqRef.push([]);
            while (x < window.innerWidth) {
                x += board.sqMargin + board.sqSize;

                this.sqRef[sqInY][sqInX] = {
                    baseX: x,
                    baseY: y,
                    x: x,
                    y: y
                }
                sqInX++;
            }
            y += board.sqMargin + board.sqSize;
            sqInY++;
        }
    }

    resize() {
        let { width, height } = board.wrapper.getBoundingClientRect();
        this.canvas.width = width;
        this.canvas.height = height;

        this.set();
    }

    draw() {
        this.ctx.fillStyle = board.sqBg;
        this.sqRef.forEach(row => {
            row.forEach(sq => {
                this.ctx.beginPath();
                this.ctx.fillRect(sq.x, sq.y, board.sqSize, board.sqSize);
            });
        });
    }

    clear() {
        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }

    startAnim() {
        this.clear();
        this.draw();
        this.animLoop = requestAnimationFrame(this._startAnim);
    }

    stopAnim() {
        cancelAnimationFrame(this.animLoop);
        this.animLoop = null;
    }

    playIntro(delay = 0) {
        let sqsToAnimate = Array(Math.floor((this.sqRef.length * this.sqRef[0].length) / 20))
            .fill(1).map(() => {
                let y = getRandomBetween(0, this.sqRef.length - 1);
                let x = getRandomBetween(0, this.sqRef[0].length - 1);

                let sq = this.sqRef[y][x];
                sq.y = window.innerHeight;
                return sq;
            });

        return Promise.all(
            sqsToAnimate.map((sq) => {
                return new Promise((resolve) => {
                    anime({
                        targets: sq,
                        x: sq.baseX > (window.innerWidth / 2) ? [0, sq.baseX] : [window.innerWidth, sq.baseX],
                        y: sq.baseY > (window.innerHeight / 2) ? [0, sq.baseY] : [window.innerHeight, sq.baseY],
                        duration: getRandomBetween(500, 1000),
                        delay: delay + getRandomBetween(100, 500),
                        easing: 'easeOutQuart',
                        complete: () => resolve()
                    });
                })
            })
        );
    }
}

let board = new Board(55, 31, '#320444', '#bd943b', 2);
let boardBg = new BoardBg();

function setTriggerObserver() {
    let observer = new IntersectionObserver(onTriggerIntersect, {
        threshold: 0
    });
    let triggers = document.querySelectorAll('.scroll-trigger');
    triggers.forEach(t => observer.observe(t));
}

function setPageObserver() {
    let observer = new IntersectionObserver(onPageIntersect, {
        threshold: .5
    });
    let triggers = document.querySelectorAll('.page');
    triggers.forEach(t => observer.observe(t));
}

let body = document.querySelector('body');
let scrollPositionBar = document.querySelector('.scroll-marker');
let navbar = document.querySelector('.navbar');
let navTabWrapper = document.querySelector('.navbar .item-container')
let navbarTabs = document.querySelectorAll('.navbar .nav-item');

let detectionThreshold = .6;
let navbarFadeTimer = null;
let pages = document.querySelectorAll('.page');

let maxScroll = 0;
let currentScroll = 0;
let sectionTriggerHeights = [0, 0, 0, 0];
function setNavbarScroll() {
    scrollPositionBar.style.transform = `scaleY(${currentScroll / maxScroll})`;

    sectionTriggerHeights.forEach((s, i) => {
        let isActive = navbarTabs[i].classList.contains('active');
        let delta = Math.abs(currentScroll - s);

        (currentScroll < s || delta > window.innerHeight * detectionThreshold) && navbarTabs[i].classList.contains('active') && navbarTabs[i].classList.remove('active');
        (currentScroll >= s || delta < window.innerHeight * detectionThreshold) && !navbarTabs[i].classList.contains('active') && navbarTabs[i].classList.add('active');
    });

    navbar.classList.remove('hidden');
    clearTimeout(navbarFadeTimer);
    navbarFadeTimer = setTimeout(() => navbar.classList.add('hidden'), 1000);
}

function resizeNavbar() {
    let navHeight = navTabWrapper.getBoundingClientRect().height;
    navbarTabs.forEach((n, i) => {
        let p = pages[i];
        n.style.top = `${navHeight * (p.offsetTop / maxScroll) - (navbarTabs[0].scrollHeight / 2)}`;
        sectionTriggerHeights[i] = p.offsetTop;
    });
}

function setNavbar() {
    document.querySelectorAll('.nav-item a')
        .forEach(l => l.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            let scrollId = e.target.getAttribute('href');
            document.querySelector(scrollId).scrollIntoView({ behavior: 'smooth' });
        }));


    navbar.classList.add('ready');
}

let intersectedTrigger = null;

let _setNavbarScroll = throttle(setNavbarScroll, 200, { leading: false });
let _changeBannerState = throttle(changeBannerState, 50);

window.addEventListener('scroll', (e) => {
    currentScroll = body.scrollTop;

    _changeBannerState(intersectedTrigger);
    _setNavbarScroll();
});

window.addEventListener('load', async () => {
    maxScroll = body.scrollHeight - window.innerHeight;
    currentScroll = body.scrollTop;

    document.querySelector('#mail-send').addEventListener('click', sendMail);
    setNavbar();
    setTriggerObserver();
    setPageObserver();

    resizeNavbar();
    setNavbarScroll();

    board.startAnim();
    boardBg.startAnim();

    let introDelay = 1000;
    board.playIntro(introDelay);
    boardBg.playIntro(introDelay).then(() => boardBg.stopAnim());
});

window.addEventListener('resize', () => {
    maxScroll = body.scrollHeight - window.innerHeight;

    resizeNavbar();
    board.resize();
    boardBg.resize();
    boardBg.clear();
    boardBg.draw();
});

window.addEventListener('beforeunload', () => {
    window.scrollTo(0, 0);
});

function onTriggerIntersect(entries, observer) {
    let visible = entries.find(e => e.isIntersecting);
    if (!visible) return;
    // Manually trigger change on page reload;
    if (!intersectedTrigger) changeBannerState(visible);
    intersectedTrigger = visible;
}

let pageViewed = {
    home: false,
    projects: false,
    about: false,
    contact: false
}
function onPageIntersect(entries, observer) {
    let visible = entries.find(e => e.isIntersecting);
    if (!visible) return;
    // Manually trigger change on page reload;
    let sectionId = visible.target.id;
    if (pageViewed[sectionId]) return;
    pageViewed[sectionId] = true;

    [...visible.target.querySelectorAll('.text-glitch')].map((e, i) => {
        scrambleElemTransition(e, 1000, 1000 + (250 * i));
    });

    [...visible.target.querySelectorAll('.fade-in-down')].map((e, i) => {
        anime.timeline({
            targets: e,
            delay: 50 * i
        })
            .add({
                duration: 500,
                opacity: [0, 1],
                easing: 'easeInOutExpo'
            }, 0)
            .add({
                duration: 400,
                translateY: [-20, 0],
                easing: 'easeOutQuart'
            }, 200);
    });
}

function changeBannerState(intersectedTrigger) {
    if (!intersectedTrigger) return;

    let sectionId = intersectedTrigger.target.getAttribute('data-section');

    // Make sure the transition runs between the very first moment the 
    // canvas is fully visible and the very last moment before it is
    // partially hidden by the content;
    let rect = intersectedTrigger.target.getBoundingClientRect();
    let min = board.canvasYMargin + board.canvas.height;
    let max = rect.height + board.canvasYMargin;
    let scroll = ((rect.top - window.innerHeight) * -1) - min;
    let ratio = Math.min(Math.max(scroll / (max - min), 0), 1);

    let frameIndex = Math.floor(ratio * 19);
    let banner = sectionBannerBp[sectionId][frameIndex];
    board.activeSq = banner.reduce((o, [x, y, color]) => {
        o[`${x}_${y}`] = {
            color: color
        }
        return o;
    }, {});
}

function sendMail() {
    let target = 'ricardoheiji@hotmail.com';
    let subject = document.querySelector('#mail-subject').value;
    let message = document.querySelector('#mail-message').value;
    window.location.href = `mailto:${target}?subject=${subject}&body=${message}`;
}

let chars = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
];
function scrambleText(text, charsToKeep = 0) {
    let fixed = text.slice(0, charsToKeep);
    let toChange = text.slice(charsToKeep);

    return fixed + [...toChange].map(c => c != ' ' ? chars[getRandomBetween(0, chars.length - 1)] : ' ').join('');
}

function scrambleElemTransition(element, duration, delay = 0, easing = 'easeInOutQuint') {
    let control = { value: 0 };
    let originalText = element.textContent.slice();

    return anime({
        targets: control,
        value: 1,
        duration: duration,
        easing: easing,
        delay: delay,
        update: () => {
            let charsToKeep = Math.floor(originalText.length * control.value);
            element.textContent = scrambleText(originalText, charsToKeep);
        }
    })
}

function throttle(func, wait, options) {
    let context, args, result;
    let timeout = null;
    let previous = 0;
    if (!options) options = {};
    let later = function () {
        previous = options.leading === false ? 0 : Date.now();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
    };
    return function () {
        let now = Date.now();
        if (!previous && options.leading === false) previous = now;
        let remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        } else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };
};

function getRandomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
