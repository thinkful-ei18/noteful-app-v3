# Challenge

In this challenge you will update the `/login` endpoint to create and return a JWT. You will also create a Passport JWT Strategy and use it protect all the `notes`, `folder` and `tags` endpoints.

## Requirements

## Configure JWT settings

Add the following JWT settings to `config.js`.

```js
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
```

Notice that `JWT_SECRET` does not have a fallback value so it must get the value from an environment variable. Let's set that up now.

There are a few ways to setup an environment variables like creating them in the shell or defining them in your `.bash_profile` or `bash_rc`. We'll, however, use the `dotenv` NPM package which allows you to define environment variable on a per-project basis.

First, install the npm package `npm install dotenv`. Then create a file named `.env` with the following:

```sh
JWT_SECRET=correct-horse-battery-staple
```

The `JWT_SECRET` is used by the JWT library to create secure token. It is essential that the value remain private so it is critical that the `.env` file does not get committed and pushed to GitHub. So before proceeding, verify that `.env` is listed in the `.gitignore` file.

Great. Now you can require and config the dotenv package in your `server.js`. At the top of the file, add the following:

```js
require('dotenv').config();
```

## Add JWT to `/routes/auth.js` router

Currently the `/login` endpoint returns the current user. You need to update it to return a JWT which contains the user information. 

First, `npm install` the `jsonwebtoken` and require it. Then create a function which accepts a user object and generates a signed JWT. Note, it uses `JWT_SECRET` and `JWT_EXPIRY` which you'll need to require from the `config.js`

```js
function createAuthToken (user) {
  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
}
```

Now you can update the `/login` endpoint. Upon login, Passport will set the current user document to `req.user`. Call `createAuthToken` passing in `req.user` and respond with the token.

```js
router.post('/login', localAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});
```

## JWT strategy

Now that you can generate and return JWTs, you need to create a Passport JWT Strategy and use it protect endpoints.

First `npm install` the `passport-jwt` package and then create a `/passport/jwt.js` file

In the `/passport/jwt.js` file, require the package and destructure 2 properties from the the library: `Strategy` and `ExtractJwt`. Below is an example that grabs the `Strategy` property and sets the `JwtStrategy` const. And it destructures the `ExtractJwt` property and sets it to a const of the same name.

```js
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
```

Create an options object with the follwing settings. Using the options create a new JWT strategy. be sure to export the strategy so it can be used elsewhere.

```js
const options = {
  secretOrKey: JWT_SECRET,
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
  algorithms: ['HS256']
};

const jwtStrategy = new JwtStrategy(options, (payload, done) => {
  done(null, payload.user);
});
```

## Update `server.js`

Next, wire-up the JWT Strategy on `server.js`.

Require the strategy and configure passport to use it. Add the following to the appropriate sections of `server.js`.

```js
const jwtStrategy = require('./passport/jwt');
```

```js
passport.use(localStrategy);
passport.use(jwtStrategy);
```

The order that you use the routers and the JWT Strategy is important. The `usersRouter` and `authRouter` need to be accessible to users without a JWT so they need to be mounted prior to utilizing `jwt`. The `notesRouter`, `foldersRouter` and `tagsRouter` routers should be protected so they are mounted after utilizing `jwt`.

```js
app.use('/v3', usersRouter);
app.use('/v3', authRouter);

// Endpoints below this require a valid JWT
app.use(passport.authenticate('jwt', { session: false, failWithError: true }));

// Mount routers
app.use('/v3', notesRouter);
app.use('/v3', foldersRouter);
app.use('/v3', tagsRouter);
```

The basic JWT structure is now ready to go. Test it out using Postman. Create a new user and login. Then, using the Bearer Token authorization and the generated `authToken`, attempt to access the protected endpoints.

## Add `/refresh` endpoint to `/routes/auth.js`

To finish the server-side implementation, you need to add a `/refresh` endpoint that allows users to exchange older tokens with newer ones. Add the following to the `/routes/auth.js`.

```js
const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

```

## Update Client

Finally, update the client. The 2 key aspects are capturing the `authToken` and using it for all the api.

In `noteful.js`, start by updating the `handleLoginSubmit()` functionSimply define an `authToken` property on the store and set it to the incoming authToken value.

```js
  api.create('/v3/login', loginUser)
    .then(response => {
      store.authToken = response.authToken; // <<== Add this...
      store.authorized = true;  // <<== And this!
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

Now, update all of the API methods to include the `Authorization` header with `Bearer token`.

In `api.js`, add the following to each API method.

```js
  headers: { 'Authorization': `Bearer ${store.authToken}` }
```

Here is `search` as an example.

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
```

When the user logs in, you want to hide the `.signup-login` overlay. And when the token expires you want to show it again.

Back in `noteful.js`, add a `.toggle()` based on `store.authorized` to the `render()` function.

```js
$('.signup-login').toggle(!store.authorized);
```

Finally, let's improve the handling of error messages. Add the following function to `noteful.js`

```js
  function handleErrors(err) {
    if (err.status === 401) {
      store.authorized = false;
      noteful.render();
    }
    showFailureMessage(err.responseJSON.message);
  }
```

And add a `.catch(handleErrors);` to each API call. Now, if the client receives a 401 error, the `store.authorized` is set to `false` which triggers the login overlay to appear.

