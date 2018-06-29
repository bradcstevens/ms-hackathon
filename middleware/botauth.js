module.exports = () => {
    const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
    const https = require('https');
    const request = require('request');



    ba.provider("aadv2", (options) => {
        // Use the v2 endpoint (applications configured by apps.dev.microsoft.com)
        // For passport-azure-ad v2.0.0, had to set realm = 'common' to ensure authbot works on azure app service
        let oidStrategyv2 = {
            redirectUrl: options.callbackURL, //  redirect: /botauth/aadv2/callback
            realm: process.env.realm,
            clientID: process.env.AadClientId,
            clientSecret: process.env.AadClientSecret,
            identityMetadata: 'https://login.microsoftonline.com/' + process.env.realm + '/v2.0/.well-known/openid-configuration',
            skipUserProfile: false,
            validateIssuer: false,
            //allowHttpForRedirectUrl: true,
            responseType: 'code',
            responseMode: 'query',
            scope: ['email', 'profile', 'offline_access', 'https://outlook.office.com/mail.read'],
            passReqToCallback: true
        };

        let strategy = oidStrategyv2;

        return new OIDCStrategy(strategy,
            (req, iss, sub, profile, accessToken, refreshToken, done) => {
                if (!profile.displayName) {
                    return done(new Error("No oid found"), null);
                }
                profile.accessToken = accessToken;
                profile.refreshToken = refreshToken;
                done(null, profile);
            });
    });

    const getAccessTokenWithRefreshToken = (refreshToken, callback) => {
        var data = 'grant_type=refresh_token' +
            '&refresh_token=' + refreshToken +
            '&client_id=' + 
            AadClientId +
            '&client_secret=' + encodeURIComponent(AadClientSecret)

        var options = {
            method: 'POST',
            url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            body: data,
            json: true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        };

        request(options, function(err, res, body) {
            if (err) return callback(err, body, res);
            if (parseInt(res.statusCode / 100, 10) !== 2) {
                if (body.error) {
                    return callback(new Error(res.statusCode + ': ' + (body.error.message || body.error)), body, res);
                }
                if (!body.access_token) {
                    return callback(new Error(res.statusCode + ': refreshToken error'), body, res);
                }
                return callback(null, body, res);
            }
            callback(null, {
                accessToken: body.access_token,
                refreshToken: body.refresh_token
            }, res);
        });
    }

    const getUserLatestEmail = (accessToken, callback) => {
        var options = {
            host: 'outlook.office.com', //https://outlook.office.com/api/v2.0/me/messages
            path: '/api/v2.0/me/MailFolders/Inbox/messages?$top=1',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: 'Bearer ' + accessToken
            }
        };
        https.get(options, function(response) {
            var body = '';
            response.on('data', function(d) {
                body += d;
            });
            response.on('end', function() {
                var error;
                if (response.statusCode === 200) {
                    callback(null, JSON.parse(body));
                } else {
                    error = new Error();
                    error.code = response.statusCode;
                    error.message = response.statusMessage;
                    // The error body sometimes includes an empty space
                    // before the first character, remove it or it causes an error.
                    body = body.trim();
                    error.innerError = body;
                    callback(error, null);
                }
            });
        }).on('error', function(e) {
            callback(e, null);
        });
    }
}