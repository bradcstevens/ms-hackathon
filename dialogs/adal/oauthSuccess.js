module.exports = () => {
    bot.dialog('/oauthSuccess', (session, response) => {

        // Check the state value to avoid CSRF attacks http://www.twobotechnologies.com/blog/2014/02/importance-of-state-in-oauth2.html
        if(encodeURIComponent(JSON.stringify(session.message.address)) !== encodeURIComponent(response.state)) {
            session.send("CSRF scenario detected. Closing the current conversation...");
            session.endDialog();
        } else {
    
            // Save the token for the current user and for this conversation only (privateConversationData)
            if (!session.privateConversationData['accessToken']) {
                
                session.privateConversationData['accessToken'] = response.accessToken;
                session.privateConversationData['expiresOn'] = response.expiresOn;
                session.privateConversationData['refreshToken'] = response.refreshToken;
            }
    
            
    
            // Get back to the main dialog route
            session.beginDialog("/");
        }
    });
}