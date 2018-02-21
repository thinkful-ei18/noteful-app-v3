# Challenge

## Install `dotenv`

`npm install dotenv`

## Update `server.js`

Require `dotenv`

```js
require('dotenv').config();
```

Require `jwt`

```js
const jwtStrategy = require('./passport/jwt');
```

## Utilize strategies

```js
passport.use(localStrategy);
passport.use(jwtStrategy);

// routes below this point require a valid JWT
const options = { session: false, failWithError: true };
const jwtAuth = passport.authenticate('jwt', options);
app.use(jwtAuth);

// Mount routers
app.use('/v3', notesRouter);
app.use('/v3', foldersRouter);
app.use('/v3', tagsRouter);
```

## Configure JWT

Add JWT settings to `config.js`
```js
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
```

## Add JWT to router

```js
const jwt = require('jsonwebtoken');

const { JWT_SECRET, JWT_EXPIRY } = require('../config');

router.post('/login', localAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

const options = { session: false, failWithError: true };
const jwtAuth = passport.authenticate('jwt', options);

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

function createAuthToken (user) {
  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
}
```

## JWT strategy

Create `/passport/jwt.js` and create the JWT Strategy

```js
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

const { JWT_SECRET } = require('../config');

const options = {
  secretOrKey: JWT_SECRET,
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
  algorithms: ['HS256']
};

const jwtStrategy = new JwtStrategy(options, (payload, done) => {
  done(null, payload.user);
});
```

## Update Client

Update all of the API methods to include the `Authorization` header with `Bearer token`.

```js
  const search = function (path, query) {
    return $.ajax({
      type: 'GET',
      url: path,
      dataType: 'json',
      data: query,
      headers: { 'Authorization': `Bearer ${store.authToken}` }
    });
  };
  const details = function (path) {
    return $.ajax({
      type: 'GET',
      dataType: 'json',
      url: path,
      headers: { 'Authorization': `Bearer ${store.authToken}` }
    });
  };
  const update = function (path, obj) {
    return $.ajax({
      type: 'PUT',
      url: path,
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify(obj),
      headers: { 'Authorization': `Bearer ${store.authToken}` }
    });
  };
  const create = function (path, obj) {
    return $.ajax({
      type: 'POST',
      url: path,
      contentType: 'application/json',
      dataType: 'json',
      processData: false,
      data: JSON.stringify(obj),
      headers: { 'Authorization': `Bearer ${store.authToken}` }
    });
  };
  const remove = function (path) {
    return $.ajax({
      type: 'DELETE',
      dataType: 'json',
      url: path,
      headers: { 'Authorization': `Bearer ${store.authToken}` }
    });
  };
```


```js
  api.create('/v3/login', loginUser)
    .then(response => {
      store.authToken = response.authToken; // <<== Add this
      store.authorized = true;
      loginForm[0].reset();

      const payload = JSON.parse(atob(response.authToken.split('.')[1]));
      store.currentUser = payload.user;

      return Promise.all([
        api.search('/v3/notes'),
        api.search('/v3/folders'),
        api.search('/v3/tags')
      ]);
    })
```

Add a `.toggle()` based on `store.authorized`

```js
$('.signup-login').toggle(!store.authorized);
```

```js
  function handleErrors(err) {
    if (err.status === 401) {
      store.authorized = false;
      noteful.render();
    }
    showFailureMessage(err.responseJSON.message);
  }
```

```js
.catch(handleErrors);
```