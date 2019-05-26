const scrollUpEvent = new Event('scrollUp');
const scrollDownEvent = new Event('scrollDown');
let width, height, hexShortDiag, hexSide, hexLongDiag;
let app = new PIXI.Application(width, height, {
	backgroundColor: 0x000000,
	antialias: true,
	autoStart: true,
	autoResize: true,
	resolution: devicePixelRatio
});
const renderer = app.renderer;
renderer.view.style.position = 'absolute';
renderer.view.style.display = 'block';
document.body.appendChild(renderer.view);
const stage = new PIXI.Container();
stage.sortableChildren = true;
stage.sortDirty = true;

draw();
animate();

function drawHexRow(rowIndex, rowHeight) {
	if (rowIndex % 2) {
		return Array(6).fill(0).reduce(
			(res, hex, indexInRow) => {
				res[`hex_${rowIndex}_${indexInRow}`] = drawHexagon(
					hexShortDiag * indexInRow, 
					rowHeight, 
					rowIndex, 
					indexInRow, 
					Math.sqrt(Math.pow(width / 2 - hexShortDiag * indexInRow, 2) + Math.pow(height / 2 - rowHeight, 2))
				);
				return res;
			}, {}
		)
	} else {
		return Array(5).fill(0).reduce(
			(res, hex, indexInRow) => {
				res[`hex_${rowIndex}_${indexInRow}`] = drawHexagon(
					hexShortDiag * indexInRow + hexShortDiag / 2, 
					rowHeight, 
					rowIndex, 
					indexInRow, 
					Math.sqrt(Math.pow(width / 2 - (hexShortDiag * indexInRow + hexShortDiag / 2), 2) + Math.pow(height / 2 - rowHeight, 2))
				);
				return res;
			}, {}
		)
	}
}

function drawHexagon(w, h, rowIndex, indexInRow, dist) {
	const elem = new PIXI.Graphics();
	elem.lineStyle(5, 0xDDDDAA);
	elem.beginFill(0xe8701b);
	
	elem.moveTo(w, h + hexLongDiag / 2);
	elem.lineTo(w + hexShortDiag / 2, h + hexLongDiag / 4);
	elem.lineTo(w + hexShortDiag / 2, h - hexLongDiag / 4);
	elem.lineTo(w, h - hexLongDiag / 2);
	elem.lineTo(w - hexShortDiag / 2, h - hexLongDiag / 4);
	elem.lineTo(w - hexShortDiag / 2, h + hexLongDiag / 4);

	elem.endFill();

	const TTexture = elem.generateTexture();
	const TSprite = new PIXI.Sprite(TTexture);
	TSprite.interactive = true;
	TSprite.anchor.set(.5, .5);
	TSprite.x = w;
	TSprite.y = h;
	TSprite.alpha = 0;
	TSprite.centerDistance = dist;

	return TSprite;
}

function draw() {
	width = window.innerWidth;
	height = window.innerHeight;
	renderer.resize(width, height);
	hexShortDiag = width / 5;
	hexSide = hexShortDiag / Math.sqrt(3);
	hexLongDiag = hexSide * 2;

	while (stage.children[0]) stage.removeChild(stage.children[0]);
	let currentRow = 1;
	let hexgrid = {
		...drawHexRow(0, height / 2)
	}
	let full = false;

	while (!full) {
		const rowHeight = height / 2 - (hexLongDiag / 2 * currentRow) - (hexLongDiag / 4 * currentRow);
		const revRowHeight = height / 2 + (hexLongDiag / 2 * currentRow) + (hexLongDiag / 4 * currentRow);

		if (rowHeight + hexLongDiag / 2 < 0) {
			full = true;
		} else {
			hexgrid = { 
				...hexgrid, 
				...drawHexRow(currentRow, rowHeight),
				...drawHexRow(currentRow * -1, revRowHeight)
			}
			currentRow++;
		}
	} 
	
	const maxDist = Object.values(hexgrid).sort((a, b) => b.centerDistance - a.centerDistance)[0].centerDistance;
	const maxFadeTime = 1;

	Object.values(hexgrid).forEach(elem => { 
		const anim = TweenMax.to(elem, elem.centerDistance / maxDist * maxFadeTime, {alpha: 1, ease: Cubic.easeIn});
		stage.addChild(elem);
	});
}

window.addEventListener('keydown', (e) => {
	if (e.repeat) return;
});
window.addEventListener('scroll', (e) => {

});
window.addEventListener('scrollUp', () => {
	
});
window.addEventListener('scrollDown', () => {
	
});
window.addEventListener('resize', () => {
	draw();
});

function getElById(id) {
	return document.getElementById(id);
}

function getElByCls(clNm) {
	return Array.from(document.getElementsByClassName(clNm));
}

function getStyle(el) {
	return window.getComputedStyle(el)
}

function animate() {
	requestAnimationFrame(animate);
	renderer.render(stage);
}