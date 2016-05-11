var stats = new Stats();

var ROOT_LENGTH = 100;
var TIME_BETWEEN_GROWTHS = 0;

var width, height, quadTree;
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

  normals: function () {
    if (this._normals) {
      return this._normals;
    }
    var points = this.points;
    var length1 = Math.sqrt(points[0] * points[0] + points[1] * points[1]);
    var length2 = Math.sqrt(points[2] * points[2] + points[3] * points[3]);
    var length3 = Math.sqrt(points[4] * points[4] + points[5] * points[5]);
    return this._normals = [
       points[1] / length1,
      -points[0] / length1,
       points[3] / length2,
      -points[2] / length2,
       points[5] / length3,
      -points[4] / length3
    ];
  }
};

var root = Object.assign({}, Thorn);
var leaves = [root];
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
      endY = startY - (ROOT_LENGTH / 10);
    } else {
      startX = width;
      endY = startY + (ROOT_LENGTH / 10);
    }
    endX = startX;
    root.dirX = (startX === 0) ? ROOT_LENGTH : -ROOT_LENGTH;
    root.dirY = 0;
  } else {
    startX = Math.round(Math.random() * width);
    if (Math.random() < 0.5) {
      startY = 0;
      endX = startX + (ROOT_LENGTH / 10);
    } else {
      startY = height;
      endX = startX - (ROOT_LENGTH / 10);
    }
    endY = startY;
    root.dirX = 0;
    root.dirY = (startY === 0) ? ROOT_LENGTH : -ROOT_LENGTH;
  }
  var points = [
    startX,
    startY,
    endX,
    endY,
    startX + root.dirX,
    startY + root.dirY
  ];
  root.centerX = (points[0] + points[2] + points[4]) / 3;
  root.centerY = (points[1] + points[3] + points[5]) / 3;
  root.points = points;
  root.length = ROOT_LENGTH;
  quadTree.insert(root.bounds());
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
    // var dirX =  node.dirY + (Math.random() * 10 - 5);
    // var dirY = -node.dirX + (Math.random() * 10 - 5);
    var dirX =  node.dirY * 0.8;
    var dirY = -node.dirX * 0.8;
    var unitNodeX = node.dirX/node.length;
    var unitNodeY = node.dirY/node.length;
    // flip for the 'right' node
    if (candidates[choice] === 'right') {
      var dot = dirX * unitNodeX + dirY * unitNodeY;
      dirX = 2 * dot * unitNodeX - dirX;
      dirY = 2 * dot * unitNodeY - dirY;
    }
    var startX = node.centerX; // + unitNodeX * (0.25 + Math.random() * node.length/2);
    var startY = node.centerY; // + unitNodeY * (0.25 + Math.random() * node.length/2);
    var points = [
      startX,
      startY,
      startX + unitNodeX * node.length * 0.10,
      startY + unitNodeY * node.length * 0.10,
      startX + dirX,
      startY + dirY
    ];
    var centerX = (points[0] + points[2] + points[4]) / 3;
    var centerY = (points[1] + points[3] + points[5]) / 3;
    var newNode = Object.assign({
      points:  points,
      centerX: centerX,
      centerY: centerY,
      dirX:   dirX,
      dirY:   dirY,
      length: Math.sqrt(dirX*dirX + dirY*dirY)
    }, Thorn);

    var currentNodeBounds = node.bounds();
    var possibleCollisions = quadTree.retrieve(newNode.bounds());
    var bounds = newNode.bounds();
    for (var i = 0; i < possibleCollisions.length; i++) {
      var candidateThorn = possibleCollisions[i].thorn;
      if (candidateThorn === node ||
          candidateThorn === node.left ||
          candidateThorn === node.right) {
        // ignore the existing thorns from where we're branching, we're definitely going to
        // collide with those
        continue;
      }
      if (checkCollision(newNode, candidateThorn)) {
        node[candidates[choice]] = -1; // mark as not available
        // if this node is full, remove it from the leaf list
        if (node.left && node.right) {
          leaves.splice(leafChoice, 1);
        }
        return; // skip this node
      }
    }

    quadTree.insert(bounds);
    node[candidates[choice]] = newNode;
    thornList.push(newNode);

    // only put this node in the leaves list if its end is in the window
    if (!pointOutside(newNode.x + newNode.dirX, newNode.y + newNode.dirY)) {
      leaves.push(newNode);
    }
    // if this node is full, remove it from the leaf list
    if (node.left && node.right) {
      leaves.splice(leafChoice, 1);
    }
    // we have a new growth, reset the timer
    timeSinceLastGrowth = 0;
  }
};

var lineProjection = function (normalX, normalY, points) {
  var min, max, count, dot;

  min = Number.MAX_VALUE;
  max = -Number.MAX_VALUE;
  count = points.length;
  for (var j = 0; j < count; j = j + 2) {
    var dot = normalX * points[j] + normalY * points[j + 1];
    if (dot < min) {
      min = dot;
    }
    if (dot > max) {
      max = dot;
    }
  }
  return {
    min: min,
    max: max
  };
};

// using Separating Axis Theorem
var checkCollision = function (objA, objB) {
  var normals = objA.normals().concat(objB.normals());

  for (i = 0; i < normals.length; i = i + 2) {
    var we   = lineProjection(normals[i], normals[i + 1], objA.points);
    var they = lineProjection(normals[i], normals[i + 1], objB.points);

    if (we.max < they.min || we.min > they.max) {
      return false; // no collision!
    }
  }
  return true;
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

  quadTree = new Quadtree({
    x: 0,
    y: 0,
    width:  width,
    height: height
  });

  plantRoot();

  requestAnimationFrame(tick);
};
