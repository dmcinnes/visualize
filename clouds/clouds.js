var stats = new Stats();

var TAU = Math.PI * 2;

var context;
var width, height;

var clouds = [];

var setupClumps = function () {
  var circles = [];
  circles.push({
    x: 800,
    y: 400,
    radius: 300,
    points: []
  });
  circles.push({
    x: 400,
    y: 500,
    radius: 200,
    points: []
  });
  circles.push({
    x: 600,
    y: 300,
    radius: 250,
    points: []
  });
  var cuspPoints = [];
  var points = [];
  var start = 0;
  var currentCircle = circles[0];
  var segments = currentCircle.radius / 5;
  var increment = TAU / segments;
  for (var i = 0; i < segments; i++) {
    var x = Math.cos(i * increment) * currentCircle.radius;
    var y = Math.sin(i * increment) * currentCircle.radius;
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
    points:     points
  });
};

var render = function () {
  stats.begin();
  context.clearRect(0, 0, width, height);

  context.fillStyle = 'blue';
  var length = clouds.length;
  for (var i = 0; i < length; i++) {
    var cloud = clouds[i];
    context.beginPath();
    var point = cloud.points[0];
    context.moveTo(point.x, point.y);
    for (var j = 1; j < cloud.points.length; j++) {
      point = cloud.points[j];
      context.lineTo(point.x, point.y);
      context.fillRect(point.x - 1, point.y - 1, 2, 2);
    }
    context.closePath();
    context.stroke();
    for (var j = 0; j < cloud.cuspPoints.length; j++) {
      point = cloud.cuspPoints[j];
      context.fillStyle = 'green';
      context.fillRect(point.x - 2, point.y - 2, 5, 5);
    }
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

  setupClumps();

  requestAnimationFrame(tick);
};
