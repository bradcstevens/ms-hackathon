module.exports = () => {
    require("./basicQnAMakerDialog")();
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
            ssession.conversationData.qnaAnswer = qnaAnswer;
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
                .subtitle(description)
                .images([builder.CardImage.create(session, imageURL)])
                .buttons([builder.CardAction.openUrl(session, url, "Learn More")])
            ]);
            session.send(msg).endDialog();
        }

    };
}