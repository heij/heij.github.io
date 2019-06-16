const scrollUpEvent = new Event('scrollUp');
const scrollDownEvent = new Event('scrollDown');
let	app, renderer, stage,
 	width, height, 
	hexgrid, hexTexture, hexShortDiag, hexSide, hexLongDiag,
	hexInRow, rowCount, centralHex, mainText;

WebFont.load({
	google: {
	  families: ['Orbitron']
	},
	active: setup
});

function setup() {
	app = new PIXI.Application(width, height, {
		backgroundColor: 0xffffff,
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

function getHexTexture() {
	const elem = new PIXI.Graphics();
	elem.lineStyle(1, 0x000000, 1);
	// elem.lineStyle(2, 0xdf42f4, 1);
	// elem.beginFill(0x42f489);
	elem.beginFill(0xffffff);
	elem.moveTo(0, 0 + hexLongDiag / 2);
	elem.lineTo(0 + hexShortDiag / 2, 0 + hexLongDiag / 4);
	elem.lineTo(0 + hexShortDiag / 2, 0 - hexLongDiag / 4);
	elem.lineTo(0, 0 - hexLongDiag / 2);
	elem.lineTo(0 - hexShortDiag / 2, 0 - hexLongDiag / 4);
	elem.lineTo(0 - hexShortDiag / 2, 0 + hexLongDiag / 4);
	elem.endFill();
	return elem.generateTexture();
}

function drawHexagon(w, h, rowIndex, indexInRow) {
	const TSprite = new PIXI.Sprite(hexTexture);
	TSprite.anchor.set(.5, .5);
	TSprite.x = w;
	TSprite.y = h;
	TSprite.alpha = 0;
	TSprite.centerDistance = getDistToCenter(rowIndex, indexInRow, h);
	TSprite.scale.x = .95;
	TSprite.scale.y = .95;
	TSprite.zIndex = 0;
	TSprite.tint = 0xe8701b;
	TSprite.centerCoordinates = [w, h];

	return TSprite;
}

function drawHexRow(rowIndex, rowHeight) {
	if (rowIndex % 2) {
		return Array(hexInRow + 1).fill(0).reduce(
			(res, hex, indexInRow) => {
				res[`hex_${rowIndex}_${indexInRow}`] = drawHexagon(
					width / 2 - ((Math.floor(hexInRow / 2) - indexInRow) * hexShortDiag) - hexShortDiag / 2,
					rowHeight,
					rowIndex,
					indexInRow
				);
				return res;
			}, {}
		)
	} else {
		return Array(hexInRow).fill(0).reduce(
			(res, hex, indexInRow) => {
				res[`hex_${rowIndex}_${indexInRow}`] = drawHexagon(
					width / 2 - ((Math.floor(hexInRow / 2) - indexInRow) * hexShortDiag),
					rowHeight,
					rowIndex,
					indexInRow
				);
				return res;
			}, {}
		)
	}
}

function getDistToCenter(rowIndex, indexInRow, rowHeight) {
	return rowIndex % 2
		? Math.sqrt(
				Math.pow(width / 2 - (width / 2 - ((Math.floor(hexInRow / 2) - indexInRow) * hexShortDiag) - hexShortDiag / 2), 2) + 
				Math.pow(height / 2 - rowHeight, 2)
			)
		: Math.sqrt(
				Math.pow(width / 2 - (width / 2 - ((Math.floor(hexInRow / 2) - indexInRow) * hexShortDiag)), 2) + 
				Math.pow(height / 2 - rowHeight, 2)
			);
}

function setVariables() {
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
	// Get how many hexagon rows can be put on screen, and how many hexagons can each row fit;
	hexInRow = Math.ceil((width - (width / 2 + hexShortDiag / 2)) / hexShortDiag) * 2 + 1;
	hexTexture = getHexTexture();
}

// Sort container elements by zIndex (props to 'tengotengo' => https://github.com/pixijs/pixi.js/issues/300)
function updateLayersOrder(container) {
    return container.children.sort((a,b) => {
        a.zIndex = a.zIndex || 0;
        b.zIndex = b.zIndex || 0;
        return a.zIndex - b.zIndex;
    });
}

function addHexText(textContent, w, h) {
	let textElem = new PIXI.Text(textContent, {
		fontFamily : 'Orbitron',
		fontSize: hexShortDiag / (textContent.length + 1),
		fontWeight: 'bold',
		fill : 0xff0000, 
		align : 'center'
	});
	textElem.anchor.set(.5);
	textElem.x = w;
	textElem.y = h;
	textElem.zIndex = 2;
	return textElem;
}

function draw() {
	setVariables();

	// Clear screen, then draw the central row...
	while (stage.children[0]) stage.removeChild(stage.children[0]);
	hexgrid = {
		...drawHexRow(0, height / 2)
	}

	// ...then keep adding rows until the screen is completely filled;
	let currentRow = 1;
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
	rowCount = (currentRow - 1) * 2 + 1;

	centralHex = hexgrid[`hex_0_${Math.floor(hexInRow / 2)}`];
	centralHex.interactive = true;
	centralHex.zIndex = 1;

	mainText = addHexText('ACCESS', ...centralHex.centerCoordinates);
	stage.addChild(mainText);

	// Set initial fade-in animation, with duration based on how close the element is to the screen center;
	const maxDist = Object.values(hexgrid).sort((a, b) => b.centerDistance - a.centerDistance)[0].centerDistance;
	const maxFadeTime = 1;
	Object.values(hexgrid).forEach(elem => {
		TweenMax.to(elem, elem.centerDistance / maxDist * maxFadeTime, {alpha: 1, ease: Cubic.easeIn});
		stage.addChild(elem);
	});

	const fillSprite = drawHexagon(width / 2, height / 2);
	fillSprite.alpha = 1;
	fillSprite.scale.x = 0;
	fillSprite.scale.y = 0;
	fillSprite.zIndex = 1.5;
	fillSprite.tint = 0x32ff00;
	stage.addChild(fillSprite);

	const circleLine = new PIXI.Graphics();
	circleLine.lineStyle(10, 0x74ff1e, 1);
	circleLine.drawCircle(0, 0, hexSide);
	const circleLineSprite = new PIXI.Sprite(circleLine.generateTexture());
	circleLineSprite.anchor.set(.5);
	circleLineSprite.x = width / 2;
	circleLineSprite.y = height / 2;
	circleLineSprite.scale.x = 0;
	circleLineSprite.scale.y = 0;
	circleLineSprite.alpha = 0;
	circleLineSprite.zIndex = 10;
	stage.addChild(circleLineSprite)

	const circle = new PIXI.Graphics();
	circle.beginFill(0xffffff);
	circle.drawCircle(0, 0, hexSide);
	circle.endFill();
	const circleSprite = new PIXI.Sprite(circle.generateTexture());
	circleSprite.anchor.set(.5);
	circleSprite.x = width / 2;
	circleSprite.y = height / 2;
	circleSprite.scale.x = 0;
	circleSprite.scale.y = 0;
	circleSprite.zIndex = 11;
	stage.addChild(circleSprite);

	centralHex.mouseover = () => {
		TweenMax.to(centralHex, .5, {pixi: {tint: 0xff8c3a}, ease: Power4.easeOut });
	}
	centralHex.mouseout = () => {
		TweenMax.to(centralHex, .5, {pixi: {tint: 0xe8701b}, ease: Power4.easeOut });
	}

	stage.children = updateLayersOrder(stage);

	centralHex.on('click', function() {
		TweenMax.to(centralHex, 0, {pixi: {tint: 0xe8701b}});
		centralHex.mouseover = null;
		centralHex.mouseout = null;

		Object.values(hexgrid).forEach(elem => { 
			if (elem != this) {
				TweenMax.to(elem, maxFadeTime - (elem.centerDistance / maxDist) * maxFadeTime, {alpha: 0, ease: Cubic.easeIn});
			} else {

			}
		});

		// ease: Back.easeOut.config(2);
		// TweenMax.to(centralHex, .5, {pixi: {tint: 0x00ff15}, delay: maxFadeTime, ease: Power4.easeInOut,
		TweenMax.to(fillSprite, .5, {pixi: {scaleX: .95, scaleY: .95}, delay: maxFadeTime, ease: Power4.easeIn,
			onStart: () => {
				let newText = 'GRANTED';
				let loopCount = 0;
				let loop = setInterval(() => {
					if (loopCount === newText.length - 1) clearInterval(loop);
					mainText.text = mainText.text.substr(0, loopCount) + newText[loopCount] + mainText.text.substr(loopCount + 1, mainText.text.length);

					loopCount++;
				}, 300 / newText.length);
			},
			onComplete: () => {
				TweenMax.to(hexgrid[`hex_1_${Math.floor(hexInRow / 2) - 1}`], 0, {pixi: {alpha: 1, tint: 0x32ff00}});
				TweenMax.to(hexgrid[`hex_-1_${Math.floor(hexInRow / 2) - 1}`], 0, {pixi: {alpha: 1, tint: 0x32ff00}});
				TweenMax.to(hexgrid[`hex_1_${Math.floor(hexInRow / 2) + 2}`], 0, {pixi: {alpha: 1, tint: 0x32ff00}});
				TweenMax.to(hexgrid[`hex_-1_${Math.floor(hexInRow / 2) + 2}`], 0, {pixi: {alpha: 1, tint: 0x32ff00}});

				[
					[hexgrid[`hex_1_${Math.floor(hexInRow / 2) - 1}`], 'PROJECTS'],
					[hexgrid[`hex_-1_${Math.floor(hexInRow / 2) - 1}`], 'LINKS'],
					[hexgrid[`hex_1_${Math.floor(hexInRow / 2) + 2}`], 'ABOUT'],
					[hexgrid[`hex_-1_${Math.floor(hexInRow / 2) + 2}`], 'CONTACT'],
				].forEach(([hex, text]) => {
					stage.addChild(addHexText(text, ...hex.centerCoordinates))
				});

				stage.mask = circleSprite;
				circleLineSprite.scale.x = .95;
				circleLineSprite.scale.y = .95;
				circleSprite.scale.x = .95;
				circleSprite.scale.y = .95;

				const line = new PIXI.Graphics();
				line.lineStyle(5, 0x0cfc38, 1);
				// line.moveTo(0, 0 + hexLongDiag / 2);
				line.moveTo(0, 0 + hexLongDiag / 2);
				line.lineTo(0 + hexShortDiag / 2, 0 + hexLongDiag / 4);
				const lineTexture = line.generateTexture();

				const TRSprite = new PIXI.Sprite(lineTexture);
				TRSprite.anchor.set(.5, .5);
				TRSprite.x = width / 2 + hexShortDiag - hexShortDiag / 4;
				TRSprite.y = height / 2 - hexSide + hexSide / 4;
				TRSprite.scale.x = 1.15;
				TRSprite.scale.y = 1.15;
				TRSprite.zIndex = -1;
				stage.addChild(TRSprite);

				const TLSprite = new PIXI.Sprite(lineTexture);
				TLSprite.anchor.set(.5, .5);
				TLSprite.x = width / 2 - hexShortDiag + hexShortDiag / 4;
				TLSprite.y = height / 2 - hexSide + hexSide / 4;
				TLSprite.scale.x = 1.15;
				TLSprite.scale.y = 1.15;
				TLSprite.zIndex = -1;
				TweenMax.to(TLSprite, 0, {pixi: {rotation: 60}});
				stage.addChild(TLSprite);

				const BLSprite = new PIXI.Sprite(lineTexture);
				BLSprite.anchor.set(.5, .5);
				BLSprite.x = width / 2 - hexShortDiag + hexShortDiag / 4;
				BLSprite.y = height / 2 + hexSide - hexSide / 4;
				BLSprite.scale.x = 1.15;
				BLSprite.scale.y = 1.15;
				BLSprite.zIndex = -1;
				TweenMax.to(BLSprite, 0, {pixi: {rotation: 180}});
				stage.addChild(BLSprite);

				const BRSprite = new PIXI.Sprite(lineTexture);
				BRSprite.anchor.set(.5, .5);
				BRSprite.x = width / 2 + hexShortDiag - hexShortDiag / 4;
				BRSprite.y = height / 2 + hexSide - hexSide / 4;
				BRSprite.scale.x = 1.15;
				BRSprite.scale.y = 1.15;
				BRSprite.zIndex = -1;
				TweenMax.to(BRSprite, 0, {pixi: {rotation: 240}});
				stage.addChild(BRSprite);

				stage.children = updateLayersOrder(stage);

				TweenMax.to(circleLineSprite, .5, {alpha: 1, ease: Power4.easeInOut});
				// TweenMax.to(centralHex, .5, {pixi: {rotation: 30}, ease: Power4.easeInOut});
				// TweenMax.to(fillSprite, .5, {pixi: {rotation: 30}, ease: Power4.easeInOut, onComplete: () => {
						TweenMax.to(circleLineSprite.scale, .5, {x: 11, y: 11, ease: Power4.easeInOut});
						TweenMax.to(circleSprite.scale, .5, {x: 11, y: 11, ease: Power4.easeInOut, onComplete: () => {
								stage.removeChild(circleSprite);
								stage.mask = null;
								stage.removeChild(fillSprite);
								centralHex.tint = 0x32ff00;
							}
						});
				// 	}
				// });

				// Object.values(hexgrid).forEach(elem => {
				// 	elem.tint = 0x32ff00;
				// 	elem.alpha = 1;
				// 	TweenMax.to(elem, .5, {y: -200, delay: rand, ease: Cubic.easeIn});
				// });
			}
		});		
	});
}

function animate() {
	requestAnimationFrame(animate);
	renderer.render(stage);
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