var stats = new Stats();

var ROOT_LENGTH = 20;
var TIME_BETWEEN_GROWTHS = 20;

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
      bottom: bottom
    };
  }
};

var root = Object.assign({}, Thorn);
var leaves = [root];

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
  if (Math.random() < 0.5) {
    root.x = (Math.random() < 0.5) ? 0 : width;
    root.y = Math.round(Math.random() * height);
    root.dirX = (root.x === 0) ? ROOT_LENGTH : -ROOT_LENGTH;
    root.dirY = 0;
  } else {
    root.x = Math.round(Math.random() * width);
    root.y = (Math.random() < 0.5) ? 0 : height;
    root.dirX = 0;
    root.dirY = (root.y === 0) ? ROOT_LENGTH : -ROOT_LENGTH;
  }
  quadTree.insert(root.bounds());
};

var renderSubTree = function (node) {
  context.moveTo(node.x, node.y);
  context.lineTo(node.x + node.dirX, node.y + node.dirY);
  if (node.left) {
    renderSubTree(node.left);
  }
  if (node.right) {
    renderSubTree(node.right);
  }
};

var render = function () {
  stats.begin();
  context.clearRect(0, 0, width, height);

  renderSubTree(root);
  context.stroke();

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
    var newNode = Object.assign({
      x:     node.x + node.dirX / 2,
      y:     node.y + node.dirY / 2,
      dirX:  node.dirY + (Math.random() * 10 - 5),
      dirY: -node.dirX + (Math.random() * 10 - 5)
    }, Thorn);
    // flip for the right node
    if (candidates[choice] === 'right') {
      newNode.dirX = -newNode.dirX;
      newNode.dirY = -newNode.dirY;
    }

    var currentNodeBounds = node.bounds();
    var possibleCollisions = quadTree.retrieve(newNode.bounds());
    var bounds = newNode.bounds();
    for (var i = 0; i < possibleCollisions.length; i++) {
      var thorn = possibleCollisions[i];
      if (thorn === currentNodeBounds) {
        // ignore the thorn we're branching off of, we're definitely going to
        // collide with that
        continue;
      }
      if ((thorn.right - bounds.x > 0)  && (bounds.right - thorn.x > 0) &&
          (thorn.bottom - bounds.y > 0) && (bounds.bottom - thorn.y > 0)) {
        // collision!
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