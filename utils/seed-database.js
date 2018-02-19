'use strict';

const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');
const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');
const seedTags = require('../db/seed/tags');

mongoose.connect(MONGODB_URI)
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => {
    return Promise.all([
      Note.insertMany(seedNotes),
      Note.createIndexes(), // trigger text indexing for $search
      Folder.insertMany(seedFolders),
      Tag.insertMany(seedTags),
    ]);
  })
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });

Note.on('index', () => {
  console.info('notes index is done building');
});

Folder.on('index', () => {
  console.info('folder index is done building');
});

Tag.on('index', () => {
  console.info('tag index is done building');
});
