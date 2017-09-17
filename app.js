var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var helmet = require('helmet');
var settings = require('./settings');
var session = require('express-session');

var boards = require('./routes/boards');
var makeHtml = require('./routes/make-html');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(helmet());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({
  secret: settings.secret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 300000 }
}));

app.use('/', boards.router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  var stack = ''
  if (err.stack) {
    stack = '<p>' + err.stack.replace(/(?:\r\n|\r|\n)/g, '</p><p>') + '</p>';
  }
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.locals.stack = req.app.get('env') === 'development' ? stack : {};

  // render the error page
  res.status(err.status || 500);
  var board_name = req.params.board;
  var board_array = makeHtml.formatBoardsArray(Object.keys(settings.boards), board_name);
  var return_text = '<a href="/"> [Return to home]</a>';
  var stylesheet = req.cookies.theme ? req.cookies.theme : '/stylesheets/light.css/';
  res.render('error', {
    boards: board_array,
    return_text: return_text,
    stylesheet: stylesheet
  });
});

module.exports = app;
