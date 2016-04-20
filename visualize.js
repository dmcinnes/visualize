var stats = new Stats();

var context;
var offset = 0;

var TAU = 2 * Math.PI

var waves = [];

var Wave = {
  calc: function (theta) {
    return Math.sin((theta / (TAU * this.frequency)) - this.phase) * this.amplitude;
  }
};

for (var i = 0; i < 10; i++) {
  waves.push(
    Object.assign({
      amplitude: Math.random() * 100 + 50,
      phase:     Math.random() * TAU,
      offset:    Math.random() * 400 - 200,
      frequency: 10
    }, Wave)
  );
}

var render = function () {
  stats.begin();
  var width = context.canvas.width;
  var height = context.canvas.height;
  context.clearRect(0, 0, width, height);
  for (var i = 0; i < waves.length; i++) {
    var wave = waves[i];
    for (var x = 0; x < width; x++) {
      var y = (height/2) - wave.calc(x) + wave.offset;
      context.fillStyle = 'lightgray';
      context.fillRect(x, y, 3, 3);
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
  for (var i = 0; i < waves.length; i++) {
    var wave = waves[i];
    wave.phase = (wave.phase + (delta/2000)) % TAU;
  }
};

window.onload = function() {
  var canvas = document.getElementById('canvas');

  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  context = canvas.getContext('2d');
  context.canvas.width  = window.innerWidth;
  context.canvas.height = window.innerHeight;
  context.lineWidth = 3;
  context.fillStyle = 'black';

  requestAnimationFrame(tick);
};
