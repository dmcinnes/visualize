var stats = new Stats();

var TAU = Math.PI * 2;

// how much to wiggle the points around
var POINT_WIGGLE = 10;
// how much to wiggle the curves around
var WIGGLE = 10;

// the length of the segment in relation to the circle's radius
var SEGMENT_FACTOR = 3;

var context;
var width, height;

var clouds = [];

// A simple Linear Congruential Generator

// Establish the parameters of the generator
var m = 25;
// a - 1 should be divisible by m's prime factors
var a = 11;
// c and m should be co-prime
var c = 17;
// Setting the seed
var seed = 3;

var rand = function() {
  // define the recurrence relationship
  seed = (a * seed + c) % m;
  // return float in (0, 1)
  return seed / m;
};

var wiggle = function (size) {
  return Math.random() * size - size/2;
};

var setupClouds = function () {
  for (var i = 0; i < 5; i++) {
    createCloud();
  }
};

var createCloud = function () {
  var circles = [];
  circles.push({
    x: 0,
    y: 0,
    radius: 180 + Math.random() * 10,
    points: []
  });
  var nextX = -circles[0].radius - Math.random() * 20;
  circles.push({
    x: nextX,
    y: 0,
    radius: 140 + Math.random() * 10,
    points: []
  });
  circles.push({
    x: nextX / 2,
    y: - (150 - Math.round(Math.random() * 50)),
    radius: 100 + Math.random() * 10 - 5,
    points: []
  });
  var scale = 0.8 + Math.random();
  for (var i = 0; i < circles.length; i++) {
    var circle = circles[i];
    circle.x      *= scale;
    circle.y      *= scale;
    circle.radius *= scale;
  }
  var cuspPoints = [];
  var points = [];
  var start = 0;
  var currentCircle = circles[0];
  var segments = currentCircle.radius / SEGMENT_FACTOR;
  var increment = TAU / segments;
  var i = 0;
  // do until we're back on the first circle and run out of segments
  while (i < segments || currentCircle != circles[0]) {
    var x = Math.cos(i * increment) * currentCircle.radius + wiggle(POINT_WIGGLE);
    var y = Math.sin(i * increment) * currentCircle.radius + wiggle(POINT_WIGGLE);
    var outside = true;
    for (var j = 0; j < circles.length; j++) {
      var candidate = circles[j];
      if (candidate === currentCircle) {
        continue;
      }
      var translateX = currentCircle.x + x - candidate.x;
      var translateY = currentCircle.y + y - candidate.y;
      var dist = Math.sqrt(translateX * translateX + translateY * translateY);
      if (dist < candidate.radius) {
        cuspPoints.push({ x: x + currentCircle.x, y: y + currentCircle.y });
        // points.push({ x: x + currentCircle.x, y: y + currentCircle.y });
        currentCircle = candidate;
        segments = currentCircle.radius / SEGMENT_FACTOR;
        increment = TAU / segments;
        i = Math.round(segments * Math.atan2(translateY, translateX) / TAU);
        if (i < 0) {
          i = segments + i;
        }
        outside = false;
        break;
      }
    }
    if (outside) {
      currentCircle.points.push({ x: x, y: y });
      points.push({ x: x + currentCircle.x, y: y + currentCircle.y });
    }
    i++;
  }
  clouds.push({
    x:          Math.random() * width,
    y:          height - Math.max(circles[0].radius, circles[1].radius) - 50,
    circles:    circles,
    cuspPoints: cuspPoints,
    points:     points,
    seed:       Math.round(Math.random() * 128)
  });
};

var render = function () {
  stats.begin();
  context.clearRect(0, 0, width, height);

  context.fillStyle = 'blue';
  var length = clouds.length;
  for (var i = 0; i < length; i++) {
    var cloud = clouds[i];
    context.save();
    context.translate(cloud.x, cloud.y);
    context.fillStyle = 'white';
    for (var j = 0; j < cloud.circles.length; j++) {
      var circle = cloud.circles[j];
      context.beginPath();
      context.arc(circle.x, circle.y, circle.radius, 0, TAU);
      context.fill();
    }
    seed = cloud.seed;
    context.beginPath();
    var lastPoint = cloud.points[0];
    context.moveTo(lastPoint.x, lastPoint.y);
    for (var j = 1; j < cloud.points.length; j++) {
      var point = cloud.points[j];
      var midpointX = (point.x + lastPoint.x)/2;
      var midpointY = (point.y + lastPoint.y)/2;
      context.bezierCurveTo(
        midpointX + (rand() * WIGGLE - WIGGLE/2), midpointY + (rand() * WIGGLE - WIGGLE/2),
        midpointX + (rand() * WIGGLE - WIGGLE/2), midpointY + (rand() * WIGGLE - WIGGLE/2),
        point.x, point.y);
      lastPoint = point;
    }
    point = cloud.points[0];
    midpointX = (point.x + lastPoint.x)/2;
    midpointY = (point.y + lastPoint.y)/2;
    context.bezierCurveTo(
      midpointX + (rand() * WIGGLE - WIGGLE/2), midpointY + (rand() * WIGGLE - WIGGLE/2),
      midpointX + (rand() * WIGGLE - WIGGLE/2), midpointY + (rand() * WIGGLE - WIGGLE/2),
      point.x, point.y);
    context.stroke();
    context.restore();
    // for (var j = 0; j < cloud.cuspPoints.length; j++) {
    //   point = cloud.cuspPoints[j];
    //   context.fillStyle = 'green';
    //   context.fillRect(point.x - 2, point.y - 2, 5, 5);
    // }
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

  requestAnimationFrame(tick);
};

var step = function (delta) {
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

  setupClouds();

  requestAnimationFrame(tick);
};
