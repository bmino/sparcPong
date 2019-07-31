Adding Properties
=================

Add a file called `application.env` under the config directory.
This file should contain properties formatted like this:

```
KEY=VALUE
```



Username Properties
-------------------

| Property Name | Default | Description |
| ------------- | ------- | ----------- |
| USERNAME_LENGTH_MIN | 2 | Minimum length of characters allowed for players and teams |
| USERNAME_LENGTH_MAX | 15 | Maximum length of characters allowed for players and teams |


Authentication Properties
-------------------------

| Property Name | Default | Description |
| ------------- | ------- | ----------- |
| JWT_SECRET_KEY | *none* | Used to encode and decode JWT tokens |
| JWT_AUTH_HEADER_PREFIX | JWT | HTTP authorization header prefix before the JWT |
| JWT_ALGORITHM | HS256 | Algorithm used to encode and decode a JWT |
| JWT_EXPIRATION_DAYS | 5 | Days before a JWT is considered expired |
| JWT_REJECT_IAT_BEFORE | 1483246800000 | A JWT before this time (in milliseconds) is considered invalid |
| PASSWORD_RESET_WINDOW_MINUTES | 20 | Minutes after a password reset key is issued until it expires |
| PASSWORD_RESET_REPEAT_HOURS | 1 | Hours after a password reset is enabled before it can be reset again |
| PASSWORD_MIN_LENGTH | 6 | Minimum allowed length of a user password |


Email Properties
----------------

| Property Name | Default | Description |
| ------------- | ------- | ----------- |
| EMAIL_ADDRESS | *none* | Gmail address used to email users |
| EMAIL_TITLE | Sparc Pong | Friendly email title used to email users |
| AUTH_CLIENT_ID | *none* | Oauth2 client id for gmail account |
| AUTH_CLIENT_SECRET | *none* | Oauth2 secret for gmail account |
| AUTH_CLIENT_REFRESH | *none* | Oauth2 refresh token for gmail account |


Challenge Properties
--------------------

| Property Name | Default | Description |
| ------------- | ------- | ----------- |
| CHALLENGE_DISABLED | false | Toggles whether new challenges can be issued
| CHALLENGE_BACK_DELAY_HOURS | 12 | Hours before a challenger may re-challenge the same opponent |
| ALLOWED_CHALLENGE_DAYS | 4 | Business days until a singles challenge expires |
| ALLOWED_CHALLENGE_DAYS_TEAM | 5 | Business days until a doubles challenge expires |


Application Properties
----------------------

| Property Name | Default | Description |
| ------------- | ------- | ----------- |
| PORT | *none* | Port the node server runs on |
| MONGODB_URI | *none* | Mongo connection uri. A local string could be mongodb://127.0.0.1/sparcPongDb |
| MORGAN_FORMAT | none | Morgan logging predefined type |
| LADDER_URL | http://localhost:[PORT] | Root url where the ladder is hosted. Defaults to localhost and the port specified via `process.env.PORT`. |