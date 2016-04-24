var stats = new Stats();

var maxForceDistance = 350;
var FORCE_SCALE = 0.001;

var context;
var width, height, boundingBox, centerX, centerY, mouseX, mouseY;
var colorPosition = 0;
var nextColor = 0;

var voronoi = new Voronoi();
var diagram;
var points = [];

var randomNumber = function(max) {
  return Math.round(Math.random() * max);
};

var outsideWindow = function (point) {
  return (point.x < (boundingBox.xl - maxForceDistance) ||
          point.y < (boundingBox.yt - maxForceDistance) ||
          point.x > (boundingBox.xr + maxForceDistance) ||
          point.y > (boundingBox.yb + maxForceDistance));
};

var setupPoints = function () {
  for (var i = 0; i < 20; i++) {
    points.push({
      x:        randomNumber(width),
      y:        randomNumber(height),
      forceX:   0,
      forceY:   0,
      strength: randomNumber(16) + 1,
      color:    Math.round(colorPosition + randomNumber(10)) % 256
    });
  }
};

var setupMouse = function () {
  document.onmousemove = function (event) {
    mouseX = event.pageX;
    mouseY = event.pageY;
  }
};

var addNewPoint = function () {
  if (points.length < 100) {
    var spawnPoint = closestPointTo(mouseX, mouseY);
    points.push({
      x:        spawnPoint.x + (Math.random() * 2) - 1,
      y:        spawnPoint.y + (Math.random() * 2) - 1,
      forceX:   0,
      forceY:   0,
      strength: randomNumber(16) + 1,
      color:    Math.round(colorPosition + randomNumber(10)) % 256
    });
  }
};

var closestPointTo = function (pointX, pointY) {
  var minPoint = points[0];
  var minDist  = Number.MAX_VALUE;
  var totalPoints = points.length;
  for (var i = 0; i < totalPoints; i++) {
    var candidate = Math.sqrt(Math.pow(pointX - points[i].x, 2) + Math.pow(pointY - points[i].y, 2));
    if (candidate === Math.min(candidate, minDist)) {
      minDist = candidate;
      minPoint = points[i];
    }
  }
  return minPoint;
};

var render = function () {
  var i, j, length, cell, halfedgesLength, hue, edge, value;
  stats.begin();
  context.clearRect(0, 0, width, height);

  length = diagram.cells.length;

  for (i = 0; i < length; i++) {
    cell = diagram.cells[i];
    // if (cell.site.mouse) {
    //   context.fillStyle = "hsl(120, 100%, 60%)";
    // } else {
      // var value = 20 + Math.min(60, cell.site.strength);
      context.fillStyle = "hsl("+cell.site.color+", 100%, 50%)";
    // }
    // var hue = 255 - Math.min(254, cell.site.strength*15);
    // context.fillStyle = "hsl("+hue+", 100%, 60%)";
    halfedgesLength = cell.halfedges.length;
    if (halfedgesLength === 0) {
      continue;
    }
    context.beginPath();
    edge = cell.halfedges[0];
    var start = edge.getStartpoint();
    context.moveTo(start.x, start.y);
    for (j = 1; j < halfedgesLength; j++) {
      edge = cell.halfedges[j];
      var start = edge.getStartpoint();
      context.lineTo(start.x, start.y);
    }
    context.fill();
  }

  // draw the lines
  // context.lineWidth = 20;
  // context.strokeStyle = "black";
  // for (i = 0; i < length; i++) {
  //   cell = diagram.cells[i];
  //   halfedgesLength = cell.halfedges.length;
  //   for (j = 0; j < halfedgesLength; j++) {
  //     edge = cell.halfedges[j].edge;
  //     context.beginPath();
  //     context.moveTo(edge.va.x, edge.va.y);
  //     context.lineTo(edge.vb.x, edge.vb.y);
  //     context.stroke();
  //   }
  // }

  stats.end();
};

var lastFrame, elapsed;
lastFrame = 0;

var tick = function (timestamp) {
  elapsed = timestamp - lastFrame;
  lastFrame = timestamp;
  step(elapsed);
  render();

  requestAnimationFrame(tick);
};

var step = function (delta) {
  if (Math.abs(colorPosition - nextColor) < 2) {
    nextColor = randomNumber(255);
  } else if (colorPosition < nextColor) {
    colorPosition = (colorPosition + (delta/100)) % 256;
  } else {
    colorPosition = (colorPosition - (delta/100)) % 256;
  }

  for (var i = 0; i < points.length; i++) {
    var point = points[i];
    point.mouse = false;
    if (outsideWindow(point)) {
      // remove the point
      points.splice(i, 1);
      i--;
      continue;
    }
  }
  var length = points.length;
  if (length === 0) {
    return;
  }

  if (mouseX) {
    var mousePoint = closestPointTo(mouseX, mouseY);
    mousePoint.mouse = true;
  }

  for (var i = 0; i < length-1; i++) {
    var p1 = points[i];
    for (var j = i + 1; j < length; j++) {
      var p2 = points[j];
      var repelX = p2.x - p1.x;
      var repelY = p2.y - p1.y;
      var mag = Math.sqrt(repelX * repelX + repelY * repelY);
      var force = maxForceDistance - mag;
      if (force > 0) {
        var combinedStrength = p1.strength + p2.strength;
        repelX = FORCE_SCALE * force * combinedStrength * (repelX / mag);
        repelY = FORCE_SCALE * force * combinedStrength * (repelY / mag);
        p1.forceX -= repelX;
        p1.forceY -= repelY;
        p2.forceX += repelX;
        p2.forceY += repelY;
      }
    }
  }

  for (i = 0; i < points.length; i++) {
    var point = points[i];
    point.x += point.forceX;
    point.y += point.forceY;
    point.forceX = 0;
    point.forceY = 0;
  }

  generateDiagram();
};

var generateDiagram = function () {
  try {
    if (diagram) {
      voronoi.recycle(diagram);
    }
    diagram = voronoi.compute(points, boundingBox);
  }
  catch(e) {
    // ignore!
    // ran into this problem: https://github.com/gorhill/Javascript-Voronoi/issues/27
    console.log(e);
    // attempt to fix by expanding the bounding box
    boundingBox.xr += 1;
    boundingBox.yb += 1;
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
  mouseX = centerX = width / 2;
  mouseY = centerY = height / 2;

  boundingBox = {xl: 0, xr: width, yt: 0, yb: height};

  setupPoints();
  setupMouse();

  requestAnimationFrame(tick);

  window.setInterval(addNewPoint, 50);
};
