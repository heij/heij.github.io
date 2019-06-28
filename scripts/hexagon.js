const scrollUpEvent = new Event('scrollUp');
const scrollDownEvent = new Event('scrollDown');
let app, renderer, stage,
	width, height, screenCenter,
	hexgrid, hexTexture, hexShortDiag, hexSide, hexLongDiag,
	hexInRow, rowCount, centralHex, mainText;

let screens = {
	home:'',
	projects:'',
	contact:'',
	about:'',
	expanded: ''
};

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
	const hexTexture = new PIXI.Graphics();
	hexTexture.beginFill(0xffffff);
	hexTexture.moveTo(0, 0 + hexLongDiag / 2);
	hexTexture.lineTo(0 + hexShortDiag / 2, 0 + hexLongDiag / 4);
	hexTexture.lineTo(0 + hexShortDiag / 2, 0 - hexLongDiag / 4);
	hexTexture.lineTo(0, 0 - hexLongDiag / 2);
	hexTexture.lineTo(0 - hexShortDiag / 2, 0 - hexLongDiag / 4);
	hexTexture.lineTo(0 - hexShortDiag / 2, 0 + hexLongDiag / 4);
	hexTexture.endFill();
	return hexTexture.generateTexture();
}

function drawHexagon(w, h) {
	const TSprite = new PIXI.Sprite(hexTexture);
	TSprite.anchor.set(.5, .5);
	TSprite.x = w;
	TSprite.y = h;
	TSprite.centerDistance = getDistToCenter(w, h);
	TSprite.scale.x = .95;
	TSprite.scale.y = .95;
	TSprite.zIndex = 0;
	// TSprite.tint = 0xe8701b;
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
					rowHeight
				);
				return res;
			}, {}
		)
	} else {
		return Array(hexInRow).fill(0).reduce(
			(res, hex, indexInRow) => {
				res[`hex_${rowIndex}_${indexInRow}`] = drawHexagon(
					width / 2 - ((Math.floor(hexInRow / 2) - indexInRow) * hexShortDiag),
					rowHeight
				);
				return res;
			}, {}
		)
	}
}

function fillHexGrid() {
	let hexScreen = new PIXI.Container();
	let hexScreenBackground = new PIXI.Graphics();
	hexScreenBackground.beginFill(0xFFD700);
	hexScreenBackground.moveTo(0, 0);
	hexScreenBackground.lineTo(width, 0);
	hexScreenBackground.lineTo(width, height);
	hexScreenBackground.lineTo(0, height);
	hexScreenBackground.endFill();
	hexScreen.addChild(hexScreenBackground);

	// Draw the central row...
	hexgrid = {
		...drawHexRow(0, height / 2)
	}

	// ...keep adding rows until the screen is completely filled;
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
	Object.values(hexgrid).forEach(hex => {
		hex.tint = 0x000000;
		hexScreen.addChild(hex)
	});
	return hexScreen;
}

function getDistToCenter(w, h) {
	return Math.sqrt(Math.pow(screenCenter[0] - w, 2) + Math.pow(screenCenter[1] - h, 2));
}

function setVariables() {
	width = window.innerWidth;
	height = window.innerHeight;
	screenCenter = [width / 2, height / 2];
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
	return container.children.sort((a, b) => {
		a.zIndex = a.zIndex || 0;
		b.zIndex = b.zIndex || 0;
		return a.zIndex - b.zIndex;
	});
}

function addHexText(textContent, w, h) {
	let textElem = new PIXI.Text(textContent, {
		fontFamily: 'Orbitron',
		fontSize: hexShortDiag / (textContent.length + 1),
		fontWeight: 'bold',
		fill: 0xff0000,
		align: 'center'
	});
	textElem.anchor.set(.5);
	textElem.x = w;
	textElem.y = h;
	textElem.zIndex = 2;
	return textElem;
}

function draw() {
	// Set dimensions and other important variables;
	setVariables();

	// Clear screen;
	while (stage.children[0]) stage.removeChild(stage.children[0]);

	let centerOutline = new PIXI.Sprite(hexTexture);
	centerOutline.anchor.set(.5, .5);
	centerOutline.x = width / 2;
	centerOutline.y = height / 2;
	centerOutline.centerCoordinates = [width / 2, height / 2];
	centerOutline.centerDistance = getDistToCenter(width / 2, height / 2);
	centerOutline.tint = 0xad42f4;
	let hollowCenter = new PIXI.Sprite(hexTexture);
	hollowCenter.anchor.set(.5, .5);
	hollowCenter.x = width / 2;
	hollowCenter.y = height / 2;
	hollowCenter.scale.x = .9;
	hollowCenter.scale.y = .9;
	hollowCenter.centerCoordinates = [width / 2, height / 2];
	hollowCenter.centerDistance = getDistToCenter(width / 2, height / 2);
	hollowCenter.tint = 0x000000;
	let centerHexContainer = new PIXI.Container();
	centerHexContainer.addChild(centerOutline);
	centerHexContainer.addChild(hollowCenter);

	const hexes = [
		[hexShortDiag, hexLongDiag, 'PROJECTS'],
		[hexShortDiag, height - hexLongDiag, 'ABOUT'],
		[width - hexShortDiag, hexLongDiag, 'CONTACT'],
		[width - hexShortDiag, height - hexLongDiag, 'LINKS'],
	].map(([x, y, text]) => {
		let hex = drawHexagon(x, y);
		let hexContainer = new PIXI.Container();
		hexContainer.interactive = true;
 		hexContainer.buttonMode = true;
 		hexContainer.zIndex = 1;
 		hexContainer
 			.on('mousedown', onDragStart)
 			.on('touchstart', onDragStart)
 			.on('mouseup', onDragEnd)
 			.on('mouseupoutside', onDragEnd)
 			.on('touchend', onDragEnd)
 			.on('touchendoutside', onDragEnd)
 			.on('mousemove', onDragMove)
 			.on('touchmove', onDragMove)

 		hexContainer.addChild(hex);
 		hexContainer.addChild(addHexText(text, x, y));
		stage.addChild(hexContainer);
		return hexContainer;
	});

	const hexScreen = fillHexGrid();
	// const mask = drawHexagon(width/2, height/2);
	let mask = new PIXI.Graphics();
	mask.beginFill(0xffffff);
	mask.moveTo(0, 0);
	mask.lineTo(width, 0);
	mask.lineTo(width, height);
	mask.lineTo(0, height);
	mask.endFill();
	mask._filters = [new PIXI.filters.BlurFilter(150)]
	let maskSprite = new PIXI.Sprite(renderer.generateTexture(mask));
	maskSprite.anchor.set(.5);
	maskSprite.scale.x = 0;
	maskSprite.scale.y = 0;
	maskSprite.x = width / 2;
	maskSprite.y = height / 2
	hexScreen.addChild(maskSprite);
	hexScreen.mask = maskSprite;

	stage.addChild(hexScreen);
	stage.addChild(centerHexContainer);
	stage.children = updateLayersOrder(stage);

	function onDragStart(event) {
		this.data = event.data;
		this.children.forEach(item => TweenMax.to(item, .2, {alpha: .7, ease: Cubic.easeIn}));
		this.dragging = this.data.getLocalPosition(this.parent);
	}
	function onDragMove(event) {
		if (this.dragging) {
			let newPosition = this.data.getLocalPosition(this.parent);
			this.children.forEach(item => {
				item.position.x += (newPosition.x - this.dragging.x);
				item.position.y += (newPosition.y - this.dragging.y);
			});
			if (Math.abs(this.children[0].position.x - screenCenter[0]) < hexShortDiag &&
					Math.abs(this.children[0].position.y - screenCenter[1]) < hexShortDiag) {
				TweenMax.to(centerOutline, .2, {pixi: {tint: 0xFFD700}, ease: Cubic.easeOut});
			} else {
				TweenMax.to(centerOutline, .2, {pixi: {tint: 0xad42f4}, ease: Cubic.easeOut});
			}
			this.dragging = newPosition;
		}
	}
	function onDragEnd() {
		this.children.forEach(item => TweenMax.to(item, .2, {alpha: 1, ease: Cubic.easeIn}));

		if (Math.abs(this.children[0].position.x - screenCenter[0]) < hexShortDiag &&
				Math.abs(this.children[0].position.y - screenCenter[1]) < hexShortDiag) {
			TweenMax.to(centerOutline, .2, {pixi: {tint: 0xFFD700}, ease: Cubic.easeOut,
				onComplete: () => {
					TweenMax.to(this.children[0], .2, {pixi: {tint: 0xFFD700}, ease: Cubic.easeIn});
					
					// stage.children.forEach(item => { if (item != this) TweenMax.to(item, .2, {pixi: {alpha: 0}, ease: Cubic.easeIn}) });
					TweenMax.to(maskSprite, .2, {pixi:{scaleX: 1, scaleY: 1}, ease: Cubic.easeOut});
				}
			});
			hexes.forEach(hex => { if (hex != this) TweenMax.to(hex, .2, {pixi: {alpha: 0}, ease: Cubic.easeIn}) });
			this.children.forEach(item => TweenMax.to(item, .2, {pixi: {x: screenCenter[0], y: screenCenter[1]}, ease: Cubic.easeIn}));
		} else {
			const newCoordinates = this.children[0].centerCoordinates;
			this.children.forEach(item => TweenMax.to(item, .2, {pixi: {x: newCoordinates[0], y: newCoordinates[1]}, ease: Cubic.easeIn}));
			TweenMax.to(this.children[0], .2, {pixi: {tint: 0xe8701b}, ease: Cubic.easeIn});
		}
		this.data = null;
		this.dragging = false;
	}
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