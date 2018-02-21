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
router.post('/login', localAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });

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