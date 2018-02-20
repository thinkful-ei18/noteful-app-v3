/* global $ noteful api store */
'use strict';

$(document).ready(function () {
  noteful.bindEventListeners();

  Promise.all([
    api.search('/v3/notes'),
    api.search('/v3/folders'),
    api.search('/v3/tags')
  ])
    .then(([notes, folders, tags]) => {
      store.notes = notes;
      store.folders = folders;
      store.tags = tags;
      noteful.render();
    });

});

