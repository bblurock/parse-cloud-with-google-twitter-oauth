let oauth = require('cloud/libs/oauth.js');

module.exports = function twitterOauth(obj = {}, params = {}) {

	// Setup twitter app keys for Twitter API
	let consumerSecret = params.consumerSecret;
	let oauth_consumer_key = params.oauth_consumer_key;
	let tokenSecret = params.tokenSecret;
	let oauth_token = params.oauth_token;
	let ts = new Date().getTime() / 1000;
	let timestamp = Math.floor(ts).toString();

	obj.initializeAuthorizationHeaders = (url, method = "POST") => {

		let sig, encodedSig;

		let nonce = oauth.nonce(32);

		let twitterParams = {
			oauth_version: "1.0",
			oauth_consumer_key: oauth_consumer_key,
			oauth_token: oauth_token,
			oauth_timestamp: timestamp,
			oauth_nonce: nonce,
			oauth_signature_method: "HMAC-SHA1"
		};

		let message = {
			method: method,
			action: url,
			parameters: twitterParams
		};

		oauth.SignatureMethod.sign(message, {
			consumerSecret: consumerSecret,
			tokenSecret: tokenSecret
		});

		sig = oauth.getParameter(message.parameters, "oauth_signature") + "=";
		encodedSig = oauth.percentEncode(sig);

		return 'OAuth oauth_consumer_key="' + oauth_consumer_key + '",' +
			' oauth_nonce=' + nonce + ',' +
			' oauth_signature=' + encodedSig + ',' +
			' oauth_signature_method="HMAC-SHA1",' +
			' oauth_timestamp=' + timestamp + ',' +
			' oauth_token="' + oauth_token + '",' +
			' oauth_version="1.0"';
	};

	return obj;
};

