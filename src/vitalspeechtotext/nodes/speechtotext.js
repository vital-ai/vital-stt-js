import Node from '../nodes/node.js'
import Worker from '../workers/speechtotext.blob.js'
import NodeError from '../nodes/error.js'

const handler = function (nodeEvent) {
    
    console.log("in do_whisper_web. event: ", nodeEvent);

    let task = nodeEvent.detail;
    
    let language = undefined; // nodeEvent.language;
    
    console.log("in do_whisper_web. task: ", task);

    if(this.whisper_worker_busy){
        console.log("do_whisper_web was called while whisper worker was busy. Aborting.");
        return;
    }

    if(typeof task.recorded_audio == 'undefined'){
        console.log("do_whisper_web: task did not contain recorded_audio. Aborting.");
        return;
    }

    task.state = 'stt_in_progress';

    let multilingual = false;

    if(typeof language == 'string'){
        if(language != 'en'){
            multilingual = true;
        }
    }

    const quantized = false;

    const model = "Xenova/whisper-tiny";

    const subtask = null;


    console.log("do_whisper_web: sending audio to whisper worker: ", task.recorded_audio);

    this.workerRuntime.postMessage({
            task:task,
            model,
            multilingual,
            quantized,
            subtask: multilingual ? subtask : null,
            language:
                multilingual && language !== "auto" ? language : null,
        });
    
    
    // this.workerRuntime.postMessage({
    //    method: "process"
        // audioFrame: nodeEvent.detail
    // })
}

export default class SpeechToText extends Node {
    constructor() {
        super()
        this.worker = Worker
        this.handler = handler.bind(this)
        this.type = "speechToText"
        this.event = "speechToTextFrame" //emitted
        this.hookableOnNodeTypes = [] // ["mic"]
        this.hookedOn = null
        
        this.whisper_worker_busy = false;
        this.whisper_worker_error_count = 0;

    }

    async start(){
        
        // await super.start(node)
        
        this.startWorker();
        this.resume();
        
        this.hookedOn = true
        
        if (this.status == "non-emitting" && this.hookedOn) {
            
            this.workerRuntime.postMessage({
                method: "configure"
            })
            
            
            this.workerRuntime.addEventListener('message', e => {
		        
           if(typeof e.data.status == 'string'){
            
               if(e.data.status == 'progress'){
				
			}
			else if(e.data.status == 'ready'){
				
                console.log("whisper worker sent ready message");
				
                this.whisper_worker_busy = false;
			}
			else if(e.data.status == 'initiate'){
				console.log("whisper worker sent initiate message");
			}
			else if(e.data.status == 'download'){
				console.log("whisper worker sent download message");
			}
			else if(e.data.status == 'update'){
				
                if(typeof e.data.data == 'object' && e.data.data != null && e.data.data.length){
				}
			}
			else if(e.data.status == 'complete'){
				this.whisper_worker_busy = false;
				console.log('GOT WHISPER COMPLETE.  e.data: ', e.data);
				console.log('GOT WHISPER COMPLETE.  e.data.transcript: ', e.data.transcript);
				console.log('GOT WHISPER COMPLETE.  e.data.task: ', e.data.task);
				
				if(e.data.transcript == null){
					console.warn("whisper recognition failed. If this is the first run, that's normal.");
				}
				else if(typeof e.data.transcript != 'undefined'){
					console.log("whisper returned transcription text: ", e.data.transcript);
					
					if(Array.isArray(e.data.transcript)){
						console.log("typeof transcription is array");
					}
					else if(typeof e.data.transcript == 'object'){
						if(typeof e.data.transcript.text == 'string'){
                            
                            
                            let stt_result = e.data.transcript.text
                            
							console.log("GOT TEXT: ", stt_result);
                            
                            const event = new CustomEvent('speechToTextResult', 
                                { detail: stt_result });

                            window.dispatchEvent(event);
                            
						}
					}
				}
				else{
					console.log("transcript was not in whisper e.data");
                }
			}
			else{
				console.log("whisper worker sent a content message");
                
				this.whisper_worker_busy = false;
				
				if(e.data.data == null){
					console.warn("whisper recognition failed. If this is the first run, that's normal.");
				}
			}
		}
               
    });
                                                                    
    this.workerRuntime.addEventListener('error', (error) => {
		console.error("ERROR: whisper_worker sent error. terminating!. Error was: ", error, error.message);
		this.whisper_worker_error_count++;
		
		this.whisper_worker.terminate();
		this.whisper_worker_busy = false;
		if(typeof error != 'undefined' && this.whisper_worker_error_count < 10){
			setTimeout(() => {
				
                console.log("calling restart whisper worker");
				
                restart(node);
                
                // create_whisper_worker();
                
			},1000);
		}
		else{
			console.error("whisper_worker errored out");
		}
	});
            
         
            this.status = "emitting"
        }
        
        return Promise.resolve();
                       
    }
    
     async restart(node){
         
     }
                                             
}