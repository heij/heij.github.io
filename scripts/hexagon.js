const scrollUpEvent = new Event('scrollUp');
const scrollDownEvent = new Event('scrollDown');
let	app, renderer, stage,
 	width, height, 
	hexTexture, hexShortDiag, hexSide, hexLongDiag,
	hexInRow, rowCount, centralHex, mainText;

WebFont.load({
	google: {
	  families: ['Orbitron']
	},
	active: setup
});

function setup() {
	app = new PIXI.Application(width, height, {
		backgroundColor: 0x000000,
		antialias: true,
		autoStart: true,
		autoResize: true,
		resolution: devicePixelRatio
	});
	renderer = app.renderer;
	renderer.view.style.position = 'absolute';
	renderer.view.style.display = 'block';
	document.body.appendChild(renderer.view);
	stage = new PIXI.Container();
	stage.sortableChildren = true;
	stage.sortDirty = true;

	draw();
	animate();
}

function drawHexRow(rowIndex, rowHeight, hexCount) {
	let full = false;

	if (rowIndex % 2) {
		return Array(hexCount + 1).fill(0).reduce(
			(res, hex, indexInRow) => {
				res[`hex_${rowIndex}_${indexInRow}`] = drawHexagon(
					width / 2 - ((Math.floor(hexCount / 2) - indexInRow) * hexShortDiag) - hexShortDiag / 2,
					rowHeight,
					Math.sqrt(
						Math.pow(width / 2 - (width / 2 - ((Math.floor(hexCount / 2) - indexInRow) * hexShortDiag) - hexShortDiag / 2), 2) + 
						Math.pow(height / 2 - rowHeight, 2)
					)
				);
				return res;
			}, {}
		)
	} else {
		return Array(hexCount).fill(0).reduce(
			(res, hex, indexInRow) => {
				res[`hex_${rowIndex}_${indexInRow}`] = drawHexagon(
					width / 2 - ((Math.floor(hexCount / 2) - indexInRow) * hexShortDiag),
					rowHeight,
					Math.sqrt(
						Math.pow(width / 2 - (width / 2 - ((Math.floor(hexCount / 2) - indexInRow) * hexShortDiag)), 2) + 
						Math.pow(height / 2 - rowHeight, 2)
					)
				);
				return res;
			}, {}
		)
	}
}

function getHexTexture() {
	const elem = new PIXI.Graphics();
	elem.lineStyle(5, 0x000000, 1);
	elem.beginFill(0xe8701b);
	elem.moveTo(0, 0 + hexLongDiag / 2);
	elem.lineTo(0 + hexShortDiag / 2, 0 + hexLongDiag / 4);
	elem.lineTo(0 + hexShortDiag / 2, 0 - hexLongDiag / 4);
	elem.lineTo(0, 0 - hexLongDiag / 2);
	elem.lineTo(0 - hexShortDiag / 2, 0 - hexLongDiag / 4);
	elem.lineTo(0 - hexShortDiag / 2, 0 + hexLongDiag / 4);
	elem.endFill();
	return elem.generateTexture();
}

function setMeasures() {
	width = window.innerWidth;
	height = window.innerHeight;
	renderer.resize(width, height);
	hexShortDiag = width / 5;
	hexSide = hexShortDiag / Math.sqrt(3);
	hexLongDiag = hexSide * 2;
	if (height < hexLongDiag * 3 + hexSide * 2) {
		hexSide = height / 9;
		// hexSide = height / 8;
		hexLongDiag = hexSide * 2;
		hexShortDiag = hexSide * Math.sqrt(3);
	}
	hexTexture = getHexTexture();

	// Get how many hexagon rows can be put on screen, and how many hexagons can each row fit;
	hexInRow = Math.ceil((width - (width / 2 + hexShortDiag / 2)) / hexShortDiag) * 2 + 1;
	rowCount = 0;

	let full = false;
	let currentHeight = height / 2;
	while (!full) {
		if (rowCount % 2) currentHeight -= hexLongDiag
		else currentHeight -= hexSide;

		if (currentHeight < 0) {
			full = true;
			rowCount = rowCount * 2 + 1;
		}
		else rowCount++;
	}
}

function drawHexagon(w, h, dist) {
	const TSprite = new PIXI.Sprite(hexTexture);
	TSprite.interactive = true;
	TSprite.anchor.set(.5, .5);
	TSprite.x = w;
	TSprite.y = h;
	TSprite.alpha = 0;
	TSprite.centerDistance = dist;

	return TSprite;
}

// Sort container elements by zIndex (props to 'tengotengo' => https://github.com/pixijs/pixi.js/issues/300)
function updateLayersOrder(container) {
    return container.children.sort((a,b) => {
        a.zIndex = a.zIndex || 0;
        b.zIndex = b.zIndex || 0;
        return a.zIndex - b.zIndex;
    });
};

function draw() {
	setMeasures();

	// Clear screen, then draw hexagons;
	while (stage.children[0]) stage.removeChild(stage.children[0]);
	let currentRow = 1;
	let hexgrid = {
		...drawHexRow(0, height / 2, hexInRow)
	}

	full = false;

	while (!full) {
		const rowHeight = height / 2 - (hexLongDiag / 2 * currentRow) - (hexLongDiag / 4 * currentRow);
		const revRowHeight = height / 2 + (hexLongDiag / 2 * currentRow) + (hexLongDiag / 4 * currentRow);

		if (rowHeight + hexLongDiag / 2 < 0) {
			full = true;
		} else {
			hexgrid = { 
				...hexgrid, 
				...drawHexRow(currentRow, rowHeight, hexInRow),
				...drawHexRow(currentRow * -1, revRowHeight, hexInRow)
			}
			currentRow++;
		}
	}
	centralHex = hexgrid[`hex_0_${Math.floor(hexInRow / 2)}`];
	
	// Set fade-in animation, with duration based on how close the element is to the screen center;
	const maxDist = Object.values(hexgrid).sort((a, b) => b.centerDistance - a.centerDistance)[0].centerDistance;
	const maxFadeTime = 1;

	Object.values(hexgrid).forEach(elem => { 
		TweenMax.to(elem, elem.centerDistance / maxDist * maxFadeTime, {alpha: 1, ease: Cubic.easeIn});
		elem.zIndex = 0;
		stage.addChild(elem);
	});

	centralHex.zIndex = 1;

	// Add central text
	mainText = new PIXI.Text('ACCESS', {
		fontFamily : 'Orbitron',
		fontSize: hexShortDiag / 6,
		fontWeight: 'bold',
		fill : 0xff0000, 
		align : 'center'
	});
	mainText.anchor.set(.5);
	mainText.x = width / 2;
	mainText.y = height / 2;
	mainText.zIndex = 2;
	stage.addChild(mainText);

	stage.children = updateLayersOrder(stage);

	centralHex.on('click', function() {
		Object.values(hexgrid).forEach(elem => { 
			if (elem != this) {
				// const anim = TweenMax.to(elem, elem.centerDistance / maxDist * maxFadeTime, {pixi: {tint: 0x00ff26}, ease: Cubic.easeIn});
				const anim = TweenMax.to(elem, maxFadeTime - (elem.centerDistance / maxDist) * maxFadeTime, {alpha: 0, ease: Cubic.easeIn});
			} else {
				const anim = TweenMax.to(elem, .3, {pixi: {rotation: 30, tint: 0x00ff26}, delay: maxFadeTime, ease: Cubic.easeOut, onStart: () => {
					let newText = [...'GRANTED'];
					let loopCount = 0;
					let loop = setInterval(() => {
						if (loopCount === newText.length - 1) clearInterval(loop);
						const newLetter = newText[loopCount];
						mainText.text = mainText.text.substr(0, loopCount) + newLetter + mainText.text.substr(loopCount + 1, mainText.text.length);

						loopCount++;
					}, 300 / newText.length);
				}, onComplete: () => {
					const maxFadeTime = .8;

					Object.values(hexgrid).forEach(elem => {
						elem.tint = 0x00ff26;	
						TweenMax.to(elem, elem.centerDistance / maxDist * maxFadeTime, {alpha: 1, ease: Cubic.easeIn});
					});
				}});
			}
		});
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