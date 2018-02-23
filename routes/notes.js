'use strict';

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

const router = express.Router();

// Protect endpoints using JWT Strategy
router.use('/notes', passport.authenticate('jwt', { session: false, failWithError: true }));

function validateFolderId(userId, folderId) {
  if (!folderId) {
    return Promise.resolve();
  }
  return Folder.findOne({ _id: folderId, userId })
    .then(result => {
      if (!result) {
        return Promise.reject('InvalidFolder');
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
        return Promise.reject('InvalidTag');
      }
    });
}

/* ========== GET/READ ALL ITEMS ========== */
router.get('/notes', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;
  const userId = req.user.id;

  let filter = { userId };
  /**
   * Use RegEx ($regex) Operator to find documents where title contain searchTerm
   *  title : {$regex: re}
   * 
   * BONUS CHALLENGE - Search both title and content using $OR Operator
   *   filter.$or = [{ 'title': { $regex: re } }, { 'content': { $regex: re } }];
  */

  /* if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.title = { $regex: re };
  } */

  let projection = {};
  let sort = 'created'; // default sorting

  // if querying by searchTerm, then add to filter
  if (searchTerm) {
    filter.$text = { $search: searchTerm };
    projection.score = { $meta: 'textScore' };
    sort = projection;
  }

  // if querying by folder, then add to filter
  if (folderId) {
    filter.folderId = folderId;
  }

  // if querying by tags, then add to filter
  if (tagId) {
    filter.tags = tagId;
  }

  Note.find(filter, projection)
    .select('title content created folderId tags')
    .populate('tags')
    .sort(sort)
    .then(results => {
      res.json(results);
    })
    .catch(next);
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findOne({ _id: id, userId })
    .select('title content created folderId tags')
    .populate('tags')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(next);
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/notes', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = { title, content, folderId, tags, userId };
  const valFolderIdProm = validateFolderId(userId, folderId);
  const valTagIdsProm = validateTagIds(userId, tags);

  Promise.all([valFolderIdProm, valTagIdsProm])
    .then(() => Note.create(newItem))
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err === 'InvalidFolder') {
        err = new Error('The folder is not valid');
        err.status = 400;
      }
      if (err === 'InvalidTag') {
        err = new Error('The tag is not valid');
        err.status = 400;
      }
      next(err);
    });

  // Note.create(newItem)
  // .then(result => {
  //   res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
  // })
  // .catch(next);
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const updateItem = { title, content, tags, userId, folderId };

  if (mongoose.Types.ObjectId.isValid(folderId)) {
    updateItem.folderId = folderId;
  }

  const options = { new: true };

  const valFolderIdProm = validateFolderId(userId, folderId);
  const valTagIdsProm = validateTagIds(userId, tags);

  Promise.all([valFolderIdProm, valTagIdsProm])
    .then(() => Note.findByIdAndUpdate(id, updateItem, options)
      .select('id title content folderId tags')
      .populate('tags')
    )
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err === 'InvalidFolder') {
        err = new Error('The folder is not valid');
        err.status = 400;
      }
      if (err === 'InvalidTag') {
        err = new Error('The tag is not valid');
        err.status = 400;
      }
      console.log(err);

      next(err);
    });

  // Note.findByIdAndUpdate(id, updateItem, options)
  //   .select('id title content folderId tags')
  //   .populate('tags')
  //   .then(result => {
  //     if (result) {
  //       res.json(result);
  //     } else {
  //       next();
  //     }
  //   })
  //   .catch(next);
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  Note.findOneAndRemove({ _id: id, userId })
    .then(count => {
      if (count) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch(next);
});

module.exports = router;