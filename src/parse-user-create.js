let Buffer = require('buffer').Buffer;
let _ = require('underscore');

Parse.Cloud.useMasterKey();

function newUser(accessToken, userObject, authTokenColumn, res) {

	// Generate a random username and password.
	let user = new Parse.User(),
		username = new Buffer(24),
		password = new Buffer(24);

	_.times(24, (i) => {
		username.set(i, _.random(0, 255));
		password.set(i, _.random(0, 255));
	});

	user.set('username', username.toString('base64'));
	user.set('password', password.toString('base64'));
	user.set(authTokenColumn, accessToken);
	user.set('email', userObject.email);

	// Sign up the new User
	return user.signUp(null).then(
		() => {return upsertUser(accessToken, userObject, res)}
	);

}

function upsertUser(accessToken, userObject, authTokenColumn, res) {
	let password,
		query = new Parse.Query(Parse.User);

	query.equalTo('email', userObject.email); // This email should come form twitterUser.email
	query.ascending('createdAt');

	return query.first().then((user) => {
		let existAccessToken;

		// If not, create a new user.
		if (!user) {
			return newUser(accessToken, userObject, authTokenColumn, res);
		}

		// Update the accessToken if it is different.
		existAccessToken = user.get(authTokenColumn);

		if (typeof existAccessToken == 'undefined') {
			user.set(authTokenColumn, accessToken);
		}
		else if ('twitter' in existAccessToken) {
			if (accessToken.twitter.auth_token != existAccessToken.twitter.auth_token &&
				accessToken.twitter.auth_token_secret != existAccessToken.twitter.auth_token_secret &&
				accessToken.twitter.screen_name != existAccessToken.twitter.screen_name) {
				user.set(authTokenColumn, accessToken);
			}
		}
		else if ('google' in existAccessToken) {
			if (!_.isEqual(accessToken, existAccessToken)) {
				user.set(authTokenColumn, accessToken);
			}
		}

		return user.save();

	}).then(
		(user) => {
			password = new Buffer(24);

			_.times(24, (i) => password.set(i, _.random(0, 255)));

			password = password.toString('base64');

			user.setPassword(password);

			return user.save();
		}
	).then(
		(user)  => { return Parse.User.logIn(user.get('username'), password) },
		(error) => res.error(error)
	);
}

module.exports = upsertUser;



