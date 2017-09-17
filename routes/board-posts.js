
var requestIp = require('request-ip');
var settings = require('../settings');
var Board = require('../ib-interface');
var bcrypt = require('bcrypt');

module.exports.front = function(req, res, next) {
  var board_name = req.params.board;
  // Image upload
  
  var filename = '';
  var error = false;

  if (req.file) {
    filename = req.file.filename;
  }

  var ip = requestIp.getClientIp(req);

  board = new Board(req.params.board);
  board.newThread(req.text, ip, filename).then(() => {
    res.redirect('/' + board_name);
  }).catch(err => {
    next(err);
  });
}

module.exports.thread = function(req, res, next) {
  if (! req.query.id) {
    next();
  }
  if (req.query.id < 0) {
    next();
  }

  var ip = requestIp.getClientIp(req);

  var filename = '';
  if (req.file) {
    var filename = req.file.filename;
  };

  board = new Board(req.params.board);
  board.newPost(req.text, req.query.id, ip, filename).then(() => {
    res.redirect('/' + req.params.board + '/thread?id=' + req.query.id);
  }).catch(err => {
    next(err);
  });
}

module.exports.login = function(req, res, next) {
  var admin = true;
  bcrypt.compare(req.body.password, settings.boards[req.params.board].password_hash).then(is_correct => {
    if (is_correct) {
      admin = false;
      return Promise.resolve(true);
    }
    else return bcrypt.compare(req.body.password, settings.admin_password_hash);
  }).then(is_correct => {
    if (!is_correct) {
      next(new Error('Incorrect password.'));
      return Promise.reject();
    }
    else if (admin) {
      return bcrypt.hash(req.body.password, settings.admin_password_salt);
    } 
    else return bcrypt.hash(req.body.password, settings.boards[req.params.board].password_salt);
  }).then(hash => {
    if (admin) {
      req.session.passhash = hash;
      req.session.logged_in = true;
    } else {
      req.session[req.params.board] = {
        passhash: hash,
        logged_in: true
      };
    }
    res.redirect(302, '/' + req.params.board);
  }).catch(err => {
    next(err);
  });
}

module.exports.ban = function(req, res, next) {
  var board = new Board(req.params.board);
  if ((req.session[req.params.board] ? req.session[req.params.board].logged_in : false)) {
    if (req.session[req.params.board].passhash == settings.boards[req.params.board].password_hash) {
      if (req.body.ban_length == 0 ) {
        next(new Error('You must be an admin to permaban.'));
      } else if (req.body.ban_length > settings.max_mod_ban_length) {
        next(new Error('You must be an admin to ban longer than ' + settings.max_mod_ban_length + ' ' + settings.ban_unit));
      }
      else {
        board.boardBanByPostId(req.query.id, req.body.ban_length, req.body.prune).then(() => {
          res.redirect(302, '/' + req.params.board);
        }).catch(err => {
          next(err);
        });
      }
    }
  }
  if (req.session.logged_in) {
    if (req.session.passhash == settings.admin_password_hash) {
      if (req.body.sitewide) {
        board.siteBanByPostId(req.query.id, req.body.ban_length, req.body.prune).then(() => {
          res.redirect(302, '/' + req.params.board);
        }).catch(err => {
          next(err);
        });
      }
      else {
        board.boardBanByPostId(req.query.id, req.body.ban_length, req.body.prune).then(() => {
          res.redirect(302, '/' + req.params.board);
        }).catch(err => {
          next(err);
        });
      }
    }
  }
}

module.exports.prune = function(req, res, next) {
  var board = new Board(req.params.board);
  if ((req.session[req.params.board] ? req.session[req.params.board].logged_in : false)) {
    if (req.session[req.params.board].passhash == settings.boards[req.params.board].password_hash) {
      board.prunePost(req.query.id).then(() => {
        res.redirect(302, '/' + req.params.board);
      }).catch(err => {
        next(err);
      });
    }
    else next(new Error('Forbidden.'), 403);
  }
  else if (req.session.logged_in) {
    if (req.session.passhash == settings.admin_password_hash) {
      board.prunePost(req.query.id).then(() => {
        res.redirect(302, '/' + req.params.board);
      }).catch(err => {
        next(err);
      });
    }
    else next(new Error('Forbidden.'), 403);
  }
  else next(new Error('Forbidden.'), 403);
};