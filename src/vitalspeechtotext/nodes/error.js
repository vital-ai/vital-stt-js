export default class NodeError extends Error {
    constructor(error) {
        super(error)
        this.name = 'VITALSPEECHTOTEXT_NODE_ERROR';
        this.error = error
    }
}