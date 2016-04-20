var stats = new Stats();

var context;
var width, height, centerHeight;

var WAVE_COUNT = 20;

var TAU = 2 * Math.PI

var waves = [];

var clamp = function (value, min, max) {
  if (value > max) {
    return max;
  } else if (value < min) {
    return min;
  } else {
    return value;
  }
};

var Wave = {
  calc: function (theta) {
    return Math.sin((theta / (TAU * this.frequency)) + this.phase);
  }
};

var generateWaves = function () {
  for (var i = 0; i < WAVE_COUNT; i++) {
    waves.push(
      Object.assign({
        amplitude: Math.random() * 100 + 50,
        phase:     Math.random() * TAU,
        phaseVel:  Math.random() * 2 - 1,
        offset:    (Math.random() * height) - (height/2),
        frequency: Math.random() * 20 + 10
      }, Wave)
    );
  }
  // sort so we render the back ones first
  waves.sort(function (a, b) {
    if (a.offset < b.offset) {
      return 1;
    } else if (a.offset > b.offset) {
      return -1;
    } else {
      return 0;
    }
  });
};

var render = function () {
  stats.begin();
  context.clearRect(0, 0, width, height);
  for (var i = 0; i < WAVE_COUNT; i++) {
    var wave = waves[i];
    var offset = centerHeight - wave.offset;
    context.beginPath();
    var y = wave.calc(x) * wave.amplitude + offset;
    context.moveTo(0, y);
    for (var x = 1; x < width; x++) {
      y = wave.calc(x) * wave.amplitude + offset;
      context.lineTo(x, y);
    }
    // context.strokeStyle = 'lightgray';
    // context.stroke();
    context.lineTo(x, height);
    context.lineTo(0, height);
    var value = 20 + Math.round(30 * offset / height);
    context.fillStyle = "hsl(255, 100%, "+value+"%)";
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

  requestAnimationFrame(tick);
};

var step = function (delta) {
  for (var i = 0; i < WAVE_COUNT; i++) {
    var wave = waves[i];
    var nextWave = waves[i + 1] || waves[0]; // wrap
    wave.phase = (wave.phase + (wave.phaseVel * delta/2000)) % TAU;
    wave.amplitude = 50 + nextWave.calc(wave.amplitude) * 5;
  }
};

window.onload = function() {
  var canvas = document.getElementById('canvas');

  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  context = canvas.getContext('2d');
  context.canvas.width  = window.innerWidth;
  context.canvas.height = window.innerHeight;
  width  = context.canvas.width;
  height = context.canvas.height;
  centerHeight = height / 2;
  context.lineWidth = 3;

  generateWaves();

  requestAnimationFrame(tick);
};
