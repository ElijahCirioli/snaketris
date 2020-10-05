const canvas = document.getElementById("mainCanvas");
const context = canvas.getContext("2d");
const bCanvas = document.getElementById("blockCanvas");
const bContext = bCanvas.getContext("2d");

class Vec {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

class Cell {
	constructor(pos, color) {
		this.pos = pos;
		this.color = color;
		this.space = false;
		this.offset = 0;
	}
}

const ts = 20; //tilesize
const boardSize = new Vec(10, 19);
const boardCorner = new Vec(60, 35);
const colors = [
	{ front: "#9ca3a6", top: "#c6cccf" }, //gray
	{ front: "#c92e40", top: "#f26374" }, //red
	{ front: "#1cbd7a", top: "#53dba3" }, //green
	{ front: "#e39827", top: "#f0b256" }, //orange
	{ front: "#274fc4", top: "#597bde" }, //blue
	{ front: "#27dbdb", top: "#82fafa" }, //cyan
	{ front: "#922dc4", top: "#b969e0" }, //purple
	{ front: "#dec62c", top: "#f7e56d" }, //yellow
];
let tick, maxTick;
let dir, cDir;
let time, maxTime;
let board, snake, food, falling;
let score, multiplier, level;
let msg, thread;
let playing;

function setup() {
	document.getElementById("menu").style.display = "none";
	tick = 0;
	maxTick = 10;
	maxTime = 600;
	time = maxTime;
	msg = "";
	score = 0;
	multiplier = 1;
	level = 1;
	falling = false;
	playing = true;
	createBoard();
	spawnSnake();
	spawnFood();
	requestAnimationFrame(draw);
}

function draw() {
	context.clearRect(0, 0, canvas.width, canvas.height);
	bContext.clearRect(0, 0, canvas.width, canvas.height);

	//draw background
	const bgGradient = context.createLinearGradient(0, 0, 0, 490);
	bgGradient.addColorStop(0, "#96e4fa");
	bgGradient.addColorStop(1, "#56a8bf");
	context.fillStyle = bgGradient;
	context.fillRect(0, 0, canvas.width, canvas.height);

	//draw border
	context.strokeStyle = "#76bf6f";
	context.lineWidth = 16;
	context.beginPath();
	context.moveTo(boardCorner.x - 8, boardCorner.y);
	context.lineTo(boardCorner.x - 8, boardCorner.y + boardSize.y * ts);
	context.arc(boardCorner.x, boardCorner.y + boardSize.y * ts, 8, Math.PI / 2, Math.PI);
	context.moveTo(boardCorner.x, boardCorner.y + 8 + boardSize.y * ts);
	context.lineTo(boardCorner.x + boardSize.x * ts, boardCorner.y + 8 + boardSize.y * ts);
	context.arc(boardCorner.x + boardSize.x * ts, boardCorner.y + boardSize.y * ts, 8, 0, 7);
	context.moveTo(boardCorner.x + boardSize * ts + 8, boardCorner.y + boardSize.y * ts);
	context.lineTo(boardCorner.x + boardSize.x * ts + 8, boardCorner.y);
	context.stroke();
	context.fillStyle = "#89db81";
	context.fillRect(boardCorner.x - 16, boardCorner.y - 3, 16, 3);
	context.fillRect(boardCorner.x + boardSize.x * ts, boardCorner.y - 3, 16, 3);

	//draw board
	const boardGradient = context.createLinearGradient(0, 0, 0, 380);
	boardGradient.addColorStop(0, "#4b8054");
	boardGradient.addColorStop(1, "#294a2e");
	context.fillStyle = boardGradient;
	context.fillRect(boardCorner.x, boardCorner.y, boardSize.x * ts, boardSize.y * ts);
	context.fillStyle = "#68a673";
	context.fillRect(boardCorner.x, boardCorner.y - 3, boardSize.x * ts, 3);

	//draw timer
	context.fillStyle = "#534dab";
	context.fillRect(boardCorner.x + boardSize.x * ts + 16, boardCorner.y + 30, 36, 320);
	context.fillRect(boardCorner.x + boardSize.x * ts + 52, boardCorner.y + 38, 8, 304);
	context.beginPath();
	context.arc(boardCorner.x + boardSize.x * ts + 52, boardCorner.y + 38, 8, 0, 7);
	context.arc(boardCorner.x + boardSize.x * ts + 52, boardCorner.y + 342, 8, 0, 7);
	context.fill();
	const timeGradient = context.createLinearGradient(0, 0, 0, 290);
	timeGradient.addColorStop(0, "#36e040");
	timeGradient.addColorStop(0.5, "#dce854");
	timeGradient.addColorStop(0.75, "#e0a734");
	timeGradient.addColorStop(1, "#e0483a");
	context.fillStyle = timeGradient;
	context.fillRect(boardCorner.x + boardSize.x * ts + 28, boardCorner.y + 45, 18, 290);
	let height = 290 - Math.floor((290 * time) / maxTime);
	if (height < 0) {
		height = 0;
	}
	context.fillStyle = "#423e78";
	context.fillRect(boardCorner.x + boardSize.x * ts + 28, boardCorner.y + 45, 18, height);

	if (score) {
		//draw score
		context.fillStyle = "white";
		context.textAlign = "center";
		context.font = "24px 'Space Mono'";
		context.fillText(msg, 165, 457);
		if (score > 0) {
			context.font = "18px 'Roboto Mono'";
			context.fillText(score, 165, 481);
		}
	}

	if (board) {
		//draw garbage
		for (let y = board.length - 1; y > 2; y--) {
			for (let x = 0; x < boardSize.x; x++) {
				if (board[y][x] !== 0) {
					drawBlock(x, y - 3, 0, 0);
				}
			}
		}
	}
	if (playing) {
		//draw food
		context.drawImage(aImg, boardCorner.x + food.x * ts, boardCorner.y + food.y * ts);

		//draw flashing garbage lines
		if (Math.floor(tick / 2) % 2 === 0) {
			bContext.fillStyle = "white";
			for (let i = 0; i < board.length; i++) {
				if (!board[i].includes(0)) {
					bContext.fillRect(boardCorner.x, boardCorner.y + (i - 3) * ts, boardSize.x * ts, ts);
				}
			}
		}

		//draw level
		context.fillStyle = "white";
		context.textAlign = "center";
		context.font = "16px 'Roboto Mono'";
		context.fillText("Level " + level, 323, 410);

		//draw snake
		if (!falling) {
			for (const cell of snake) {
				drawBlock(cell.pos.x, cell.pos.y, cell.color, 0);
			}
			let headPos = new Vec(boardCorner.x + snake[0].pos.x * ts, boardCorner.y + snake[0].pos.y * ts);
			if (dir.x === 1) {
				bContext.drawImage(fImg, 0, 0, 16, 16, headPos.x + 10, headPos.y + 2, 16, 16);
			} else if (dir.x === -1) {
				bContext.drawImage(fImg, 16, 0, 16, 16, headPos.x - 6, headPos.y + 2, 16, 16);
			} else if (dir.y === -1) {
				bContext.drawImage(fImg, 32, 0, 16, 16, headPos.x + 2, headPos.y - 7, 16, 16);
			} else if (dir.y === 1) {
				bContext.drawImage(fImg, 48, 0, 16, 16, headPos.x + 2, headPos.y + 10, 16, 16);
			}
		} else {
			let offset;
			if (tick < 8) {
				if (tick < 2 || tick > 5) {
					offset = -2;
				} else {
					offset = -4;
				}
			}
			for (const cell of snake) {
				if (tick < 8) {
					drawBlock(cell.pos.x, cell.pos.y, cell.color, offset);
				} else {
					if (cell.space) {
						cell.offset += 5;
					}
				}
				drawBlock(cell.pos.x, cell.pos.y, cell.color, cell.offset);
			}
		}

		tick++;
		if (falling) {
			dropBlocks();
		} else {
			if (tick === maxTick) {
				clearLines();
				move();
				tick = 0;
			}
		}
		if (time > 0 && !falling) {
			time--;
		}
		if (time === 1 && !falling) {
			tick = 0;
			falling = true;
			dropBlocks();
		}
		requestAnimationFrame(draw);
	}
}

function drawBlock(x, y, color, offset) {
	const col = colors[color];
	bContext.fillStyle = col.front;
	bContext.fillRect(boardCorner.x + x * ts, boardCorner.y + y * ts + offset, ts, ts);
	context.fillStyle = col.top;
	context.fillRect(boardCorner.x + x * ts, boardCorner.y - 3 + y * ts + offset, ts, 3);
	context.fillStyle = "rgba(0, 0, 0, 0.2)";
	context.fillRect(boardCorner.x + x * ts + 3, boardCorner.y + y * ts + 3 + offset, ts, ts);
}

function move() {
	//stop from turning 180 degrees
	if (cDir.x * dir.x === 0 && cDir.y * dir.y === 0) {
		dir.x = cDir.x;
		dir.y = cDir.y;
	}
	let newPos = new Vec(snake[0].pos.x + dir.x, snake[0].pos.y + dir.y);
	//if you dont crash
	if (canMove(newPos)) {
		//if you eat food
		if (newPos.x === food.x && newPos.y === food.y) {
			spawnFood();
			time += 90;
		} else {
			snake.splice(snake.length - 1, 1);
		}
		//move forward
		snake.unshift(new Cell(newPos, snake[0].color));
	} else {
		//gravity to blocks
		tick = 0;
		falling = true;
		dropBlocks();
	}
}

function canMove(pos) {
	if (pos.x < 0 || pos.x >= boardSize.x) {
		return false;
	}
	if (pos.y < 0 || pos.y >= boardSize.y) {
		return false;
	}
	if (board[pos.y + 3][pos.x] !== 0) {
		return false;
	}
	for (const cell of snake) {
		if (cell.pos.x === pos.x && cell.pos.y === pos.y && cell !== snake[snake.length - 1]) {
			return false;
		}
	}
	return true;
}

function dropBlocks() {
	if (tick >= 8 && tick % 4 === 0) {
		falling = testForSpace();
		//if there is room to fall
		if (falling) {
			for (const cell of snake) {
				if (cell.space) {
					cell.pos.y++;
					cell.offset = 0;
				}
			}
			falling = testForSpace();
		}
		//lock snake into board
		if (!falling) {
			tick = 0;
			for (const cell of snake) {
				board[cell.pos.y + 3][cell.pos.x] = 1;
			}
			testForDeath();
			if (playing) {
				spawnSnake();
				if (board[food.y + 3][food.x] !== 0) {
					spawnFood();
				}
			}
		}
	}
}

function testForSpace() {
	//determine if their is space for blocks to fall
	for (const cell of snake) {
		cell.space = false;
		if (cell.pos.y < 18 && board[cell.pos.y + 4][cell.pos.x] === 0) {
			cell.space = true;
		}
	}
	for (let y = board.length - 2; y >= 0; y--) {
		for (const cell of snake) {
			if (cell.space && cell.pos.y === y) {
				for (const other of snake) {
					if (cell !== other) {
						if (cell.pos.x === other.pos.x && cell.pos.y + 1 === other.pos.y && !other.space) {
							cell.space = false;
						}
					}
				}
			}
		}
	}
	for (const cell of snake) {
		if (cell.space) {
			return true;
		}
	}
	return false;
}

function clearLines() {
	//clear lines and move down
	let lines = 0;
	for (let i = 0; i < board.length; i++) {
		if (!board[i].includes(0)) {
			board[i] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
			lines++;
			for (let j = i; j > 0; j--) {
				board[j] = board[j - 1].slice();
			}
		}
	}
	//score based on lines
	if (lines > 0) {
		clearTimeout(thread);
		if (lines === 1) {
			msg = "Single";
		} else if (lines === 2) {
			msg = "Double";
		} else if (lines === 3) {
			msg = "Triple";
		} else {
			msg = lines + "x ";
			if (lines === 4) {
				msg += "Snaketris";
			} else if (lines === 8) {
				msg += "Double Snaketris";
			} else if (lines === 16) {
				msg += "Triple Snaketris";
			} else if (lines === 20) {
				msg += "Quadruple Snaketris";
			} else {
				msg += "Combo";
			}
		}
		score += Math.round(lines * (40 + 10 * lines) * multiplier);
		thread = setTimeout(clearMsg, 3000);
		progressLevel();
	}
}

function clearMsg() {
	msg = "";
}

function progressLevel() {
	if (level === 1 && score > 500) {
		level = 2;
		multiplier = 1.5;
		maxTick = 8;
		maxTime = 500;
	} else if (level === 2 && score > 1500) {
		level = 3;
		multiplier = 2;
		maxTick = 6;
		maxTime = 360;
	} else if (level === 3 && score > 3500) {
		level = 4;
		multiplier = 3;
		maxTick = 4;
		maxTime = 300;
	}
}

function spawnSnake() {
	const col = Math.floor(Math.random() * 6) + 1;
	snake = [
		new Cell(new Vec(4, 0), col),
		new Cell(new Vec(4, -1), col),
		new Cell(new Vec(4, -2), col),
		new Cell(new Vec(4, -3), col),
	];
	dir = new Vec(0, 1);
	cDir = new Vec(0, 1);
	time = maxTime;
}

function spawnFood() {
	food = new Vec(0, 0);
	while (true) {
		food.x = Math.floor(Math.random() * boardSize.x);
		food.y = Math.floor(Math.random() * boardSize.y);
		if (board[food.y + 3][food.x] !== 0) {
			continue;
		}
		for (const cell of snake) {
			if (cell.pos.x === food.x && cell.pos.y === food.y) {
				continue;
			}
		}
		return;
	}
}

function createBoard() {
	board = [
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	];
}

function testForDeath() {
	if (board[3][4] === 1) {
		playing = false;
		setTimeout(() => {
			document.getElementById("menu").style.display = "block";
		}, 2000);
	}
}

document.onkeydown = function (e) {
	e = window.event || e;
	let key = e.keyCode;
	e.preventDefault();

	switch (key) {
		case 38: //up
			cDir.y = -1;
			cDir.x = 0;
			break;
		case 40: //down
			cDir.y = 1;
			cDir.x = 0;
			break;
		case 39: //right
			cDir.y = 0;
			cDir.x = 1;
			break;
		case 37: //left
			cDir.y = 0;
			cDir.x = -1;
			break;
	}
};

const fImg = new Image();
fImg.src = "./face.png";
const aImg = new Image();
aImg.src = "./apple.png";

document.onload = draw();
