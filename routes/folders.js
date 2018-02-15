'use strict';

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const Folder = require('../models/folder');
const Note = require('../models/note');

/* ========== GET/READ ALL ITEMS ========== */
router.get('/folders', (req, res, next) => {
  Folder.find()
    .sort('name')
    .then(results => {
      res.json(results);
    })
    .catch(next);
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/folders/:id', (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Folder.findById(id)
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
router.post('/folders', (req, res, next) => {
  const { name } = req.body;

  const newFolder = { name };

  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Folder.create(newFolder)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/folders/:id', (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const updateFolder = { name };

  Folder.findByIdAndUpdate(id, updateFolder, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/folders/:id', (req, res, next) => {
  const { id } = req.params;

  // Manual "cascading" delete to ensure integrity
  const folderRemovePromise = Folder.findByIdAndRemove({ _id: id });  // NOTE **underscore** _id
  const noteRemovePromise = Note.deleteMany({ folderId: id });

  /* 
   * EXTRA BONUS CHALLENGES:
   * Currently, deleting a folder performs a SQL-style cascading deleting on Notes.
   * IOW, deleting a folder deletes all the associated Notes. The challenge is to 
   * implement No-SQL equivalents to the other SQL-style ON DELETE restrictions.
   * 
   * - Create a No-SQL equivalent to ON DELETE SET NULL. IOW, when a user deletes 
   *   a folder, then set the folderId to NULL (or remove the folderId property) 
   *   from all the associated notes
   * 
   * - Create a No-SQL equivalent to ON DELETE SET RESTRICT. IOW, when a user deletes
   *   a folder, first check to see if there are any associated notes. If there are 
   *   associated notes, then respond with an error which informs the user the action
   *   is prohibited. If there are no associated notes, then delete the folder.
   */

  Promise.all([folderRemovePromise, noteRemovePromise])
    .then(resultsArray => {      
      const folderResult = resultsArray[0];
      
      if (folderResult) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch(next);
});

module.exports = router;