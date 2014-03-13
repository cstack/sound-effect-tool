var Sound = function() {
  var waveforms = ["sin", "saw", "square"];

  var randomWaveform = function() {
    return waveforms[Math.floor(Math.random()*waveforms.length)];
  }

  this.freq = Math.random()*800 + 200;
  this.waveform = randomWaveform();
  this.duration = 1000; // in ms

  this.sound = T(this.waveform, {freq:this.freq});
  this.sound.set({mul:0.25});

  this.play = function() {
    this.sound.bang().play();
  }

  this.pause = function() {
    this.sound.pause();
  }

  this.save = function() {
    var api = T("WebAudioAPI:send");
    var context = api.context;
    var gainNode = context.createGain();
    var rec = new Recorder(gainNode, {workerPath:"js/recorderWorker.js"});
    api.append(this.sound);
    api.send(gainNode);
    rec.record();
    setTimeout(function() {
      rec.stop();
      rec.exportWAV(function(blob) {
        console.log(blob);
        saveAs(blob, "test.wav");
      });
    }, this.duration);
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
      sound.pause();
      activeBackground.stop().fadeOut(100);
    });
    var downloadButton = $("<button>Download</button>");
    $(this).append(downloadButton);
    downloadButton.click(function(){
      sound.save();
    });
  });
});
