module.exports = () => {
    const builder_cognitiveservices = require("botbuilder-cognitiveservices");
    // Recognizer and and Dialog for GA QnAMaker service
    qnaRecognizer = new builder_cognitiveservices.QnAMakerRecognizer({
        knowledgeBaseId: process.env.QnAKnowledgebaseId,
        authKey: process.env.QnAAuthKey || process.env.QnASubscriptionKey, // Backward compatibility with QnAMaker (Preview)
        endpointHostName: process.env.QnAEndpointHostName
    });
}