/**
 * This game was developed by a llama :D
 * Audio effects from https://gamebanana.com/sounds/download/44751
 */

// Initialize canvas
const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

// Import pictures
const background = new Image();
background.src = "tetris-llama.png";
const skyBlock = new Image();
skyBlock.src = "sky-block.png";
const blueBlock = new Image();
blueBlock.src = "blue-block.png";
const orangeBlock = new Image();
orangeBlock.src = "orange-block.png";
const yellowBlock = new Image();
yellowBlock.src = "yellow-block.png";
const greenBlock = new Image();
greenBlock.src = "green-block.png";
const purpleBlock = new Image();
purpleBlock.src = "purple-block.png";
const redBlock = new Image();
redBlock.src = "red-block.png";

// Some constants
const scale = 20; // lol everything is scaled by 20
const shapes = "IJLOSTZ";
const blocks = [
  skyBlock,
  blueBlock,
  orangeBlock,
  yellowBlock,
  greenBlock,
  purpleBlock,
  redBlock
];

// Paused state
let gamePaused = true;

// Music, for the background and all
class Music {
  constructor(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
  }
  play = () => {
    this.sound.play();
  };
  pause = () => {
    this.sound.pause();
  };
  setVolume = n => {
    this.sound.volume = n;
  };
}

// Import music
const theme = new Music("theme.mp3");
theme.setVolume(0.8);
const sfx_move = new Music("move.wav");
const sfx_pause = new Music("pause.wav");
const sfx_drop = new Music("harddrop.wav");
const sfx_rotate = new Music("rotate.wav");
const sfx_collide = new Music("linefall.wav");
sfx_collide.setVolume(0.8);
const sfx_clear1 = new Music("erase1.wav");
const sfx_clear2 = new Music("erase2.wav");
const sfx_clear3 = new Music("erase3.wav");
const sfx_clear4 = new Music("erase4.wav");

// Tetrominos
const IBlock = [
  [0, 1, 0, 0],
  [0, 1, 0, 0],
  [0, 1, 0, 0],
  [0, 1, 0, 0]
];

const JBlock = [
  [0, 2, 0],
  [0, 2, 0],
  [2, 2, 0]
];

const LBlock = [
  [0, 3, 0],
  [0, 3, 0],
  [0, 3, 3]
];

const OBlock = [
  [4, 4],
  [4, 4]
];

const SBlock = [
  [0, 5, 5],
  [5, 5, 0],
  [0, 0, 0]
];

const TBlock = [
  [0, 0, 0],
  [6, 6, 6],
  [0, 6, 0]
];

const ZBlock = [
  [7, 7, 0],
  [0, 7, 7],
  [0, 0, 0]
];

class Tetromino {
  constructor(x, y, shape, block) {
    this.x = x;
    this.y = y;
    this.shape = shape;
    this.block = block;
  }

  draw(offsetX, offsetY) {
    this.shape.forEach((row, y) => {
      row.forEach((block, x) => {
        if (block) {
          ctx.drawImage(this.block, scale * x + offsetX, scale * y + offsetY);
        }
      });
    });
  }

  move(x) {
    sfx_move.play();
    this.x += x;
    if (collidesWith(stage, this)) {
      this.x -= x;
    }
    this.draw(this.x, this.y);
  }

  rotate() {
    // Rotate matrix - transpose + reverse
    this.shape = this.shape.map((col, y) =>
      this.shape.map(row => row[y]).reverse()
    );
    // Check for collision (can't rotate outside game screen)
    for (let i = 0; i < this.shape.length; i++) {
      if (collidesWith(stage, this)) {
        this.x += 20;
        if (collidesWith(stage, this)) this.x -= 40;
      }
    }
    this.draw(this.x, this.y);
  }

  newShape() {
    let shape = shapes[Math.floor(shapes.length * Math.random())];
    switch (shape) {
      case "I":
        this.shape = IBlock;
        this.block = skyBlock;
        break;
      case "J":
        this.shape = JBlock;
        this.block = blueBlock;
        break;
      case "L":
        this.shape = LBlock;
        this.block = orangeBlock;
        break;
      case "O":
        this.shape = OBlock;
        this.block = yellowBlock;
        break;
      case "S":
        this.shape = SBlock;
        this.block = greenBlock;
        break;
      case "T":
        this.shape = TBlock;
        this.block = purpleBlock;
        break;
      case "Z":
        this.shape = ZBlock;
        this.block = redBlock;
      default:
        break;
    }
  }
}

// Game stage
class Stage {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.arr = [];
    this.score = 0;
  }

  createStage() {
    for (let i = 0; i < this.h; i++) this.arr.push(new Array(this.w).fill(0));
  }

  draw() {
    this.arr.forEach((row, y) => {
      row.forEach((block, x) => {
        if (block) {
          ctx.drawImage(blocks[block - 1], scale * x, scale * y);
        }
      });
    });
  }

  clear() {
    let count = 1;
    outer: for (let y = this.arr.length - 1; y > 0; y--) {
      for (let x = 0; x < this.arr[y].length; x++) {
        if (!this.arr[y][x]) continue outer;
      }
      const row = this.arr.splice(y, 1)[0].fill(0);
      this.arr.unshift(row);
      this.score += count * 10;
      document.querySelector("#gameScore").innerHTML = this.score;
      count *= 2;
      y++;

      switch (count) {
        case 1:
          sfx_clear1.play();
          break;
        case 2:
          sfx_clear2.play();
          break;
        case 3:
          sfx_clear3.play();
          break;
        default:
          sfx_clear4.play();
          break;
      }
    }
    console.log("Score:", this.score);
  }
}

// Detect collisions
const collidesWith = (stage, t) => {
  for (let y = 0; y < t.shape.length; y++) {
    for (let x = 0; x < t.shape[y].length; x++) {
      if (
        t.shape[y][x] &&
        (stage.arr[y + t.y / scale] &&
          stage.arr[y + t.y / scale][x + t.x / scale]) !== 0
      ) {
        sfx_collide.play();
        return true;
      }
    }
  }
  return false;
};

// Collided pieces become part of stage
const mergeToStage = (stage, t) => {
  t.shape.forEach((row, y) => {
    row.forEach((block, x) => {
      if (block) stage.arr[y + t.y / 20][x + t.x / 20] = block;
    });
  });
};

// Render stage and tetromino
const draw = () => {
  ctx.drawImage(background, 0, 0);
  stage.draw();
  t.draw(t.x, t.y);
};

// Game over
const gameOver = () => {
  window.alert("Game over!");
  stage.arr.forEach(row => row.fill(0));
  t.x = 100;
  t.y = 0;
  t.newShape();
  stage.score = 0;
};

// Game timer
const update = (time = 0) => {
  const elapsedTime = time - latestTime;
  latestTime = time;

  // Drop
  dropCounter += elapsedTime;
  if (dropCounter > 1000) {
    t.y += scale;

    // Collisions
    if (collidesWith(stage, t)) {
      t.y -= scale;
      mergeToStage(stage, t);

      // On collision, check if any rows are complete
      stage.clear();

      // On collision, respawn and change to random shape
      t.y = 0;
      t.newShape();

      // Spawned tetromino should be within bounds
      for (let i = 0; i < t.shape.length; i++) {
        if (collidesWith(stage, t)) {
          t.x += 20;
          if (collidesWith(stage, t)) t.x -= 40;
        } else break;
      }

      // Game over if there's nowhere to spawn
      if (collidesWith(stage, t)) gameOver();
    }
    dropCounter = 0;
    if (gamePaused) {
      t.y -= scale;
    }
  }

  draw();
  requestAnimationFrame(update);
};

// Controls
document.addEventListener("keydown", e => {
  console.log(e.keyCode);
  switch (e.keyCode) {
    case 37:
      if (gamePaused) break;
      t.move(-scale);
      break;
    case 39:
      if (gamePaused) break;
      t.move(scale);
      break;
    case 40:
      if (gamePaused) break;
      t.y += scale;
      if (collidesWith(stage, t)) t.y -= scale;
      break;
    case 32:
      if (gamePaused) break;
      sfx_drop.play();
      let dummy_t = new Tetromino(t.x, t.y, t.shape, blueBlock);
      while (true) {
        dummy_t.y += 20;
        if (collidesWith(stage, dummy_t)) {
          t.y = dummy_t.y - 20;
          break;
        }
      }
      break;
    case 16:
      if (gamePaused) break;
      sfx_rotate.play();
      t.rotate();
      break;
    case 113:
      sfx_pause.play();
      gamePaused = !gamePaused;
      if (!gamePaused) theme.play();
      else theme.pause();
      document.querySelector("#gamePaused").innerHTML = gamePaused
        ? "GAME PAUSED"
        : "LET'S PLAY";
      break;
    case 115:
      gameOver();
      break;
    default:
      break;
  }
});

// Start
const t = new Tetromino(100, 0);
t.newShape();
const stage = new Stage(12, 20);
stage.createStage();
let dropCounter = 0;
let latestTime = 0;
update();
