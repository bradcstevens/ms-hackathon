module.exports = () => {
    const builder = require("botbuilder");
    const AuthenticationContext = require('adal-node').AuthenticationContext;
    //=========================================================
    // Bot authorization delegation middleware
    //=========================================================
    global.getAuthorization = (session, args, next) => {

        // User is not already signed-in
        if (!session.privateConversationData['accessToken']) {

            // Set the arbitrary state as the current session address
            var stateToken = encodeURIComponent(JSON.stringify(session.message.address))
            var authorizationUrl = adalConfig.templateAuthzUrl.replace('<state>', stateToken);

            var actionLabel = 'You need to sign in to Office 365 before playing with this bot!';
            var buttonLabel = 'Sign-in';
            var signInCard = null;

            // The Sign-In card is not supported by Microsoft Teams for now (23/01/2017)
            // https://msdn.microsoft.com/en-us/microsoft-teams/bots#cards-and-buttons
            if (session.message.address.channelId === "msteams" || "emulator") {

                var link = builder.CardAction.openUrl(session, authorizationUrl,buttonLabel)

                signInCard = new builder.ThumbnailCard(session)
                .title("Authorization required!")
                .text(actionLabel)
                .buttons([link]);

            } else {

                // Send sign-in card
                signInCard =  new builder.SigninCard(session)
                    .text(actionLabel)
                    .button(buttonLabel, authorizationUrl);        
            }

            var msg = new builder.Message(session).attachments([signInCard]);
            session.send(msg);

        } else {

            // If the user is  already signed-in, we check if the access token is expired
            var expiresOn = session.privateConversationData['expiresOn'];
            var refreshToken = session.privateConversationData['refreshToken']

            if (new Date(expiresOn) >= Date.now() ) {
                
                acquireTokenWithRefreshToken(refreshToken).then((response) => {

                    // Refresh the token infos
                    session.privateConversationData['accessToken'] = response.accessToken;
                    session.privateConversationData['expiresOn'] = response.expiresOn;
                    session.privateConversationData['refreshToken'] = response.refreshToken;

                    next();

                }).catch((errorMessage) => {
                    console.log(errorMessage);
                });
            } else {
                next();
            }             
        }
    }
    global.acquireTokenWithAuthorizationCode = (authorizationCode) => {

        var authenticationContext = new AuthenticationContext(adalConfig.authorityUrl);

        var p = new Promise((resolve, reject) => {

            authenticationContext.acquireTokenWithAuthorizationCode(
                authorizationCode,
                adalConfig.redirectUri, // This URL must be the same as the redirect_uri of the original request or the reply url of the Azure AD App. Otherwise, it will throw an error.
                adalConfig.resource,
                adalConfig.clientId, 
                adalConfig.clientSecret,
                (err, response) => {

                    if (err) {
                        reject('error: ' + err.message + '\n');

                    } else {
                        resolve({ 
                            userName: (response.givenName + " " + response.familyName),
                            accessToken: response.accessToken,
                            expiresOn: response.expiresOn,
                            refreshToken: response.refreshToken,
                        }); 
                    }
                });
        });

        return p;
    }

    const acquireTokenWithRefreshToken = (refreshToken) => {

        var authenticationContext = new AuthenticationContext(adalConfig.authorityUrl);

        var p = new Promise((resolve, reject) => {

            authenticationContext.acquireTokenWithRefreshToken(
                refreshToken,
                adalConfig.clientId,
                adalConfig.clientSecret,
                adalConfig.resource,
                (err, response) => {

                    if (err) {
                        reject(errorMessage = 'error: ' + err.message + '\n');

                    } else {
                        resolve({ 
                            userName: (response.givenName + " " + response.familyName),
                            accessToken: response.accessToken,
                            expiresOn: response.expiresOn,
                            refreshToken: response.refreshToken,
                        }); 
                    }
                });
        });

        return p;
    }
}