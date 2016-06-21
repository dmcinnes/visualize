var stats = new Stats();

var MAX_THORN_SIZE = 100;
var TIME_BETWEEN_GROWTHS = 10;

var width, height;
var stop = false;

var Thorn = {
  bounds: function () {
    // memoize
    if (this._bounds) {
      return this._bounds;
    }
    var endX   = this.x + this.dirX;
    var endY   = this.y + this.dirY;
    var x      = Math.min(this.x, endX);
    var y      = Math.min(this.y, endY);
    var right  = Math.max(this.x, endX, 1);
    var bottom = Math.max(this.y, endY, 1);
    return this._bounds = {
      x:      x,
      y:      y,
      width:  right  - x,
      height: bottom - y,
      right:  right,
      bottom: bottom,
      dirX:   this.dirX,
      dirY:   this.dirY,
      thorn:  this
    };
  },
  grow: function () {
    this.size++
    this.points[4] = this.points[0] + (this.dirX * this.size);
    this.points[5] = this.points[1] + (this.dirY * this.size);
  }
};

var root = Object.assign({}, Thorn);
var growers = [root];
var leaves = [];
var thornList = [root];

var randomInt = function (max) {
  return Math.round(Math.random() * max);
};

var pointOutside = function (x, y) {
  return (x > width)  ||
         (x < 0)      ||
         (y > height) ||
         (y < 0);
};

var plantRoot = function () {
  var startX, startY, endX, endY;
  if (Math.random() < 0.5) {
    startY = Math.round(Math.random() * height);
    if (Math.random() < 0.5) {
      startX = 0;
      endY = startY - 10;
    } else {
      startX = width;
      endY = startY + 10;
    }
    endX = startX;
    root.dirX = (startX === 0) ? 1 : -1;
    root.dirY = 0;
  } else {
    startX = Math.round(Math.random() * width);
    if (Math.random() < 0.5) {
      startY = 0;
      endX = startX + 10;
    } else {
      startY = height;
      endX = startX - 10;
    }
    endY = startY;
    root.dirX = 0;
    root.dirY = (startY === 0) ? 1 : -1;
  }
  var points = [
    startX,
    startY,
    endX,
    endY,
    startX + root.dirX,
    startY + root.dirY
  ];
  root.points = points;
  root.size = 1;
};

var render = function () {
  stats.begin();
  context.clearRect(0, 0, width, height);

  for (var i = 0; i < thornList.length; i++) {
    var thorn = thornList[i];
    context.beginPath();
    context.moveTo(thorn.points[0], thorn.points[1]);
    for (var j = 2; j < thorn.points.length; j = j + 2) {
      context.lineTo(thorn.points[j], thorn.points[j + 1]);
    }
    context.closePath();
    context.fill();
  }

  stats.end();
};

var lastFrame, elapsed;
lastFrame = 0;

var tick = function (timestamp) {
  elapsed = timestamp - lastFrame;
  lastFrame = timestamp;
  step(elapsed);
  render();

  if (!stop) {
    requestAnimationFrame(tick);
  }
};

var timeSinceLastGrowth = 0;

var step = function (delta) {
  timeSinceLastGrowth += delta;

  if (timeSinceLastGrowth > TIME_BETWEEN_GROWTHS) {
    for (var i = 0; i < growers.length; i++) {
      var thorn = growers[i];
      if (thorn.size > MAX_THORN_SIZE) {
        growers.splice(i, 1);
        i--;
        leaves.push(thorn);
      } else {
        thorn.grow();
      }
    }

    if (leaves.length === 0) {
      return;
    }
    var leafChoice = randomInt(leaves.length-1);
    var node = leaves[leafChoice];
    var candidates = ['left', 'right'];
    var choice = randomInt(1);
    if (node[candidates[choice]]) {
      // already have that one choose the other
      choice = (choice + 1) % 2;
    }
    // add some wiggle to the normal of the thorn we're branching from
    var dirX =  node.dirY + ( (Math.random() * node.size/4) - (node.size/2) );
    var dirY = -node.dirX + ( (Math.random() * node.size/4) - (node.size/2) );
    var size = Math.sqrt(dirX * dirX + dirY * dirY);
    var unitNodeX = dirX/size;
    var unitNodeY = dirY/size;
    // flip for the 'right' node
    if (candidates[choice] === 'right') {
      var dot = node.dirX * unitNodeX + node.dirY * unitNodeY;
      unitNodeX = 2 * dot * unitNodeX - node.dirX;
      unitNodeY = 2 * dot * unitNodeY - node.dirY;
    }
    var centerX = (node.points[0] + node.points[2] + node.points[4]) / 3;
    var centerY = (node.points[1] + node.points[3] + node.points[5]) / 3;
    var startX = centerX + unitNodeX * ( (Math.random() * node.size/6) - (node.size/3) );
    var startY = centerY + unitNodeY * ( (Math.random() * node.size/6) - (node.size/3) );
    var points = [
      startX,
      startY,
      startX + unitNodeX * node.size * 0.10,
      startY + unitNodeY * node.size * 0.10,
      startX + unitNodeX,
      startY + unitNodeY
    ];
    var newNode = Object.assign({
      points:  points,
      dirX:    unitNodeX,
      dirY:    unitNodeY,
      size: 1
    }, Thorn);

    node[candidates[choice]] = newNode;
    thornList.push(newNode);

    if (pointTaken(startX + unitNodeX, startY + unitNodeY)) {
      if (node.left && node.right) {
        leaves.splice(leafChoice, 1);
      }
      return;
    }

    // only put this node in the leaves list if its end is in the window
    if (!pointOutside(newNode.x + newNode.dirX, newNode.y + newNode.dirY)) {
      growers.push(newNode);
    }
    // if this node is full, remove it from the leaf list
    if (node.left && node.right) {
      leaves.splice(leafChoice, 1);
    }
    // we have a new growth, reset the timer
    timeSinceLastGrowth = 0;
  }
};

var pointTaken = function (x, y) {
  var pixel = context.getImageData(x, y, 1, 1);
  return (pixel.data[3] > 0); // A part of RGBA
};

window.onload = function() {
  var canvas = document.getElementById('canvas');

  if (document.location.search === "?fps=1") {
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);
  }

  context = canvas.getContext('2d');
  context.canvas.width  = window.innerWidth;
  context.canvas.height = window.innerHeight;
  width  = context.canvas.width;
  height = context.canvas.height;

  plantRoot();

  requestAnimationFrame(tick);
};
