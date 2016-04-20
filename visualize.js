var stats = new Stats();

var context;

var WAVE_COUNT = 20;

var TAU = 2 * Math.PI

var waves = [];

var Wave = {
  calc: function (theta) {
    return Math.sin((theta / (TAU * this.frequency)) - this.phase);
  }
};

for (var i = 0; i < WAVE_COUNT; i++) {
  waves.push(
    Object.assign({
      amplitude: Math.random() * 100 + 50,
      phase:     Math.random() * TAU,
      phaseVel:  Math.random() * 2 - 1,
      offset:    Math.random() * 400 - 200,
      frequency: 10
    }, Wave)
  );
}

var render = function () {
  stats.begin();
  var width  = context.canvas.width;
  var height = context.canvas.height;
  var halfHeight = height / 2;
  context.clearRect(0, 0, width, height);
  for (var i = 0; i < WAVE_COUNT; i++) {
    var wave = waves[i];
    context.beginPath();
    var y = halfHeight - wave.calc(x) * wave.amplitude + wave.offset;
    context.moveTo(0, y);
    for (var x = 1; x < width; x++) {
      y = halfHeight - wave.calc(x) * wave.amplitude + wave.offset;
      context.lineTo(x, y);
    }
    context.stroke();
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
    wave.amplitude = wave.amplitude + (nextWave.calc(wave.amplitude) / TAU);
  }
};

window.onload = function() {
  var canvas = document.getElementById('canvas');

  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  context = canvas.getContext('2d');
  context.canvas.width  = window.innerWidth;
  context.canvas.height = window.innerHeight;
  context.strokeStyle = 'lightgray';
  context.lineWidth = 3;

  requestAnimationFrame(tick);
};
