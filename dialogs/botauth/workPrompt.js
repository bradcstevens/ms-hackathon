module.exports = () => {
    const getUserLatestEmail = require('../../middleware/botauth');
    bot.dialog('/workPrompt', [
        (session) => {
            getUserLatestEmail(session.userData.accessToken,
                function(requestError, result) {
                    if (result && result.value && result.value.length > 0) {
                        const responseMessage = 'Your latest email is: "' + result.value[0].Subject + '"';
                        session.send(responseMessage);
                        builder.Prompts.confirm(session, "Retrieve the latest email again?");
                    } else {
                        console.log('no user returned');
                        if (requestError) {
                            console.error(requestError);
                            session.send(requestError);
                            // Get a new valid access token with refresh token
                            getAccessTokenWithRefreshToken(session.userData.refreshToken, (err, body, res) => {

                                if (err || body.error) {
                                    session.send("Error while getting a new access token. Please try logout and login again. Error: " + err);
                                    session.endDialog();
                                } else {
                                    session.userData.accessToken = body.accessToken;
                                    getUserLatestEmail(session.userData.accessToken,
                                        function(requestError, result) {
                                            if (result && result.value && result.value.length > 0) {
                                                const responseMessage = 'Your latest email is: "' + result.value[0].Subject + '"';
                                                session.send(responseMessage);
                                                builder.Prompts.confirm(session, "Retrieve the latest email again?");
                                            }
                                        }
                                    );
                                }

                            });
                        }
                    }
                }
            );
        },
        (session, results) => {
            var prompt = results.response;
            if (prompt) {
                session.replaceDialog('/workPrompt');
            } else {
                session.endDialog();
            }
        }
    ]);
}