var stats = new Stats();

var TAU = Math.PI * 2;
var WIGGLE = 10;

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

var constrainCircle = function (circle) {
  if (circle.x - circle.radius < 0) {
    circle.x = circle.radius;
  } else if (circle.x + circle.radius > width) {
    circle.x = width - circle.radius;
  }
  if (circle.y - circle.radius < 0) {
    circle.y = circle.radius;
  } else if (circle.y + circle.radius > height) {
    circle.y = height - circle.radius;
  }
  return circle;
};

var setupClouds = function () {
  var circles = [];
  var startX = 2 * (width / 3);
  var startY = height / 2;
  // var startRad = 100 + (Math.random() * height)/4;
  var startRad = 300;
  if (startRad > height/2) {
    startRad = height/2 - 20;
  }
  var circle = {
    x: startX,
    y: startY,
    radius: startRad,
    points: []
  };
  circles.push(constrainCircle(circle));
  // var count = Math.round(Math.random() * 4 + 3)
  // for (var i = 0; i < count; i++) {
  //   circle = {
  //     x: Math.cos(Math.random() * TAU) * startRad + startX,
  //     y: Math.sin(Math.random() * TAU) * startRad + startY,
  //     radius: 100 + (Math.random() * height)/2,
  //     points: []
  //   };
  //   circles.push(constrainCircle(circle));
  // }
  circles.push({
    x: 600,
    y: 500,
    radius: 250,
    points: []
  });
  circles.push({
    x: 700,
    y: 200,
    radius: 180,
    points: []
  });
  var cuspPoints = [];
  var points = [];
  var start = 0;
  var currentCircle = circles[0];
  var segments = currentCircle.radius / 5;
  var increment = TAU / segments;
  for (var i = 0; i < segments; i++) {
    var x = Math.cos(i * increment) * currentCircle.radius + (Math.random() * WIGGLE - WIGGLE/2);
    var y = Math.sin(i * increment) * currentCircle.radius + (Math.random() * WIGGLE - WIGGLE/2);
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
        segments = currentCircle.radius / 5;
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
  }
  clouds.push({
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
    context.scale(0.6, 0.6);
    seed = cloud.seed;
    context.beginPath();
    var lastPoint = cloud.points[0];
    context.moveTo(lastPoint.x, lastPoint.y);
    for (var j = 1; j < cloud.points.length; j++) {
      var point = cloud.points[j];
      var midpointX = (point.x + lastPoint.x)/2;
      var midpointY = (point.y + lastPoint.y)/2;
      context.bezierCurveTo(
        midpointX + (rand() * 40 - 20), midpointY + (rand() * 40 - 20),
        midpointX + (rand() * 40 - 20), midpointY + (rand() * 40 - 20),
        point.x + (rand() * 10 - 5), point.y + (rand() * 10 - 5));
      context.moveTo(point.x, point.y);
      // context.fillRect(point.x - 1, point.y - 1, 2, 2);
      lastPoint = point;
    }
    point = cloud.points[0];
    midpointX = (point.x + lastPoint.x)/2;
    midpointY = (point.y + lastPoint.y)/2;
    context.bezierCurveTo(
      midpointX + (rand() * 20 - 10), midpointY + (rand() * 20 - 10),
      midpointX + (rand() * 20 - 10), midpointY + (rand() * 20 - 10),
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
