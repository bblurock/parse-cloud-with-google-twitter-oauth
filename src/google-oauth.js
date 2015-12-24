let oauth = require('cloud/libs/oauth.js');

module.exports = function googleOauth(obj = {}, params = {}) {

	let response_type = params.response_type;
	let client_id = params.client_id;
	let state = params.state;
	let redirect_uri = params.redirect_uri;
	let scope = params.scope;
	let authEntryUri = "https://accounts.google.com/o/oauth2/v2/auth?";

	obj.requestRedirectUri = () => {
		return authEntryUri
			+ 'scope=' + encodeURIComponent(scope)
			+ '&state=%2F' + encodeURIComponent(state)
			+ '&redirect_uri=' + encodeURIComponent(redirect_uri)
			+ '&response_type=' + encodeURIComponent(response_type)
			+ '&client_id=' + client_id;
	};

	return obj;
};

