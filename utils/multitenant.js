'use strict';

const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');
const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

function validateFolderId(userId, folderId) {
  if (!folderId) {
    return Promise.resolve();
  }
  return Folder.findOne({ _id: folderId, userId })
    .then(result => {
      if (!result) {
        return Promise.reject('Invalid');
      }
    });
}

function validateTagIds(userId, tags = []) {
  if (!tags.length) {
    return Promise.resolve();
  }
  return Tag.find({ $and: [{ _id: { $in: tags }, userId }] })
    .then(results => {
      if (tags.length !== results.length) {
        return Promise.reject('Invalid');
      }
    });
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    const userId = '333333333333333333333300';
    const body = {
      userId: userId,
      title: 'cats cats cats',
      content: 'purr purr purr',

      // FolderId checks ====================
      // no folderId
      // folderId: '111111111111111111111101'  //good folderId
      // folderId: '222222222222222222222201' //bad folderId

      // Tags checks ====================
      // no tags
      // tags: [], //empty tags array
      // tags: ['222222222222222222222200'], // one valid tag
      // tags: ['555555555555555555555500'], // one invalid tag
      // tags: ['222222222222222222222201', '555555555555555555555500'], // one valid, one invalid tag
      // tags: ['222222222222222222222200', '222222222222222222222201', '222222222222222222222202'], // multiple valid
      // tags: ['555555555555555555555500', '555555555555555555555501', '555555555555555555555502'], // multiple valid

    };

    let folderId = body.folderId;
    let tags = body.tags;

    // return validateTagIds(userId, tags);

    return Promise.all([validateFolderId(userId, folderId), validateTagIds(userId, tags)])
      .then(() => Note.create(body))
      .then(result => {
        console.log(3, result);
      })
      .catch(err => {
        console.error('denied', err);
      });

  })
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
