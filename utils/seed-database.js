'use strict';

const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');
const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');
const seedTags = require('../db/seed/tags');
console.log(seedTags);
console.log(MONGODB_URI);

mongoose.connect(MONGODB_URI)
  .then(() => mongoose.connection.db.dropDatabase())

  // In Serial
  // .then(() => Note.insertMany(seedNotes))
  // .then(() => Folder.insertMany(seedFolders))
  // .then(() => Tag.insertMany(seedTags))
  // .then(() => Note.createIndexes())
  // .then(() => Folder.createIndexes())
  // .then(() => Tag.createIndexes())
  // .then(() => mongoose.disconnect())  

  // In Parallel 
  .then(() => {
    return Promise.all([
      Note.insertMany(seedNotes),
      Folder.insertMany(seedFolders),
      Tag.insertMany(seedTags),
      Note.createIndexes(),
      Folder.createIndexes(),
      Tag.createIndexes()
    ]);
  })
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });


Note.on('index', function (err) {
  console.log('notes index is done building');
});
Folder.on('index', function (err) {
  console.log('folder index is done building');
});
Tag.on('index', function (err) {
  console.log('tag index is done building');
});
