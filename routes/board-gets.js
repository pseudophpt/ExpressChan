var Board = require('../ib-interface');
var svgCaptcha = require('svg-captcha');
var makeHtml = require('./make-html');
var settings = require('../settings');

const captcha_settings = {
  size: 6,
  noise: 4,
  color: true,
}


module.exports.front = function(req, res, next) {
  // Get page number and board name
  var page = req.query.page;
  var board_name = req.params.board;

  // Create board instance
  var board = new Board(board_name);

  // If no page set, default to 1.
  if (!page) {
    page = 1;
  }

  var pages;
  
  // Make captcha
  var captcha = svgCaptcha.create(captcha_settings);

  // Set session captcha
  req.session.captcha = captcha.text;
  req.captcha_data = captcha.data;

  req.is_front = true;

  // Get pages
  board.getThreadCount().then(data => {
    pages = Math.ceil(data.count / settings.threads_per_page);
    if (pages & (page > pages | page < 1)) {
      next();
      return Promise.resolve();
    }
    return board.getThreads(page);
  }).then(data => {
    req.posts = data;
    req.pages = pages;
    next();
  }).catch(err => {
    next(err);
  });
}

module.exports.thread = function(req, res, next) {
  // If invalid thread id specified, throw error.
  var id = req.query.id;
  if (! id) {
    next();
  }
  if (id < 0) {
    next();
  }

  // Make captcha
  var captcha = svgCaptcha.create(captcha_settings);

  req.session.captcha = captcha.text;
  req.captcha_data = captcha.data;

  // Make instance of board
  var board_name = req.params.board;
  var board = new Board(board_name);

  req.is_front = false;

  // Get page
  board.getPosts(id).then(data => {
    if (!data) {
      next();
    }
    req.posts = data;
    next();
  }).catch(err => {
    next(err);
  });
};

module.exports.login = function(req, res, next) {
  if ((req.session[board_name] ? req.session[board_name].logged_in : false) | req.session.logged_in) {
    res.redirect(302, '/' + req.params.board);
  }
  var board_name = req.params.board;
  next();
}

module.exports.logout = function(req, res, next) {
  if (req.session[req.params.board]) {
    req.session[req.params.board].logged_in = false;
    req.session[req.params.board].passhash = '';
  }
  req.session.logged_in = false;
  req.session.passhash = '';
  res.redirect('/' + req.params.board);
}