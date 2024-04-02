// imports not working
// import VitalSpeechToText from '/dist/vitalSpeechToText.min.js'

import * as Everything from '/dist/vitalSpeechToText.min.js';

// console.log(Everything);

// console.log(window.VitalSpeechToText);

window.vitalSTT = new window.VitalSpeechToText();

var myvad = null;    
 
function handleSpeechToTextEvent(event) {
   
    const text = event.detail;
   
    console.log('SST Result: ', text);
}

async function main() {
      
    await window.vitalSTT.start();
    
    myvad = await vad.MicVAD.new({
        
    onSpeechStart: () => {
        console.log("Speech start detected")
    },
        
    onSpeechEnd: (audio) => {
          
        console.log("Speech end detected")
                    
        var task = {};
        
        task.recorded_audio = audio;
          
        window.vitalSTT.do_whisper_web(task);
          
      },
        
      onFrameProcessed: (probabilities) => {
            
        // {isSpeech: float; notSpeech: float}
            
        let isSpeech = probabilities.isSpeech;
            
        let notSpeech = probabilities.notSpeech;
                
        if(isSpeech > 0.1) {
                // console.log("Is Speech: ", isSpeech);
            }
        } 
    })
  }
    
main();

window.addEventListener('speechToTextResult', handleSpeechToTextEvent);

let microphone;

document.addEventListener('DOMContentLoaded', function () {
    
  var checkbox = document.querySelector('input[type="checkbox"]');

  checkbox.addEventListener('change', function () {
    
    if (checkbox.checked) {
     
      console.log('Checked');
    
        myvad.start()
        
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
    
                microphone = stream;
            
        })
        .catch(function(err) {
    
            console.log('Failed to get microphone access', err);
        });
        
    } else {
     
      console.log('Not checked');
    
      myvad.pause()
          
    }

  });
});        

