const projects = [
	{
		'name': 'Auto-Hexgrid',
		'imgUrl': './assets/hexgrid.png',
		'link': 'https://github.com/heij/auto-hexgrid'
	}
]

const initAnimations = {
	'home': homeInit,
	'about': aboutInit,
	'projects': projectsInit,
	'contact': contactInit
}

window.addEventListener('load', () => {
	setIntersectionObserver();
	buildHexgrid(100, 5, 50);
	document.querySelector('#profile-card-wrapper')
	.addEventListener('click', (e) => {
		e.stopPropagation();
		document.querySelector('#profile-card').classList.toggle('rotated');
	});
	document.querySelector('#about')
	.addEventListener('click', (e) => {
		document.querySelector('#profile-card').classList.remove('rotated');
	})
});

function setIntersectionObserver() {
	let observer = new IntersectionObserver(playSectionAnim, { threshold: .5 });
	observer.observe(document.querySelector('#home'));
	observer.observe(document.querySelector('#about'));
	observer.observe(document.querySelector('#projects'));
	observer.observe(document.querySelector('#contact'));
}

function playSectionAnim(entries, observer) {
	let visible = entries.find(e => e.isIntersecting && !Array.from(e.target.classList).includes('active'));
	if (!visible) return;

	let id = visible.target.id;
	initAnimations[id]();
	document.querySelector(`#${id}`).classList.add('active');
}

function clearTexts(elems) {
	return elems.map(t => {
		let text = t.textContent;
		t.textContent = '\xa0';
		return text;
	});
}

async function homeInit() {
	let textList = Array.from(document.querySelectorAll('#home h1'));
	let textElems = textList.map(x => Array.from(x.childNodes));
	let textContent = textElems.map(p => clearTexts(p));

	for (let [i, p] of textElems.entries()) {
		await utils.asyncTimeout(400);
		textList[i].classList.add('writing');
		textList[i].classList.remove('no-text');

		let texts = textContent[i];
		await utils.asyncForEach(
			p,
			async (elem, i) => {
				let text = texts[i];
				let duration = text.length * 50;
				
				let progress = {value: 0};
				await anime({
				  targets: progress,
				  value: 100,
				  duration: duration,
				  delay: 0,
				  endDelay: 0,
				  easing: 'linear',
				  update: (anim) => {
				  	let sliceIndex = Math.max(1, progress.value * parseInt(texts[i].length) / 100);
				  	elem.textContent = texts[i].slice(0, sliceIndex);
				  }
				}).finished;
			}
		);
		textList[i].classList.remove('writing');
	}
	await utils.asyncTimeout(200);
	document.querySelector('.arrow-container').classList.remove('hidden');
}

function aboutInit() {
	let profileCard = document.querySelector('#profile-card');

	let cardName = document.querySelector('#profile-name');
	let cardOccupation = document.querySelector('#profile-occupation');
	let cardImage = document.querySelector('#profile-image');
	let cardTags = document.querySelector('#card-tags');

	anime.timeline()
		.add({
			targets: '#profile-card-wrapper',
			width: [0, '100%'],
			height: [0, '100%'],
			duration: 700,
			easing: 'easeInOutExpo'
		})
		.add({
			targets: cardName,
			opacity: 1,
			duration: 600,
			easing: 'easeOutQuart'
		}, 600)
		.add({
			targets: cardOccupation,
			opacity: 1,
			translateY: [-25, 0],
			duration: 800,
			easing: 'easeOutQuint',
			complete: () => profileCard.classList.add('active')
		}, 900)
		.add({
			targets: cardImage,
			opacity: 1,
			duration: 1200,
			translateY: [-25, 0],
			easing: 'easeOutQuart'
		}, 1250)
		.add({
			targets: cardTags,
			opacity: 1,
			duration: 500,
			translateY: [-25, 0],
			easing: 'easeOutQuart'
		}, 1250);
}

function projectsInit() {	
	document.querySelectorAll('#svg-hexgrid > g')
		.forEach(hex => {
			anime({
				targets: hex,
				duration: 700,
				opacity: [0, 1],
				delay: (parseInt(hex.id.split('_')[1]) + 1) * 40,
				easing: 'easeInOutExpo'
			});
		});
}

function contactInit() {
	document.querySelectorAll('#contact-wrapper > *')
		.forEach((input, i) => {
			anime({
				targets: input,
				opacity: [0, 1],
				translateY: [-25, 0],
				duration: 800,
				easing: 'easeOutQuint',
				delay: 100 * i
			});
		});

	document.querySelectorAll('#contact-header span')
		.forEach((input, i) => {
			anime({
				targets: input,
				opacity: [0, 1],
				translateY: [-25, 0],
				duration: 800,
				easing: 'easeOutQuint',
				delay: 25 * i
			});
		});

	anime({
		targets: '#contact > p',
		opacity: [0, 1],
		translateY: [-25, 0],
		duration: 800,
		easing: 'easeOutQuint',
		delay: 1500
	});
}

// hexWidth = Hexagon width (large diagonal)
// hexMargin = margin between two given hexagons
// hexPadding = padding inside each hexagon
function buildHexgrid(hexWidth, hexMargin, hexPadding) {
	let container = document.querySelector('#svg-wrapper');
	let svg = document.querySelector('#svg-hexgrid');
	let svgDefs = document.querySelector('#svg-hexgrid > defs');

	// Automatically generated measures, based on the given width;
	let {lDiag: hexLDiag, sDiag: hexSDiag, height: hexHeight} = getHexMeasures(hexWidth);
	let hexesInCol = Math.floor((container.offsetHeight - hexHeight - hexPadding) / (hexHeight/2 + hexMargin)) + 1;
	let colCount = Math.ceil(projects.length / hexesInCol);

	// Distribute the remaining space evenly to the start and end of the grid
	let remainingWidth = 0;
	let remainingHeight = (container.offsetHeight - hexPadding) % ((hexHeight/2 + hexMargin/2) * (hexesInCol));
	if (Object.keys(projects).length < hexesInCol * colCount) {
		colCount = Math.floor((container.offsetWidth - hexPadding - (hexLDiag - hexSDiag)/2) / ((hexSDiag + hexLDiag + (hexMargin * 2))));
		remainingWidth = (container.offsetWidth - hexPadding) - ((hexLDiag- hexSDiag)/2 +((hexSDiag + hexLDiag + (hexMargin * 2)) * colCount));
	}
	
	let containerXMargin = hexPadding/2 + hexLDiag/2 + remainingWidth/2;
	let containerYMargin = hexHeight/2 + remainingHeight/2;

	projects.forEach((p, i) => svgDefs.appendChild(buildHexPattern(i, p.imgUrl)));
	Array(colCount).fill().map((r, i) => {
		let x = containerXMargin + (hexLDiag + hexSDiag + (hexMargin * 2)) * i;
		return buildHexCol(x, containerYMargin, hexLDiag, hexHeight, hexMargin, hexesInCol, i);
	}).flat().forEach(h => svg.appendChild(h));

	// Set svg width and height so that it can scroll based on content size
	let {width, height} = svg.getBBox();
	if (width + containerXMargin/2 > container.offsetWidth)
		svg.setAttribute('width', width + containerXMargin/2)
	else
		svg.setAttribute('width', container.offsetWidth)
	svg.setAttribute('height', height);
}

function buildHexCol(x0, y0, lDiag, hexHeight, hexMargin, n, rowIndex) {
	return Array(n).fill().map((h, i) => {
		let x = i % 2 ? x0 + 3*lDiag/4 + hexMargin : x0;
		let y = y0 + (3*lDiag/7 * i) + (hexMargin * i);
		let hexIndex = rowIndex * n + i;
		return buildHexGroup(x, y, lDiag, hexHeight, hexIndex);
	});
}

function buildHexGroup(x, y, lDiag, hexHeight, hexIndex) {
	let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	g.setAttribute('id', `g_${hexIndex}`);
	g.setAttribute('data-x', x);
	g.setAttribute('data-y', y);
	projects[hexIndex] ? g.setAttribute('class', 'online') : g.setAttribute('class', 'offline');
	g.appendChild(buildHexSVG(x, y, lDiag, hexHeight, hexIndex));
	g.appendChild(buildHexBorders(x, y, lDiag, hexHeight));
	g.appendChild(buildHexTitle(x, y, hexIndex));
	g.addEventListener('click', () => {
		g.classList.contains('online') && window.open(projects[hexIndex].link, '_blank');
	});

	return g;
}

function buildHexSVG(x, y, lDiag, hexHeight, hexIndex) {
	let hex = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	hex.setAttribute('class', `hex`);
	hex.setAttribute('d', buildHexPath([x, y], lDiag, hexHeight));
	hex.setAttribute('data-x', x);
	hex.setAttribute('data-y', y);
	projects[hexIndex] && hex.setAttribute('data-name', projects[hexIndex].name);
	hex.setAttribute('fill', `url(#pattern_${hexIndex})`);
	return hex;
}

function buildHexPath(center, lDiag, hexHeight) {
	if (!lDiag) hexHeight = getHexMeasures(lDiag).height;
	return `M
	${center[0] - lDiag/2} ${center[1]},
	${center[0] - lDiag/4} ${center[1] - hexHeight/2},
	${center[0] + lDiag/4} ${center[1] - hexHeight/2},
	${center[0] + lDiag/2} ${center[1]},
	${center[0] + lDiag/4} ${center[1] + hexHeight/2},
	${center[0] - lDiag/4} ${center[1] + hexHeight/2}
	Z`;
}

function buildHexBorders(x, y, lDiag, hexHeight) {
	let hex = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	hex.setAttribute('class', `hex-border`);
	hex.setAttribute('d', buildHexPath([x, y], lDiag, hexHeight));
	hex.setAttribute('data-x', x);
	hex.setAttribute('data-y', y);
	hex.style.strokeDasharray = hex.getTotalLength() / 12;
	hex.style.strokeDashoffset = hex.style.strokeDasharray / 2;
	return hex;
}

function buildHexTitle(x, y, hexIndex) {
	let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
	text.setAttribute('x', x);
	text.setAttribute('y', y);
	projects[hexIndex] && (text.textContent = projects[hexIndex].name);
	return text;
}

function buildHexPattern(hexId, imgUrl) {
	let pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
	pattern.setAttribute('id', `pattern_${hexId}`);
	pattern.setAttribute('height', `100%`);
	pattern.setAttribute('width', `100%`);
	pattern.setAttribute('patternContentUnits', 'objectBoundingBox');

	let image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
	image.setAttribute('height', `1`);
	image.setAttribute('width', `1`);
	image.setAttribute('opacity', `1`);
	image.setAttribute('preserveAspectRatio', `none`);
	image.setAttribute('href', `${imgUrl}`);
	pattern.appendChild(image);

	return pattern;
}

function getHexMeasures(lDiag) {
	return {
		lDiag,
		sDiag: lDiag/2,
		height: Math.sqrt(Math.pow(lDiag/2, 2) - Math.pow(lDiag/4, 2)) * 2,
	}
}

function sendMail() {
	let subject = document.querySelector('#subject-field').value;
	let message = document.querySelector('#message-field').value;

	return window.open(encodeURI(`mailto:ricardoheiji@hotmail.com?subject=${subject}&body=${message}&name=${name}`));
}