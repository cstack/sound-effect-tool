var Sound = function(seedSound) {
  var waveforms = ["sin", "saw", "square"];

  var randomWaveform = function() {
    return waveforms[Math.floor(Math.random()*waveforms.length)];
  }

  var randomGainTable = function() {
    this.attackTime = Math.random() * 300;
    this.sustainValue = Math.random() * 0.5 + 0.5;
    this.decayTime = Math.random() * 300;
    this.sustainTime = Math.random() * 500;
    this.releaseTime = Math.random() * 300;
    var table = [0,
      [1, this.attackTime],
      [this.sustainValue, this.decayTime],
      [this.sustainValue, this.sustainTime],
      [0, this.releaseTime]];
    return table;
  }

  var mutateGainTable = function(originalTable) {
    var table = [0, [], [], [], []];
    for (var i = 1; i <= 4; i++) {
      for (var j = 0; j < 2; j++) {
        table[i][j] = originalTable[i][j] * (0.9 + Math.random() * 0.2);
      }
    }
    table[1][0] = 1;
    table[4][0] = 0;
    table[3][0] = table[2][0]; // sustain value

    return table;
  }

  var randomFreqTransition = function() {
    return [Math.random() * 800 + 200, Math.floor(Math.random()*500)];
  }

  var randomFreqTable = function() {
    var table = [Math.floor(Math.random() * 800 + 200)];
    var numTransitions = Math.floor(Math.random() * 3);
    for (var i = 0; i < numTransitions; i++) {
      table.push(randomFreqTransition());
    }
    return table;
  }

  var mutateFreqTable = function(originalTable) {
    var table = [];
    table.push(originalTable[0] + Math.random() * 200 - 100);
    var numTransitions = originalTable.length;
    for (var i = 1; i < numTransitions; i++) {
      var freq = originalTable[i][0] * (0.9 + Math.random() * 0.2);
      var time = originalTable[i][1] * (0.9 + Math.random() * 0.2);
      table.push([freq, time]);
    }

    if (Math.random() < 0.3) {
      table.push(randomFreqTransition());
    }

    if (Math.random() < 0.3 && table.length > 1) {
      table.pop(1);
    }

    return table;
  }

  if (typeof seedSound === "undefined") {
    // Create a random sound

    this.freqTable = randomFreqTable();
    this.waveform = randomWaveform();
    this.gainTable = randomGainTable();
  } else {
    // Create a mutated version of the seed sound

    this.freqTable = mutateFreqTable(seedSound.freqTable);
    if (Math.random() < 0.3) {
      this.waveform = randomWaveform();
    } else {
      this.waveform = seedSound.waveform;
    }
    this.gainTable = mutateGainTable(seedSound.gainTable);
  }

  var freqEnvelope = T("env",{table:this.freqTable});
  var sound = T(this.waveform, {freq:freqEnvelope});
  sound = T("env", {table: this.gainTable}, sound);
  sound.set({mul:0.25});

  sound.on("ended", function(){
    sound.pause();
  });

  this.reset = function() {
    freqEnvelope.bang();
    return sound.bang();
  }

  this.play = function() {
    this.reset().play();
  }

  this.pause = function() {
    sound.pause();
  }

  this.save = function() {
    var api = T("WebAudioAPI:send");
    var context = api.context;
    var gainNode = context.createGain();
    var rec = new Recorder(gainNode, {workerPath:"js/recorderWorker.js"});

    var soundToPlay = this.reset();
    soundToPlay.once("ended", function(){
      setTimeout(function(){
        rec.stop();
          rec.exportWAV(function(blob) {
          console.log(blob);
          saveAs(blob, "test.wav");
        });
      }, 200); // Extra time at end of track
    });

    api.append(soundToPlay);
    rec.record();
    api.send(gainNode);
  }
}

var Tile = function(sound) {
  this.ui = $("<a href=\"#\" class=\"sound\"></a>");
  this.sound = sound;

  var activeBackground = $("<div class=\"active\"></div>");
  this.ui.append(activeBackground);

  this.ui.hover(function(){
    sound.play();
    activeBackground.stop().fadeIn(100);
  }, function(){
    activeBackground.stop().fadeOut(100);
  });

  var downloadButton = $("<a href=\#\ class=\"glyphicon glyphicon-download download\"></a>");

  this.ui.append(downloadButton);
  downloadButton.click(function(){
    sound.save();
  });

  this.ui.click(function(){
    sound = new Sound(sound);
  });
}

var Row = function(seedSound) {
  var ui = $("<div class=\"row\"></div>");
  this.ui = ui;
  for (var i = 0; i < 5; i++) {
    (function(){
      var tile = new Tile(new Sound(seedSound));
      tile.ui.click(function(){
        $(this).addClass("selected");
        ui.after(new Row(tile.sound).ui);
      });
      ui.append(tile.ui);
    })()
  }
}

$(function(){
  var soundsUI = $("#sounds");
  soundsUI.append(new Row().ui);
});
