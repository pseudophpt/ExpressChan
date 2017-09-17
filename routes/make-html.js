module.exports.formatBoardsArray = formatBoardsArray;
var settings = require('../settings');
var path = require('path');
var Board = require('../ib-interface');

module.exports.displayLoginPage = function (req, res, next) {
  var board_name = req.params.board;
  var board_array = formatBoardsArray(Object.keys(settings.boards), board_name);
  var return_text = '<a href="/' + board_name + '"> [Return to /' + board_name + '/]</a>';
  var stylesheet = req.cookies.theme ? req.cookies.theme : '/stylesheets/light.css/'
  res.render('login', {
    boards: board_array,
    return_text: return_text,
    stylesheet: stylesheet
  });
  next();
}

module.exports.displayPage = function (req, res, next) {
  var board_name = req.params.board;
  var session = req.session;
  var cookies = req.cookies;
  var captcha_data = req.captcha_data;
  var posts = req.posts;
  var page = req.query.page;
  var pages = req.pages;
  var board = new Board(board_name);
  var is_front = req.is_front;

  var board_desc = settings.boards[board_name].description;
  var login_link;
  var login_text;
  var logged_in = false;
  var admin = false;
  if ((session[board_name] ? session[board_name].logged_in : false) | session.logged_in) {
    login_link = '/' + board_name + '/logout';
    login_text = '[Log out]';
    logged_in = true;
    if (session.logged_in) {
      admin = true;
    }
  }
  else {
    login_link = '/' + board_name + '/login';
    login_text = '[Log in]';
  }
  var board_text = '/' + board_name + '/' + ' - ' + board_desc;
  var board_array = formatBoardsArray(Object.keys(settings.boards), board_name);
  var return_text;
  if (is_front) {
    return_text = '<a href="/">[Return to home]</a>'
  }
  else {
    return_text = '<a href="/' + board_name + '"> [Return to /' + board_name + '/]</a>';
  }

  var posts_html = formatPostsSection(posts, is_front, board_name, logged_in, admin);
  var footer_html = '';
  var newpost_text;
  if (is_front) {
    newpost_text = 'New Thread';
    footer_html = formatFooter(pages, page, board_name);
  }
  else {
    newpost_text = 'New Post';
  }

  var filesize = 'Max filesize: ' + settings.max_filesize + ' MB, ';
  var filetype = 'Allowed filetypes: ' + settings.allowed_images.join(', ')

  // Light stylesheet as default
  var stylesheet = cookies.theme ? cookies.theme : '/stylesheets/light.css/';

  res.render('board', { 
    board_text: board_text,
    banner_link: '/images/banner.png',
    boards: board_array,
    posts: posts_html,
    footer: footer_html,
    newpost_text: newpost_text,
    return_text: return_text,
    login_link: login_link,
    login_text: login_text,
    stylesheet: stylesheet,
    captcha: captcha_data,
    filesize: filesize,
    filetype: filetype
  });
  next();
}

function formatFooter (pages, page, board_name) {
  if (pages == 0) {
    return '';
  }
  var footer_html =  '<div style="text-align: center;">';
  footer_html += '[ '
  for (var i = 1; i <= pages; i++) {
    if (i == page) {
      footer_html += '<span class="highlighted">(' + page + ')</span>';
    }
    else {
      footer_html += '<a href="/' + board_name + '/?page=' + i + '">' + i + '</a>';
    }
    footer_html += ' ';
  }
  footer_html += ']'
  footer_html += '</div>'
  return footer_html;
}

function formatPostsSection (posts, is_front, board_name, logged_in, is_admin) {
  var posts_html = '';
  if (posts) {
    for (var i = 0; i < posts.length; i++) {
      posts_html += '<div class="panel panel-default">';
      posts_html +=   '<div class="panel-heading post-heading">';
      posts_html +=     '<span class="username">Anonymous</span> '
      if (settings.boards[board_name].tripcode_enabled) {
        posts_html += '<span class="tripcode">!' + posts[i].tripcode.slice(-8) + '</span> ';
      }
      posts_html += '<span class="post-id">#' + posts[i].id + '</span>';
      if (is_admin) {
        posts_html += ' | ' + posts[i].ip;
      }
      if (logged_in) { 
        posts_html +=   ' | <form action="/' + board_name + '/ban?id=' + posts[i].id + '" method="post" class="in-form">';
        posts_html +=       'Length: <input type="text" class="inverse-body" name="ban_length" style="width:40px; border-width: 0px;"> ' + settings.ban_unit + ' / ';
        posts_html +=       'Prune? ';
        posts_html +=       '<input type="checkbox" name="prune" id="checkbox"> / ';
        if (is_admin) {
          posts_html += 'Sitewide? ';
          posts_html +=       '<input type="checkbox" name="sitewide" id="checkbox"> / ';
        }
        posts_html +=       '<input type="submit" class="inverse-body" value="Ban" style="border-width: 0px;">';
        posts_html +=   '</form>';
        posts_html += ' | <form action="/' + board_name + '/prune?id=' + posts[i].id + '" method="post" class="in-form">'
        posts_html +=       '<input type="submit" class="inverse-body" value="Prune" style="border-width: 0px;">';
        posts_html += ' </form> ';
      }
      posts_html += ' | ' + posts[i].timestamp;
      posts_html +=   '</div>';
      posts_html +=   '<div class="panel-body post">';
      posts_html +=     '<p>'
      if (path.extname(posts[i].img) == '.webm') {
        posts_html += '<video controls height="300" class="post-img" src="/images/' + board_name + '/' + posts[i].img + '">';
        posts_html += 'Your browser does not support embedded video.'
        posts_html += '</video>';
      } else if (posts[i].img) {
        posts_html += '<img onclick="toggle_image(this)" class="post-img post-img-only" src="/images/' + board_name + '/' + posts[i].img + '">';
      }
      posts_html +=     formatPostText(posts[i].rawhtml);
      posts_html +=   '</p>';
      if(is_front) {
        posts_html += '<a href = "/' + board_name + '/thread?id=' + posts[i].parent_id + '">View Thread</a>';
      }
      posts_html +=   '</div>';
      posts_html += '</div>';
    }
  }
  return posts_html;
}

function formatBoardsArray (boards, current_board) {
  var array = '[';
  for (var i = 0; i < boards.length; i++) {
    if (boards[i] === current_board) {
      array += ' <span class="highlighted">(' + current_board + ')</span>';
    }
    else {
      // Insert new hyperlink
      array += ' <a href="/' + boards[i] + '">' + boards[i] + '</a>';
    }
  }
  return array + ' ]';
}

function formatPostText(text) {
  return text
    .slice(1, -1) // Remove beginning and ending quotes
    .replace(/(?:\\[rn])+/g, '<br />') // Replace newlines with <br />
    .replace(/\\"/g, '\"') // Unescape quotes
    .replace(/\\'/g, '\'');
}