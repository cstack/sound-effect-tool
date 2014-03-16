var Sound = function() {
  var waveforms = ["sin", "saw", "square"];

  var randomWaveform = function() {
    return waveforms[Math.floor(Math.random()*waveforms.length)];
  }

  var randomGainEnvelope = function() {
    var attackTime = Math.random() * 300;
    var sustainValue = Math.random() * 0.5 + 0.5;
    var decayTime = Math.random() * 300;
    var sustainTime = Math.random() * 500;
    var releaseTime = Math.random() * 300;
    var table = [0,
      [1, attackTime],
      [sustainValue, decayTime],
      [sustainValue, sustainTime],
      [0, releaseTime]];
    return table;
  }

  var randomFreqEnvelope = function() {
    var table = [Math.floor(Math.random() * 800 + 200)];
    var numTransitions = Math.floor(Math.random() * 3);
    for (var i = 0; i < numTransitions; i++) {
      table.push([Math.random() * 800 + 200, Math.floor(Math.random()*500)]);
    }
    return table;
  }

  this.freq = T("env", {table:randomFreqEnvelope()});
  this.waveform = randomWaveform();

  var sound = T(this.waveform, {freq:this.freq});
  sound = T("env", {table: randomGainEnvelope()}, sound);
  sound.set({mul:0.25});

  sound.on("ended", function(){
    sound.pause();
  });

  this.sound = sound;

  this.reset = function() {
    this.freq.bang();
    return this.sound.bang();
  }

  this.play = function() {
    this.reset().play();
  }

  this.pause = function() {
    this.sound.pause();
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

var S = (function(){
  var api = {
    randomSound: function() {
      return new Sound();
    }
  };
  return api;
})()

$(function(){
  $("a.sound").each(function(){
    var activeBackground = $("<div class=\"active\"></div>");
    $(this).append(activeBackground);

    var sound = S.randomSound();
    $(this).hover(function(){
      sound.play();
      activeBackground.stop().fadeIn(100);
    }, function(){
      activeBackground.stop().fadeOut(100);
    });
    var downloadButton = $("<button>Download</button>");
    $(this).append(downloadButton);
    downloadButton.click(function(){
      sound.save();
    });
  });
});
