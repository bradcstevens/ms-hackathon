module.exports = () => {
    require("./basicQnAMakerDialog")();
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
}