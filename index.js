let GoogleOauth = require('cloud/src/google-oauth.js');
let TwitterOauth = require('cloud/src/twitter-oauth.js');
let ParseUserCreate = require('cloud/src/parse-user-create.js');

/**
 * Create a Parse ACL which prohibits public access.  This will be used
 *   in several places throughout the application, to explicitly protect
 *   Parse User, TokenRequest, and TokenStorage objects.
 */
let restrictedAcl = new Parse.ACL();
restrictedAcl.setPublicReadAccess(false);
restrictedAcl.setPublicWriteAccess(false);


/**
 * google_util_request_login
 * ---------------------------------------------------------------------------------------------------------------------
 *
 * Client can call this function to request a redirect_uri, redirect to this uri to perform login.
 *
 */
Parse.Cloud.define('google_util_request_login', (req, res) => {

	Parse.Config.get().then(
		(config) => {
			let googleOauth = GoogleOauth({}, {
				client_id    : config.get('googleClientId'),
				redirect_uri : config.get('googleRedirectUri'),
				state        : 'profile',
				response_type: 'token',
				scope        : 'email profile',
				authEntryUri : 'https://accounts.google.com/o/oauth2/v2/auth?'
			});

			res.success(googleOauth.requestRedirectUri());
		},
		(error) => res.error(error)
	);

});


/**
 * google_util_validate_token_and_signin
 * ---------------------------------------------------------------------------------------------------------------------
 *
 * iOS or other SDK may call this Cloud function. Simply supply a @access_token, and the function check if the user email
 * exist on Parse, create one if not.
 *
 * This cloud function will return a session token of that user which can be used to Login on client-side.
 *
 * Example:
 *
 * ```javascript
 * Parse.User.become(sessionToken).then(function (user) {
 *     window.opener.location.reload();
 *     window.close();
 * }, function (error) {
 *     // The token could not be validated.
 * });
 * ```
 */
Parse.Cloud.define('google_util_validate_token_and_signin', (req, res) => {

	let url = 'https://www.googleapis.com/oauth2/v3/tokeninfo';

	Parse.Cloud.httpRequest({
		method: 'POST',
		url: url,
		body: { access_token: req.params.access_token}
	}).then(
		(httpResponse) => {
			// 'authData' is a Parse RESERVED COLUMN, currently only "twitter" and "facebook" are supported by Parse iOS SDK.
			// Unfortunately Parse JS SDK only support facebook with FacebookUtil object
			// 1. For Twitter, we simply overwrite "authData"
			// 2. For Google, we use "authToken" column (Note this name is customizable)
			let authTokenColumn = 'authToken';

			let googleUser = httpResponse.data;

			if (typeof googleUser.email != 'undefined' && googleUser.email_verified == 'true') {
				Parse.Promise.as().then(
					() => { return ParseUserCreate({'google': googleUser}, googleUser, authTokenColumn, res) }
				).then(
					(user) => res.success(user.getSessionToken())
				);
			}
		},
		(error) => res.error(JSON.stringify(error))
	);

});


/**
 * twitter_util_request_token
 * ---------------------------------------------------------------------------------------------------------------------
 *
 * Step.1 of Twitter Login - Obtaining Twitter request token
 *
 * When you obtain the oauth_token, you can redirect your user to twitter login endpoint
 *
 * Exapmle:
 * 'https://api.twitter.com/oauth/authenticate?oauth_token=' + oauth_token;
 *
 */
Parse.Cloud.define('twitter_util_request_token', (req, res) => {

	Parse.Config.get().then((config) => {
		let twitterOauth = new TwitterOauth({},
			{
				consumerSecret     : config.get('twitterConsumerSecret'),
				oauth_consumer_key : config.get('twitterOauthConsumerKey'),
				tokenSecret        : config.get('twitterTokenSecret'),
				oauth_token        : config.get('twitterOauthToken')
			}
		);

		let url = 'https://api.twitter.com/oauth/request_token',
			apiAuthorizationHeaders = twitterOauth.initializeAuthorizationHeaders(url, 'POST');

		Parse.Cloud.httpRequest({
			method: 'POST',
			url: url,
			headers: { Authorization: apiAuthorizationHeaders }
		}).then(
			(httpResponse) => res.success(JSON.stringify(httpResponse)),
			(error) => res.error(JSON.stringify(error))
		);
	});

});


/**
 *
 * twitter_util_authorize
 * ---------------------------------------------------------------------------------------------------------------------
 *
 * Step 3 of Twitter Login - Converting the request token to an access token
 *
 */
Parse.Cloud.define('twitter_util_authorize', (req, res) => {

	Parse.Config.get().then((config) => {
		let twitterOauth = new TwitterOauth({},
			{
				consumerSecret     : config.get('twitterConsumerSecret'),
				oauth_consumer_key : config.get('twitterOauthConsumerKey'),
				tokenSecret        : config.get('twitterTokenSecret'),
				oauth_token        : req.params.oauth_token
			}
		);

		let url = 'https://api.twitter.com/oauth/access_token',
			apiAuthorizationHeaders = twitterOauth.initializeAuthorizationHeaders(url, 'POST');

		Parse.Cloud.httpRequest({
			method: 'POST',
			url: url,
			body: { oauth_verifier: req.params.oauth_verifier },
			headers: { Authorization: apiAuthorizationHeaders}
		}).then(
			(httpResponse) => res.success(JSON.stringify(httpResponse)),
			(error) => res.error(JSON.stringify(error))
		);
	});

});

/**
 * twitter_util_login_on_parse
 * ---------------------------------------------------------------------------------------------------------------------
 * The function check if the user email exist on Parse, create one if not.
 *
 * Return a session token of that user which can be used to Login on client-side.
 *
 * Example:
 *
 * ```javascript
 * Parse.User.become(sessionToken).then(function (user) {
 *     window.opener.location.reload();
 *     window.close();
 * }, function (error) {
 *      The token could not be validated.
 * });
 * ```
 */
Parse.Cloud.define('twitter_util_login_on_parse', (req, res) => {

	Parse.Config.get().then((config) => {
		let twitterOauth = new TwitterOauth({},
			{
				consumerSecret     : config.get('twitterConsumerSecret'),
				oauth_consumer_key : config.get('twitterOauthConsumerKey'),
				tokenSecret        : config.get('twitterTokenSecret'),
				oauth_token        : req.params.oauth_token
			}
		);

		let url = 'https://api.twitter.com/1.1/account/verify_credentials.json',
			apiAuthorizationHeaders = twitterOauth.initializeAuthorizationHeaders(url, 'GET');

		Parse.Cloud.httpRequest({
			method: 'GET',
			url: url,
			body: { include_email: 'true' },
			headers: { Authorization: apiAuthorizationHeaders }
		}).then(
			(httpResponse) => {
				// 'authData' is a Parse RESERVED COLUMN, currently only "twitter" and "facebook" are supported by Parse iOS SDK.
				// Unfortunately Parse JS SDK only support facebook with FacebookUtil object
				// 1. For Twitter, we simply overwrite "authData"
				// 2. For Google, we use "authToken" column (Note this name is customizable)
				let authTokenColumn = 'authData';

				let twitterUser = httpResponse.data;

				// This should be removed in Production, if your Twitter Application is reviewed by Twitter whitelist check
				// 'email' should be included by setting 'include_email: "true"' in httpRequest
				twitterUser.email = 'llwbenson@gmail.com';

				if (twitterUser.screen_name == req.params.screen_name) {
					Parse.Promise.as().then(
						() => {
							return ParseUserCreate(
								{
									'twitter': {
										'auth_token': req.params.oauth_token,
										'auth_token_secret': req.params.oauth_token_secret,
										'screen_name': req.params.screen_name,
										'id': req.params.user_id,
										'consumer_key': twitterOauth.oauth_consumer_key,
										'consumer_secret': twitterOauth.consumerSecret
									}
								}, twitterUser, authTokenColumn, res);
						}
					).then(
						(user) => res.success(user.getSessionToken())
					);
				}
			},
			(error) => res.error(JSON.stringify(error))
		);
	});

});
