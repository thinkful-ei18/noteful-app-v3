# Challenge 14 - Mongo Relationships

In this challenge, you will add Folders to the Noteful app, associate the notes with the folders, create routes and tests for the folders and update the routes and test for the notes.

## Requirements

* Create folder schema, update notes schema and seed the database
* Create folder endpoints and notes endpoints
* Update `server.js`
* Create tests. Goal, 100% coverage for routes files
* Update the client

## Create/Update schemas and seed the database

### Create Folder Model and folders.json

Create a folder simple model with a name field. And create a JSON file with sample data for the seed database process.

* `name` is a String and is `unique`

```json
[
  {
    "_id": "111111111111111111111100",
    "name": "Archive"
  },
  {
    "_id": "111111111111111111111101",
    "name": "Drafts"
  },
  {
    "_id": "111111111111111111111102",
    "name": "Personal"
  },
  {
    "_id": "111111111111111111111103",
    "name": "Work"
  }
]
```

### Update Note Model and update notes.json with FolderId Reference

Now, we can update the Note model adding a folderId which associates the note with a specific Folder. Add the following to the schema.

```js
folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }
```

Let's update the `notes.json`, below is a sample note with its folder set to the _id for `Archive`. Update the rest of the objects.

```json
  {
    "_id": "000000000000000000000000",
    "title": "5 life lessons learned from cats",
    "content": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "folderId": "111111111111111111111100"
  }
```

### Update `seed-database.js`

Update the `seed-database.js` file to insert folders along with the notes.

* Add `.insertMany()` for folders

```js
// Require statements removed for brevity

mongoose.connect(MONGODB_URI)
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => Folder.insertMany(seedFolders))
  .then(() => Note.insertMany(seedNotes))
  .then(() => Note.createIndexes())
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });
```

## Create/Update endpoints

### Create a `/routes/folders.js` with the standard CRUD endpoints and mount on `server.js`

Create a new `/routes/folders.js` file and add enough information to mount it on `server.js`. Below is a barebones skeleton.

```js
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const Folder = require('../models/folder');
const Note = require('../models/note');

// FOLDER ROUTER ENDPOINTS GO HERE

module.exports = router;
```

Now update `server.js`. Require the new router and "mount it" on `/v3`. This should be very similar to requiring and mounting the notes router.

Now you are ready to create the CRUD endpoints. Below is an outline of the endpoints along with requirements to help guide you.

* `GET` all `/folders`
  * Sort the respons by by `name`
* `GET` `/folders` by `id`
  * Add validation which protects against invalid Mongo ObjectIds and prevents needless database queries.
  * Add condition which checks the results and returns a 404 Not Found when needed
* `POST` `/folders` to create a new folder
  * Add validation which protects against missing `name` field
  * Add condition error check which catches duplicate folder names and provides helpful user feedback (see below)
  * A successful insert returns a `location` header and a 201 status
* `PUT` `/folders` by `id` to update a folder name
  * Add validation which protects against missing `name` field
  * Add validation which protects against invalid Mongo ObjectIds and prevents needless database queries.
  * Add condition error check which catches duplicate folder names and provides helpful user feedback
* `DELETE` `/folders` by id which deletes the folder **AND** the notes contents
  * A successful delete returns a 204 status

The current error handling process catches errors and returns them to the user. Usually this is fine, but returning database errors is considered a bad practice. Besides being a poor user-experience then can sometimes provide information which hackers can exploit. So, in the `.catch()` you will inspect the current error. If it contains error code `11000`, which is Mongo's code for "duplicate key error", then you will create a user-friendly error and status. Finally, call `next(err)` to trigger our error handler process to return the error to the user.

Update you `.catch()` to the following

```js
  .catch(err => {
    if (err.code === 11000) {
      err = new Error('The folder name already exists');
      err.status = 400;
    }
    next(err);
  });
```

> Stuck? Check the solution file for hints!

### BONUS CHALLENGE(s)

After you have completed the rest of the challenge, comeback to this bonus challenge.

Currently, deleting a folder performs a SQL-style cascading deleting on Notes. IOW, deleting a folder deletes all the associated Notes. The challenge is to implement No-SQL equivalents to the other SQL-style ON DELETE restrictions.

* Create a No-SQL equivalent to ON DELETE SET NULL. IOW, when a user deletes a folder, then set the folderId to NULL (or remove the folderId property) from all the associated notes

* Create a No-SQL equivalent to ON DELETE SET RESTRICT. IOW, when a user deletes a folder, first check to see if there are any associated notes. If there are associated notes, then respond with an error which informs the user the action is prohibited. If there are no associated notes, then delete the folder.

### Update `/routes/notes.js` endpoints to use folders

* `GET` all `/notes`
  * Add `folderId` to the response
  * Add filter which captures the incoming `folderId` from the querystring and queries the database to find notes with the given `folderId`.
* `GET` `/notes` by id
  * Add `folderId` to the response
* `POST` `/notes`
  * Update the create process to capture `folderId` from incoming object and save it to the database.
* `PUT` `/notes`
  * Update the update process to capture `folderId` from incoming object and save it to the database.
* `DELETE` `/notes`
  * No change :)

## Integration Testing

** GOAL: 100% code coverage for `/routes/notes.js` and `/routes/folders.js`**

### Create `/test/folders.test.js`

Create a `/test/folders.test.js` file, the basic structure in similar to `/test/notes.test.js`. Update the require statements and the Mocha life-cycle hooks to use and seed folders instead of notes.

Now, create tests to verify the functionality of the `/folders` endpoints. As your work through the tests, check the code coverage for clues on which aspects of your code you have validated and which still needs tests.

### Update `/test/notes.test.js`

Don't forget to update `/test/notes.test.js`. You added new features to these endpoints earlier and that functionality needs to be tested to ensure it continues to work properly. 

* Update the require statements to include folders.
* Update the life-cycle hooks to seed the database with both notes **and** folders
* Update the existing tests to properly handle and check for `folderId`

Check your code coverage. Are there any lines of code which are not covered by tests? Create tests for any outstanding features.

## Update the Client

### Activate folders search on client

Uncomment the folders search on `index.js`. If the endpoints are functioning as specified, then the client work properly.

```js
  api.search('/v3/folders')
    .then(response => {
      store.folders = response;
      noteful.render();
    });
```