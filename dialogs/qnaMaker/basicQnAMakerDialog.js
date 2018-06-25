module.exports = () => {

    const builder_cognitiveservices = require("botbuilder-cognitiveservices");

    basicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
        recognizers: [qnaRecognizer],
        defaultMessage: 'No match! Try changing the query terms!',
        qnaThreshold: 0.3
    });

    bot.dialog('basicQnAMakerDialog', basicQnAMakerDialog);
}