# Google and Twitter Oauth Login Using Parse Cloud Function
This project implement the basic Twitter/Google oauth login with Parse Cloud function.

Parse Javascript only support Facebook login. 
Though Parse did provide some [blogpost](https://parse.com/tutorials/adding-third-party-authentication-to-your-web-app) for people adding third-Party authentication to your Web App.

### Oauth
Parse Cloud Code environment is not Node.js, a vanilla library is helpful for our purpose.
- [outh.js](https://oauth.googlecode.com/svn/code/javascript/)

### Documents
- [Twitter Login Flow](https://dev.twitter.com/web/sign-in/implementing)
- [Google](https://developers.google.com/identity/protocols/OAuth2UserAgent)

### Usage

#### Development 
> npm install && npm start

#### Deploy
> cd ./cloud && parse deploy

### Config
You should set the following configs on Parse Web App

- Twitter
 - twitterConsumerSecret
 - twitterOauthConsumerKey
 - twitterTokenSecret
 - twitterOauthToken

- Google
 - googleClientId
 - googleRedirectUri


 
### Cloud Functions

#### google_util_request_login
```
/**
 * google_util_request_login
 * ---------------------------------------------------------------------------------------------------------------------
 *
 * Client can call this function to request a redirect_uri, redirect to this uri to perform login.
 *
 */
```

#### google_util_validate_token_and_signin
```
/**
 * google_util_validate_token_and_signin
 * ---------------------------------------------------------------------------------------------------------------------
 *
 * iOS or other SDK may call this Cloud function. Simply supply a @access_token, and the function check if the user email
 * exist on Parse, create one if not.
 *
 * This cloud function will return a session token of that user which can be used to Login on client-side.
 *
 */
```

 Example:
 ```javascript
 Parse.User.become(sessionToken).then(function (user) {
     window.opener.location.reload();
     window.close();
 }, function (error) {
     // The token could not be validated.
 });
 ```

#### twitter_util_request_token
```
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
```
 
#### twitter_util_authorize
```
/**
 *
 * twitter_util_authorize
 * ---------------------------------------------------------------------------------------------------------------------
 *
 * Step 3 of Twitter Login - Converting the request token to an access token
 *
 */
```
 
#### twitter_util_login_on_parse
 ```
 /**
  * twitter_util_login_on_parse
  * ---------------------------------------------------------------------------------------------------------------------
  * The function check if the user email exist on Parse, create one if not.
  *
  * Return a session token of that user which can be used to Login on client-side.
 ```