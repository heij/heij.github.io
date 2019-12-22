const scrollUpEvent = new Event('scrollUp');
const scrollDownEvent = new Event('scrollDown');
let app, renderer, stage,	screenSize;

let screens = {};

WebFont.load({
	google: {
		families: ['Orbitron']
	},
	active: setup
});

class Screen {
	constructor(visible) {
		this.container = new PIXI.Container();
		this.container.sortableChildren = true;
		this.container.sortDirty = true;
		this.container.isVisible = false;
		this.container.alpha = visible ? 1 : 0;
		stage.addChild(this.container);
	}

	toggleVisibility(duration) {
		if (this.container.isVisible) {
			TweenMax.to(this.container, duration, {pixi: {alpha: 0}, ease: Cubic.easeIn, 
				onComplete: () => this.container.isVisible = false
			});
		} else {
			TweenMax.to(this.container, duration, {pixi: {alpha: 1}, ease: Cubic.easeIn, 
				onComplete: () => this.container.isVisible = true
			});
		}
	}
}

class ProjectsScreen extends Screen {
	constructor() {
		super();

		this.projects = {
			asuka: {
				imgPath: './scripts/143894.jpg',
				title: 'Asuka',
				description: 'Asuka best grill',
				link: 'www.google.com'
			}
		}

		this.minRowHex = 3;
		this.maxRowHex = 7;

		this.hexLongDiag = screenSize[0]/9.5;
		this.hexSide = this.hexLongDiag/2;
		this.hexShortDiag = this.hexSide * Math.sqrt(3);
		this.baseRowHeight = -(this.hexShortDiag/3);

		this.rowHexCount = Math.ceil(screenSize[0] / (this.hexLongDiag + this.hexShortDiag)) * 2 + 1;
		this.rowCount = Math.ceil((screenSize[1] + this.hexShortDiag) / this.hexShortDiag);

		this.hexTexture = this.makeHexTexture();
		this.makeHexGrid();
	}

	makeHexTexture() {
		return new PIXI.Graphics()
			.beginFill(0xffffff)
			.lineStyle(1, 0xffffff, 1, 0)
			.moveTo(0 - this.hexSide/2, 0 - this.hexShortDiag/2)
			.lineTo(this.hexSide/2, 0 - this.hexShortDiag/2)
			.lineTo(this.hexLongDiag/2, 0)
			.lineTo(this.hexSide/2, this.hexShortDiag/2)
			.lineTo(0 - this.hexSide/2, this.hexShortDiag/2)
			.lineTo(0 - this.hexLongDiag/2, 0)
			.endFill()
			.generateTexture();
	}

	drawHexagon(w, h) {
		let container = new PIXI.Container();
		container.center = [w, h];
		if (
			w - this.hexLongDiag/2 < 0 ||
			w + this.hexLongDiag/2 > screenSize[0] ||
			h - this.hexShortDiag/2 < 0
		) container.good = false
		else 
			container.good = true;

		let outerHex = new PIXI.Sprite(this.hexTexture);
		outerHex.anchor.set(.5);
		outerHex.x = w;
		outerHex.y = h;
		outerHex.tint = 0x000000;
		outerHex.zIndex = 0;
		container.addChild(outerHex);

		let innerHex = new PIXI.Sprite(this.hexTexture);
		innerHex.anchor.set(.5);
		innerHex.x = w;
		innerHex.y = h;
		innerHex.tint = 0x821082;
		innerHex.zIndex = 0;
		innerHex.scale.x = .95;
		innerHex.scale.y = .95;
		container.addChild(innerHex);

		// if (!container.good) innerHex._filters = [new PIXI.filters.BlurFilter(3)];
		if (!container.good) innerHex.tint = 0x470c47;

		return container;
	}

	makeHexLine(rowIndex) {
		let hexGrid = new PIXI.Container();
		let xOffset = this.hexLongDiag/2 + this.hexSide/2;
		let baseRowHeight = rowIndex * this.hexShortDiag + this.baseRowHeight;

		let hexArray = [];
		hexArray[Math.floor(this.rowHexCount/2)] = this.drawHexagon(screenMiddle[0], baseRowHeight + this.hexShortDiag / 2);

		Array(Math.floor(this.rowHexCount/2)).fill(0).map((i, index) => {
			let rowHeight = index % 2
				? baseRowHeight + this.hexShortDiag / 2
				: baseRowHeight;

			hexArray[Math.floor(this.rowHexCount/2) + (index + 1)] = this.drawHexagon(screenMiddle[0] + xOffset * (index + 1), rowHeight);
			hexArray[Math.floor(this.rowHexCount/2) - (index + 1)] = this.drawHexagon(screenMiddle[0] - xOffset * (index + 1), rowHeight);
		});
		return hexArray;
	}

	makeHexGrid() {
		let hexGrid = new PIXI.Container();
		let hexIndex = Array(this.rowCount).fill(0)
			.reduce((res, i, index) => {
				let hexLine = this.makeHexLine(index);
				hexLine.forEach(h => {
					if (h.good) {
						h.interactive = true;
						h.on('mouseover', () => TweenMax.to(h, .3, {pixi:{brightness:2}}));
						h.on('mouseout', () => TweenMax.to(h, .3, {pixi:{brightness:1}}));
					}
					hexGrid.addChild(h);
				});
				return [ ...res, ...hexLine ];
			}, []
		);
		this.container.addChild(hexGrid);
	}
}

function setup() {
	app = new PIXI.Application(window.innerWidth, window.innerHeight, {
		backgroundColor: 0xffffff,
		antialias: true,
		autoStart: true,
		autoResize: true,
		resolution: devicePixelRatio
	});
	renderer = app.renderer;
	renderer.view.style.position = 'fixed';
	renderer.view.style.display = 'block';
	renderer.view.style.left = 0;
	renderer.view.style.top = 0;
	renderer.view.style.zIndex = 0;
	document.body.appendChild(renderer.view);
	stage = new PIXI.Container();
	stage.sortableChildren = true;
	stage.sortDirty = true;

	draw();
	animate();
}

function setVariables() {
	screenSize = [window.innerWidth, window.innerHeight];
	screenMiddle = screenSize.map(m => m/2);
	renderer.resize(screenSize[0], screenSize[1]);
}

// Sort container elements by zIndex (props to 'tengotengo' => https://github.com/pixijs/pixi.js/issues/300)
function updateLayersOrder(container) {
	return container.children.sort((a, b) => {
		a.zIndex = a.zIndex || 0;
		b.zIndex = b.zIndex || 0;
		return a.zIndex - b.zIndex;
	});
}

function draw() {
	setVariables();

	// Clear screen;
	while (stage.children[0]) stage.removeChild(stage.children[0]);

	// screens.projects = new ProjectsScreen(true).toggleVisibility();
}

function animate() {
	requestAnimationFrame(animate);
	renderer.render(stage);
}

window.addEventListener('resize', () => {
	draw();
});