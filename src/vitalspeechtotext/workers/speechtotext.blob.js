// import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.1';

let pipeline_func = null;

(async () => {
  const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.1');
  
    env.allowLocalModels = false;

    pipeline_func = pipeline;
    
})();

console.log("WHISPER WEB WORKER EXISTS");

onmessage = async (msg) => {
    
    console.log("WHISPER WEB WORKER: RECEIVED MESSAGE");
    
    console.log("WHISPER WEB WORKER: event.data: ", msg.data);
	
    switch (msg.data.method) {
        case "configure":
            // nativeSampleRate = msg.data.nativeSampleRate
            // targetSampleRate = msg.data.targetSampleRate
            // targetFrameSize = msg.data.targetFrameSize
            // Int16Convert = msg.data.Int16Convert
            
            // exit after configuring
            return Promise.resolve();
            
            break
            
        case "process":
            // process(msg.data.audioFrame)
            break        
    }
      
    // processing audio for transscription...
    
    const message = msg.data;
    
    let task = message.task;

    try{
		
	   let transcript = await transcribe(
           message.task.recorded_audio,
	       message.model,
	       message.multilingual,
	       message.quantized,
	       message.subtask,
	       message.language,
	   );
           
        console.log("WHISPER WEB WORKER: TRANSCRIPTION RESULT: ", transcript);
	    
        if (transcript === null){
	       console.error("WHISPER WEB WORKER: transcription was null");
	   }
           
	   if (typeof transcript === 'undefined'){
	       console.error("WHISPER WEB WORKER: transcription was undefined??");
	   }

        delete task.recorded_audio;
		  
        task['transcript'] = transcript;
	       
        self.postMessage({
			 task: task,
	           status: "complete",
	           // task: "automatic-speech-recognition",
	           transcript: transcript,
	   });
		
    }catch(e){
		console.error("ERROR: whisper worker: ", e);
    }    
    
    return Promise.resolve();

}

// Define model factories
// Ensures only one model is created of each type

class PipelineFactory {
    static task = null;
    static model = null;
    static quantized = null;
    static instance = null;

    constructor(tokenizer, model, quantized) {
        this.tokenizer = tokenizer;
        this.model = model;
        this.quantized = quantized;
    }

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline_func(this.task, this.model, {
                quantized: this.quantized,
                progress_callback,

                // For medium models, we need to load the `no_attentions` revision to avoid running out of memory
                revision: this.model.includes("/whisper-medium") ? "no_attentions" : "main"
            });
        }

        return this.instance;
    }
}

class AutomaticSpeechRecognitionPipelineFactory extends PipelineFactory {
    static task = "automatic-speech-recognition";
    static model = null;
    static quantized = null;
}

const transcribe = async (
    audio,
    model,
    multilingual,
    quantized,
    subtask,
    language,
) => {
	console.log("in transcribe. audio: ", audio);
	console.log("whisper web worker: in transcribe.  model,multilingual,quantized,subtask,language: ", model, multilingual, quantized, subtask, language);
    
	let output = null;

	try{
        
		const isDistilWhisper = model.startsWith("distil-whisper/");
		
	    let modelName = model;
	    
        if (!isDistilWhisper && !multilingual) {
	        modelName += ".en"
	    }
		
	    const p = AutomaticSpeechRecognitionPipelineFactory;
	    
        if (p.model !== modelName || p.quantized !== quantized) {
	        // Invalidate model if different
	        p.model = modelName;
	        p.quantized = quantized;

	        if (p.instance !== null) {
	            (await p.getInstance()).dispose();
	            p.instance = null;
	        }
	    }
		
	    // Load transcriber model
	    let transcriber = await p.getInstance((data) => {
			console.log("whisper web worker: posting something back: ", data);
	        self.postMessage(data);
	    });

	    const time_precision =
	        transcriber.processor.feature_extractor.config.chunk_length /
	        transcriber.model.config.max_source_positions;

	    // Storage for chunks to be processed. Initialise with an empty chunk.
	    let chunks_to_process = [
	        {
	            tokens: [],
	            finalised: false,
	        },
	    ];

	    // TODO: Storage for fully-processed and merged chunks
	    // let decoded_chunks = [];
		
	    function chunk_callback(chunk) {
			console.log("in whisper chunk callback. chunk: ", chunk);
	        let last = chunks_to_process[chunks_to_process.length - 1];

	        // Overwrite last chunk with new info
	        Object.assign(last, chunk);
	        last.finalised = true;

	        // Create an empty chunk after, if it not the last chunk
	        if (!chunk.is_last) {
	            chunks_to_process.push({
	                tokens: [],
	                finalised: false,
	            });
	        }
	    }
		
	    // Inject custom callback function to handle merging of chunks
	    function callback_function(item) {
			//console.log("whisper_worker: COMPLETE?  item: ", item);
	        let last = chunks_to_process[chunks_to_process.length - 1];

	        // Update tokens of last chunk
	        last.tokens = [...item[0].output_token_ids];

	        // Merge text chunks
	        // TODO optimise so we don't have to decode all chunks every time
	        let data = transcriber.tokenizer._decode_asr(chunks_to_process, {
	            time_precision: time_precision,
	            return_timestamps: true,
	            force_full_sequences: false,
	        });

	        self.postMessage({
	            status: "update",
	            // task: "automatic-speech-recognition",
	            data: data,
	        });
	    }
		
	    // Actually run transcription
	    output = await transcriber(audio, {
			
	        // Greedy
	        top_k: 0,
	        do_sample: false,

	        // Sliding window
	        chunk_length_s: isDistilWhisper ? 20 : 30,
	        stride_length_s: isDistilWhisper ? 3 : 5,

	        // Language and task
	        language: language,
	        task: subtask,

	        // Return timestamps
	        return_timestamps: true,
	        force_full_sequences: false,

	        // Callback functions
	        callback_function: callback_function, // after each generation step
	        chunk_callback: chunk_callback, // after each chunk is processed
	    })

		.catch((error) => {
			console.error("ERROR, actually running whisper failed");

	        return null;
	    });
		
		console.log("beyond WHISPER transcribe. output: ", output);
		
	}
	catch(e){
		console.error("Whisper worker: error in transcribe function: ", e);
	}
	

    return output;
};

/*
function process(audioFrame) {
    for (let sample of audioFrame)
    {
        //binary 111111111111111, casts to 16Bit wav file spec
        Int16Convert ? inputBuffer.push(sample * 32767) : inputBuffer.push(sample)
    }
    while ((inputBuffer.length * targetSampleRate / nativeSampleRate) > targetFrameSize) {
        let outputFrame
        Int16Convert ? outputFrame = new Int16Array(targetFrameSize) : outputFrame = new Float32Array(targetFrameSize)
        let sum = 0
        let num = 0
        let outputIndex = 0
        let inputIndex = 0
        while (outputIndex < targetFrameSize) {
            sum = 0
            num = 0
            while (inputIndex < Math.min(inputBuffer.length, (outputIndex + 1) * nativeSampleRate / targetSampleRate)) {
                sum += inputBuffer[inputIndex]
                num++
                inputIndex++
            }
            outputFrame[outputIndex] = sum / num
            outputIndex++
        }
        inputBuffer = inputBuffer.slice(inputIndex)
        postMessage(outputFrame)
    }
}
*/
