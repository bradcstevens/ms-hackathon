module.exports = () => {

    const builder_cognitiveservices = require("botbuilder-cognitiveservices");

    basicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
        recognizers: [qnaRecognizer],
        defaultMessage: 'No match! Try changing the query terms!',
        qnaThreshold: 0.3
    });

    bot.dialog('basicQnAMakerDialog', basicQnAMakerDialog);

    basicQnAMakerDialog.defaultWaitNextMessage = (session, qnaMakerResult) => {
        // saves the user's question
        session.conversationData.userQuestion = session.message.text;

        if (!qnaMakerResult.answers) {
            let msg = new builder.Message(session).addAttachment({
                contentType: "application/vnd.microsoft.card.adaptive",
                content: {
                    type: "AdaptiveCard",
                    body: [{
                            type: "TextBlock",
                            text: "" + session.conversationData.userQuestion,
                            size: "large",
                            weight: "bolder",
                            color: "accent",
                            wrap: true
                        },
                        {
                            type: "TextBlock",
                            text: "Sorry, no answer found in QnA service",
                            size: "large",
                            weight: "regular",
                            color: "dark",
                            wrap: true
                        }
                    ]
                }
            });
            session.send(msg);
        }
        session.endDialog();
    };

    basicQnAMakerDialog.respondFromQnAMakerResult = (session, qnaMakerResult) => {
        // Save the question
        let question = session.message.text;
        session.conversationData.userQuestion = question;

        // boolean to check if the result is formatted for a card
        let isCardFormat = qnaMakerResult.answers[0].answer.includes(";");
        console.log(isCardFormat);
        if (!isCardFormat) {

            // Save the QnAMaker Answer
            let qnaAnswer = qnaMakerResult.answers[0].answer;
            session.conversationData.qnaAnswer = qnaAnswer;
            let qnaAnswerConversationData = session.conversationData.qnaAnswer;
            console.log(qnaAnswerConversationData);

            // Not semi colon delimited, send a normal text response
            session.send(qnaMakerResult.answers[0].answer);
        } else if (qnaMakerResult.answers && qnaMakerResult.score >= 0.5) {

            // Save the QnAMaker Answer
            let qnaAnswer = qnaMakerResult.answers[0].answer;
            session.conversationData.qnaAnswer = qnaAnswer;
            let qnaAnswerConversationData = session.conversationData.qnaAnswer;
            console.log(qnaAnswerConversationData);

            // Set HeroCard field values
            let qnaAnswerData = qnaAnswerConversationData.split(";");
            let title = qnaAnswerData[0];
            let description = qnaAnswerData[1];
            let url = qnaAnswerData[2];
            let imageURL = qnaAnswerData[3];

            let msg = new builder.Message(session);
            console.log(msg);
            msg.attachments([
                new builder.HeroCard(session)
                .title(title)
                .text(description)
                .images([builder.CardImage.create(session, imageURL)])
                .buttons([builder.CardAction.openUrl(session, url, "Learn More")])
            ]);
            session.send(msg).endDialog();
        }

    };
}