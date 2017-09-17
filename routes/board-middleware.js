var sanitizeHtml = require('sanitize-html');
var fs = require('fs');
var settings = require('../settings');
var multer = require('multer');
var mime = require('mime');
var path = require('path');

module.exports.checkCaptcha = function(req, res, next) {
  if (req.session.captcha != null) {
    if (req.body.captcha_text == req.session.captcha) {
      // If captcha is correct, go to next middleware
      next();
    }
    else {
      // Otherwise, reset captcha to protect from brute forcing.
      req.session.captcha = null;
      fs.unlink(req.file.path, err => {
        if (err) next (err);
        next(new Error('Incorrect captcha.'));
      });
    }
  }
  else {
    fs.unlink(req.file.path, err => {
      if (err) next(err);
      else next(new Error('Captcha not found or expired. Go back and refresh for a new one.'));
    });
  }
}

module.exports.checkExists = function(req, res, next) {
  if (!settings.boards[req.params.board]) {
    // If board doesn't exist, forward to 404
    next(new Error('Board not found'));
  }
  next();
}

module.exports.checkErrors = function(req, res, next) {
  var text = sanitizeHtml(req.body.post_text, {
    allowedTags: [ 'b', 'i', 'em', 'strong'],
    allowedSchemes: [ 'http', 'https']
  });

  if (text.length < settings.min_chars) {
    next(new Error('Posts must be at least ' + settings.min_chars + ' characters long.'));
  };

  if (text.length > settings.max_chars) {
    next(new Error('Posts can\'t be more than ' + settings.max_chars + ' characters long.'));
  };

  req.text = text;
  next();

}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'public/images/' + req.params.board)
  },
  filename: function (req, file, cb) {
    var ext = "." + mime.extension(file.mimetype);
    require('crypto').pseudoRandomBytes(16, function (err, raw) {
      file_name = (err ? undefined : raw.toString('hex') ) + ext;
      cb(null, file_name);
    });
  },
});

module.exports.upload = multer({storage : storage, 
  fileFilter: function (req, file, cb) {
    if (settings.require_image & !file) {
      cb(new Error('Image required.'));
    }
    if(settings.allowed_images.indexOf(mime.extension(file.mimetype)) == -1) {
      cb(new Error('Invalid filetype.'));
    }
    cb(null, true)
  },
  limits: {
    fieldNameSize: 100,
    fileSize: 1024 * 1024 * settings.max_filesize, // 2.0MB
    files: 1,
  }});