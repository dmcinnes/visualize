var stats = new Stats();

var DIRECTION = Math.random() < 0.5 ? -1 : 1;

var TAU = Math.PI * 2;

var CLOUD_COUNT = 10;
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

// compare by highest point on the screen
var sortClouds = function () {
  clouds.sort(function (c1, c2) {
    return (c1.bounds.top + c1.y) - (c2.bounds.top + c2.y);
  });
};

// set the cloud speeds based on vertical position
var updateCloudSpeeds = function () {
  for (var i = 0; i < clouds.length; i++) {
    var cloud = clouds[i];
    cloud.velX = DIRECTION * (5 + 10 * (cloud.bounds.top + cloud.y)/height);
  }
};

var setupClouds = function () {
  for (var i = 0; i < CLOUD_COUNT; i++) {
    clouds.push(createCloud());
  }
  sortClouds();
  updateCloudSpeeds();
};

var addCloud = function () {
  var cloud = createCloud();
  if (DIRECTION < 0) {
    cloud.x = width - cloud.bounds.left;
  } else {
    cloud.x = -cloud.bounds.right;
  }
  clouds.push(cloud);
  // resort
  sortClouds();
  updateCloudSpeeds();
};

var createCloudCircle = function (x, y) {
  return {
    x: x,
    y: y,
    radius: (height / 5) + wiggle(height/5),
    points: []
  };
};

var generateTriangle = function () {
  var h = (height / 4) + wiggle(30);
  var base = (2 * height / 5) + wiggle(130);
  var top   = {x: 0, y: -h};
  var left  = {x: -base/2 + wiggle(base/5), y: 0};
  var right = {x: base + left.x, y: 0};
  // start on the right to match our line drawing starting point
  return [
    {
      start: right,
      end: left,
      distance: right.x - left.x,
      circles: []
    },
    {
      start: left,
      end: top,
      distance: Math.sqrt(left.x*left.x + h*h),
      circles: []
    },
    {
      start: top,
      end: right,
      distance: Math.sqrt(right.x*right.x + h*h),
      circles: []
    }
  ];
};

var generateCircles = function (legs) {
  var circles = [];
  var startCircle = createCloudCircle(legs[0].start.x, legs[0].start.y);
  circles.push(startCircle);

  for (var i = 0; i < legs.length; i++) {
    var leg = legs[i];
    var endCircle;
    leg.circles.push(startCircle);
    if (i == legs.length-1) {
      endCircle = legs[0].circles[0];
    } else {
      endCircle = createCloudCircle(leg.end.x, leg.end.y);
      circles.push(endCircle);
    }
    leg.circles.push(endCircle);
    var total = startCircle.radius + endCircle.radius;
    startCircle = endCircle;
    // add more if needed
    while (total < leg.distance * 2) {
      var x = 0;
      var y = 0;
      for (var j = 0; j < leg.circles.length; j++) {
        var legCircle = leg.circles[j];
        x += legCircle.x;
        y += legCircle.y;
      }
      x = x / leg.circles.length;
      y = y / leg.circles.length;
      var circle = createCloudCircle(x, y);
      circles.push(circle);
      leg.circles.push(circle);
      total += circle.radius;
    }
  }

  // make the first circle have the rightmost point
  var rightMostPoint = circles[0].x + circles[0].radius;
  for (var i = 1; i < circles.length; i++) {
    var candidate = circles[i].x + circles[i].radius;
    if (candidate > rightMostPoint) {
      circles[0].x += candidate - rightMostPoint + 1;
      rightMostPoint = circles[0].x + circles[0].radius;
    }
  }

  return circles;
};

var traceCircles = function (circles) {
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
        currentCircle.points.push({ x: x, y: y, cusp: true });
        points.push({ x: x + currentCircle.x, y: y + currentCircle.y, cusp: true });
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

  return points;
};

var createCloud = function () {
  var legs    = generateTriangle();
  var circles = generateCircles(legs);
  var points  = traceCircles(circles);

  var bounds = {
    top:    0,
    bottom: 0,
    left:   0,
    right:  0
  };

  // calculate bounding box
  for (var i = 0; i < points.length; i++) {
    bounds.top    = Math.min(bounds.top,    points[i].y);
    bounds.bottom = Math.max(bounds.bottom, points[i].y);
    bounds.left   = Math.min(bounds.left,   points[i].x);
    bounds.right  = Math.max(bounds.right,  points[i].x);
  }

  var x = Math.random() * width;
  var y = (Math.random() * (height - bounds.bottom - 10)) - bounds.top + 10;

  return {
    x:          x,
    y:          y,
    bounds:     bounds,
    circles:    circles,
    legs:       legs,
    points:     points,
    seed:       Math.round(Math.random() * 128)
  };
};

var cloudOutside = function (cloud) {
  var bounds = cloud.bounds;
  return (bounds.left   + cloud.x > width)  ||
         (bounds.right  + cloud.x < 0)      ||
         (bounds.top    + cloud.y > height) ||
         (bounds.bottom + cloud.y < 0);
};

var render = function () {
  stats.begin();
  context.clearRect(0, 0, width, height);

  var length = clouds.length;
  for (var i = 0; i < length; i++) {
    var cloud = clouds[i];
    context.save();
    context.translate(cloud.x, cloud.y);
    seed = cloud.seed;
    context.beginPath();
    var lastPoint = cloud.points[0];
    context.moveTo(lastPoint.x, lastPoint.y);
    for (var j = 1; j < cloud.points.length; j++) {
      var point = cloud.points[j];
      if (point.cusp) {
        continue;
      }
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
    context.fill();
    context.stroke();
    context.restore();
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
  for (var i = 0; i < clouds.length; i++) {
    var cloud = clouds[i];
    if (cloudOutside(cloud)) {
      clouds.splice(i, 1);
      i--;
      continue;
    }
    cloud.x += cloud.velX * delta / 1000;
  }
  if (clouds.length < CLOUD_COUNT) {
    addCloud();
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
  context.fillStyle = 'white';

  setupClouds();

  requestAnimationFrame(tick);
};
