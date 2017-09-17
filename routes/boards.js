var express = require('express');
var promise = require('bluebird');
var router = express.Router();
var boardGets = require('./board-gets');
var boardPosts = require('./board-posts');
var boardMiddleware = require('./board-middleware');
var makeHtml = require('./make-html');


router.get('/:board', boardMiddleware.checkExists, boardGets.front, makeHtml.displayPage);
router.post('/:board', boardMiddleware.checkExists, boardMiddleware.upload.single('image'), boardMiddleware.checkErrors, boardMiddleware.checkCaptcha, boardPosts.front);
router.get('/:board/thread', boardMiddleware.checkExists, boardGets.thread, makeHtml.displayPage);
router.post('/:board/thread', boardMiddleware.checkExists, boardMiddleware.upload.single('image'), boardMiddleware.checkErrors, boardMiddleware.checkCaptcha, boardPosts.thread);
router.get('/:board/login', boardMiddleware.checkExists, boardGets.login, makeHtml.displayLoginPage);
router.post('/:board/login', boardMiddleware.checkExists, boardPosts.login);
router.get('/:board/logout', boardMiddleware.checkExists, boardGets.logout);
router.post('/:board/ban', boardMiddleware.checkExists, boardPosts.ban);
router.post('/:board/prune', boardMiddleware.checkExists, boardPosts.prune);


module.exports = {
  router: router
};