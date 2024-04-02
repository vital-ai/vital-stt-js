import SpeechToText from './vitalspeechtotext/nodes/speechtotext.js'

class VitalSpeechToText {
        
    constructor() {
        
        this.speechToText = new SpeechToText();
    }
    
    async start() {
        
        await this.speechToText.start()
        
    }
    
    async stop() {
        
        await this.speechToText.stop()    
    }
    
    async restart() {
        
        console.log("attempting to restart whisper worker...");
    }
    
    do_whisper_web(task,language=null){
        
        console.log("in do_whisper_web. task: ", task);

        // directly calling handler.
        // should it be listening for an event instead?
        
        this.speechToText.handler(new CustomEvent('speechToText', 
            { "detail": task
            }))
    }
}

// export { VitalSpeechToText };

// export default VitalSpeechToText;

// exports not working

window.VitalSpeechToText = VitalSpeechToText;


/*
                if(whisper_progress_el == null){
					console.error("whisper (down)load progress element is missing");
				}
				else{
					//console.log("updating whisper (down)load progress");
					whisper_progress_el.value = e.data.progress / 100;
				}
                */	

 /*
                if(whisper_progress_el){
					whisper_progress_el.classList.add('download-complete-chat-message');
				}
				else{
					console.error("whisper became ready, but cannot find loading progress indicator element");
				}
                */

/*
			
				if(window.whisper_queue.length){
					console.log("whisper worker done, but there is more work to do. Sentences still in whisper_queue: ", window.whisper_queue.length);
					let next_sentence = window.whisper_queue[0][0] + window.whisper_queue[0][1]; // sentence plus punctuation mark
					window.whisper_queue.splice(0,1);
				
				whisper_worker.postMessage({'whisper_counter':window.whisper_counter,'sentence':next_sentence});
					window.whisper_counter++;
				}
				else{
					console.log("whisper worker was done, and there are no more sentences in the whisper queue. Worker is now idle.");
					window.whisper_worker_busy = false;
				}
				*/

