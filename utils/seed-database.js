'use strict';

const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');
const Note = require('../models/note');
const Folder = require('../models/folder');

const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');

mongoose.connect(MONGODB_URI)
  .then(() => {
    return mongoose.connection.db.dropDatabase()
      .then(result => {
        console.info(`Dropped Database: ${result}`);
      });
  })
  // .then(() => {
  //   return Note.insertMany(seedNotes)
  //     .then(results => {
  //       console.info(`Inserted ${results.length} Notes`);
  //     });
  // })
  .then(() => {
    // Use Promise.all below, 'cause we can
    const noteInsertPromise = Note.insertMany(seedNotes);
    const folderInsertPromise = Folder.insertMany(seedFolders);

    return Promise.all([noteInsertPromise, folderInsertPromise])
      .then(([noteResults, folderResults]) => {
        console.info(`Inserted ${noteResults.length} Notes`);
        console.info(`Inserted ${folderResults.length} Folders`);
      });
  })
  .then(() => Note.createIndexes())
  .then(() => {
    return mongoose.disconnect()
      .then(() => {
        console.info('Disconnected');
      });
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });
