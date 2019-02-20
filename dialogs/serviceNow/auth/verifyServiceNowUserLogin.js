module.exports = () => {
    bot.dialog("/verifyServiceNowUserLogin", [
        (session) => {
            if (session.message.address.channelId === "msteams" || "emulator") {
                //There are 2 steps to get the user info from a chat
                //1. Get an access token
                //2. Use the access token to pull the user
                const appId = process.env.MicrosoftAppId;
                const appPassword = process.env.MicrosoftAppPassword;
                const tokenUrl =
                    "https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token";
                let tokenBody =
                    "grant_type=client_credentials&client_id=" +
                    appId +
                    "&client_secret=" +
                    appPassword +
                    "&scope=https://api.botframework.com/.default";
                const tokenConfig = {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Host: "login.microsoftonline.com"
                    }
                };
                //This request will return the access token
                axios.post(tokenUrl, tokenBody, tokenConfig).then((res) => {
                    console.log(res.data);
                    let accessToken = res.data.access_token;
                    let root = session.message.address.serviceUrl;
                    let conversationID = session.message.address.conversation.id;
                    let route = root.concat(
                        "/v3/conversations/" + conversationID + "/members"
                    );
                    let authorizedConfig = {
                        headers: {
                            Authorization: "Bearer " + accessToken
                        }
                    };
                    //This request will return the user
                    axios
                        .get(route, authorizedConfig)
                        .then((res) => {
                            //RESULTANT PAYLOAD - 
                            // [{ id: '29:1GEnGoPgXQBlHio0KwoUwxhqLfMAvdLQXpFOn7PEIsBjrKBgnYmwJeepucBpCT6fSkCQF7LXW2IWqJgnT3lYiyw',
                            // objectId: 'c49fe892-7d11-4ef8-a551-a755a2471b4a',
                            // name: 'Lucas Huet-Hudson',
                            // givenName: 'Lucas',
                            // surname: 'Huet-Hudson',
                            // email: 'lucashh@microsoft.com',
                            // userPrincipalName: 'lucashh@microsoft.com' } ]
                            console.log(res.data[0]);
                            let firstName = res.data[0].givenName;
                            let lastName = res.data[0].surname;
                            serviceNow
                                .getUserRecord(firstName, lastName)
                                .then((res) => {
                                    console.log(res.data.result[0]);
                                    session.userData.caller_id = res.data.result[0].sys_id;
                                    session.userData.user_name = res.data.result[0].user_name;
                                    session.endDialog();
                                })
                                .catch((err) => {
                                    session.send(
                                        "Hmm, I can't find your user account with your teams credentials."
                                    );
                                    session.replaceDialog("/specifyCredentials");
                                });
                        })
                        .catch((err) => {
                            session.send(
                                "Hmm, I can't find your user account with your teams credentials."
                            );
                            session.replaceDialog("/specifyCredentials");
                        });
                });
            } else {
                session.replaceDialog("/specifyCredentials");
            }
        }
    ]);
}