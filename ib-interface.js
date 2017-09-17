/*
 *  ib-interface.js
 *  
 *  Imageboard interface
 *  Abstracts over db.js
 *  Completely async implementation w/ promises
 *
 *  ExpressChan
 */  

'use strict';

var bcrypt = require('bcrypt');
var settings = require('./settings');
var Schema = require('./db');
var moment = require('moment');
var SQLString = require('sqlstring');

var site = new Schema('SITE');

class Board {
  constructor(board) {
    this.board = board;
    this.schema = new Schema(board);
  }

  makeBoard() {
    return this.schema.addSchema().then(() => {
      return this.schema.addTables();
    })
  }

  pruneThread(thread_id) {
    return this.schema.deleteRowById(thread_id, 'THREADS').then(() => {
      return this.schema.deletePostsByParent(thread_id);
    });
  }

  prunePost(post_id) {
    return this.schema.getRowById(post_id, 'POSTS').then(data => {
      if (data.is_parent) {
        return this.pruneThread(data.parent_id);
      }
      else return this.schema.deleteRowById(post_id, 'POSTS');
    });
  }

  boardBanByPostId(post_id, length, prune) {
    // Get Post ID
    return this.schema.getRowById(post_id, 'POSTS').then(data => {
      // Ban By IP
      return this.boardBanByIP(data.ip, length);
    }).then(() => {
      if (prune) {
        return this.prunePost(post_id);
      }
      else return Promise.resolve();
    });
  }
  
  boardBanByIP(ip, length) {
    var timestamp = getCurrentTimestamp();
    // Pardon all current bans and insert a new site ban
    return this.schema.pardonBans(ip).then(() => {
      return this.schema.insertBan(ip, length, timestamp);
    });
  }

  siteBanByPostId(post_id, length, prune) {
    // Get Post ID
    return this.schema.getRowById(post_id, 'POSTS').then(data => {
      // Ban by IP
      return this.siteBanByIP(data.ip, length);
    }).then(() => {
      // If prune flag set, prune.
      if (prune) {
        return this.prunePost(post_id);
      }
      else return Promise.resolve();
    });
  }

  siteBanByIP(ip, length) {
    var timestamp = getCurrentTimestamp();
    // Pardon all current bans and insert a new site ban
    return site.pardonBans(ip).then(() => {
      return site.insertBan(ip, length, timestamp);
    });
  }

  isBanned(ip) {
    var banned = false;
    var length;
    var end;
    var places;
    return site.getRowByIP(ip, 'BANS').then(data => {
      // If ban exists
      if (data) {
        // Check if ban is valid
        var ban_start = moment(new Date(data.timestamp));
        var now = moment();
        ban_start.add(data.length, settings.ban_unit);
        if (now.isBefore(ban_start) | (data.length == 0)) {
          // The ban hammer has spoken!
          places = 'sitewide';
          banned = true;
          if (data.length) {
            length = 'for ' + data.length + ' ' + settings.ban_unit;
            end = ' until ' + ban_start.format('YYYY-MM-DD HH:mm:ss');;
          }
          else {
            length = 'permanently';
          }
        }
        else {
          // There are sitewide ban records that aren't valid.
          return site.pardonBans(ip);
        }
      }
      // Or it hasn't...
      return Promise.resolve();
    }).then(() => {
      return this.schema.getRowByIP(ip, 'BANS');
    }).then(data => {
      if (data) {
        // Check if ban is valid
        var ban_start = moment(new Date(data.timestamp));
        var now = moment()
        ban_start.add(data.length, settings.ban_unit);
        if (now.isBefore(ban_start) | (data.length == 0)) {
          // The ban hammer has spoken!
          banned = true;
          places = 'on /' + this.schema.board + '/';
          if (data.length) {
            length = 'for ' + data.length + ' ' + settings.ban_unit;
            end = ' until ' + ban_start.format('YYYY-MM-DD HH:mm:ss');;
          }
          else {
            length = 'permanently';
          }
        }
        else {
          // There are board ban records that aren't valid.
          return this.schema.pardonBans(ip);
        }
      // No bans for me!
      } 
      if (banned) {
        return Promise.reject(new Error('You were banned ' + length + ' ' + places + '! You will not be able to post' + end));
      }
      else {
        return Promise.resolve();
      }
    });
  }

  newPost (text, parent_id, ip, img, is_parent, check_banned) {
    // Get timestamp
    var timestamp = getCurrentTimestamp();

    var post_hash;
    var thread_data;
    var id;

    // Protect from SQL Injection
    var escaped_text = SQLString.escape(text);

    return Promise.resolve().then(() => {
      // If already ban checked, don't bother
      if (check_banned) {
        return Promise.resolve(false);
      }
      return this.isBanned(ip);
    }).then(() => {
      return this.schema.getRowById(parent_id, 'THREADS');
    }).then(data => {
      // Get thread salt
      thread_data = data;
      if (settings.boards[this.schema.board].tripcode_enabled) {
        return bcrypt.hash(ip + parent_id + settings.salt, thread_data.thread_salt);
      }
      else return Promise.resolve('');
    }).then(hash => {
      // Find last posts' ID
      post_hash = hash;
      return this.schema.selectLastPostId();
    }).then(data => {
      // Get a new ID
      id = getId(data);
      // Set is_parent according to argument
      if (is_parent) {
        is_parent = 1;
      }
      else { is_parent = 0; }
      // Insert post into table
      return this.schema.insertPostInTable({ id: id, parent_id: parent_id, tripcode: post_hash, rawhtml: escaped_text, timestamp: timestamp, ip: ip, is_parent: is_parent, img: img });
    }).then(() => {
      // Update thread's bump timestamp
      return this.schema.updateThreadTimestampById(timestamp, parent_id);
    });
  }

  newThread (text, ip, img) {
    // Get timestamp
    var timestamp = getCurrentTimestamp();
    
    var thread_salt = '';
    var thread_count;
    var id;

    return this.isBanned(ip).then(() => {
        // Generate thread salt
        return bcrypt.genSalt(10)
    }).then(salt => {
        thread_salt = salt;
        return this.schema.selectLastThreadId();
    }).then(data => {
      // Get ID for new thread
      id = getId(data);
      return this.schema.insertThreadInTable({ id: id, timestamp: timestamp, thread_salt: thread_salt, img: img });
    }).then(() => {
      // Add a new post corresponding to the thread
      return this.newPost(text, id, ip, img, true);
    }).then(() => {
      // Get thread count
      return this.schema.getThreadCount();
    }).then(data => {
      // Store thread count for later and get last bumped thread
      thread_count = data.count;
      return this.schema.getLastBumpedThread();
    }).then(data => {
      // If the amount of threads are greater than the set maximum,
      // Prune the last bumped thread.
      if (thread_count > settings.max_threads) {
        return this.pruneThread(data.id);
      }
      // Otherwise pass to the next .then()
      else {
        return Promise.resolve();
      }
    });
  }

  getThreads (page) {
    var limit = settings.threads_per_page;
    var offset = (page - 1) * settings.threads_per_page;
    return this.schema.selectLatestThreads(limit, offset);
  }

  getThreadCount () {
    return this.schema.getThreadCount();
  }

  getPosts (parent_id) {
    return this.schema.getPostsByParentId(parent_id);
  }
}


function getId(data) {
  // If data exists, return id
  if (data) {
    return data.id + 1;
  }
  // Otherwise, return 1
  else {
    return 1;
  }
}

function getCurrentTimestamp () {
  var timestamp = moment();
  return timestamp.format('YYYY-MM-DD HH:mm:ss');
}

module.exports = Board;
