/*
 *  db.js
 *  
 *  Database interface
 *  Using postgresql w/ promises (pg-promises module) 
 *
 *  ExpressChan
 */  

'use strict';
// Use strict mode

const pgp = require('pg-promise')({
  error: (err, e) => {
    if (e.query) {
      console.log('Query error: \'' + e.query + '\'');
    }
  }
});

const settings = require('./settings');

const cn_vals = {
  host: settings.db_host,
  port: settings.db_port,
  database: settings.db_name,
  user: settings.db_username,
  password: settings.db_password
};

var db = pgp(cn_vals);

class Schema {
  constructor(board) {
    this.board = board;
    this.db = db;
  }

  insertBan(ip, length, timestamp) {
    return db.none ('INSERT INTO $<board^>.BANS (IP, LENGTH, TIMESTAMP) VALUES ($<ip>, $<length^>, $<timestamp>::TIMESTAMP);', {
      board: this.board,
      ip: ip,
      length: length,
      timestamp: timestamp
    });
  }
  pardonBans(ip) {
    return db.none ('DELETE FROM $<board^>.BANS WHERE IP = $<ip>', {
      board: this.board,
      ip: ip
    });
  }


  insertPostInTable (values) {   
    return db.none('INSERT INTO $<board^>.POSTS (ID, PARENT_ID, TRIPCODE, TIMESTAMP, RAWHTML, IP, IS_PARENT, IMG) VALUES ($<id^>, $<parent_id^>, $<tripcode>, $<timestamp>::TIMESTAMP, $<rawhtml>, $<ip>, $<is_parent^>, $<img>);', {
      board: this.board,
      id: values.id,
      parent_id: values.parent_id,
      tripcode: values.tripcode,
      rawhtml: values.rawhtml,
      timestamp: values.timestamp,
      ip: values.ip,
      is_parent: values.is_parent,
      img: values.img
    });
  }

  insertThreadInTable (values) {   
    return db.none('INSERT INTO $<board^>.THREADS (ID, TIMESTAMP, THREAD_SALT) VALUES ($<id^>, $<timestamp>::TIMESTAMP, $<thread_salt>);', {
      board: this.board,
      id: values.id,
      timestamp: values.timestamp,
      thread_salt: values.thread_salt
    });
  }
  
  getThreadCount () {
    return db.one('SELECT COUNT(*) FROM $<board^>.THREADS;', {
      board: this.board
    });
  }

  selectLastPostId () {
    return db.oneOrNone('SELECT ID FROM $<board^>.POSTS WHERE ID = (SELECT MAX(ID) FROM $<board^>.POSTS);', {
      board: this.board
    });
  }

  selectLastThreadId () {
    return db.oneOrNone('SELECT ID FROM $<board^>.THREADS WHERE ID = (SELECT MAX(ID) FROM $<board^>.THREADS);', {
      board: this.board
    })
  }

  getRowById (id, table) {
    return db.oneOrNone('SELECT * FROM $<board^>.$<table^> WHERE ID = $<id>;', {
      board: this.board,
      table: table,
      id: id
    });
  }

  getRowByIP (ip, table) {
    return db.oneOrNone('SELECT * FROM $<board^>.$<table^> WHERE IP = $<ip>;', {
      board: this.board,
      table: table,
      ip: ip
    });
  }

  deleteRowById (id, table) {
    return db.none('DELETE FROM $<board^>.$<table^> WHERE ID = $<id^>;', {
      board: this.board,
      table: table,
      id: id
    });
  }

  deletePostsByParent (parent_id) {
    return db.none('DELETE FROM $<board^>.POSTS WHERE PARENT_ID = $<parent_id^>;', {
      board: this.board,
      parent_id: parent_id
    })
  }

  getLastBumpedThread () {
    // Super long query that searches for minimum timestamp, and deletes the post with the minimum ID matching that timestamp
    return db.one('SELECT * FROM $<board^>.THREADS WHERE ID = (SELECT MIN(ID) FROM $<board^>.THREADS WHERE TIMESTAMP = (SELECT MIN(TIMESTAMP) AS ID FROM $<board^>.THREADS));', {
      board: this.board
    })
  }

  updateThreadTimestampById(timestamp, id) {
    return db.none('UPDATE $<board^>.THREADS SET TIMESTAMP = $<timestamp>::TIMESTAMP WHERE ID = $<id^>', {
      board: this.board,
      timestamp: timestamp,
      id: id
    });
  }

  addSchema() {
    return db.none('DROP SCHEMA $<board>', {
      board: this.board 
    }).then(() => {
      return db.none('CREATE SCHEMA $<board^>;', {
      board: this.board
      })
    });
  }

  addTables() {
    return db.none('CREATE TABLE $<board^>.THREADS (ID INT, TIMESTAMP TIMESTAMP, THREAD_SALT TEXT);', {
      board: this.board
    }).then(() => {
      return db.none('CREATE TABLE $<board^>.POSTS (ID INT, PARENT_ID INT, TRIPCODE TEXT, TIMESTAMP TIMESTAMP, RAWHTML TEXT, IP TEXT, IS_PARENT SMALLINT, IMG TEXT);', {
        board: this.board
      });
    }).then(() => {
      return db.none ('CREATE TABLE $<board^>.BANS (IP TEXT, LENGTH INT, TIMESTAMP TIMESTAMP);', {
        board: this.board
      });
    });
  }

  selectLatestThreads(limit, offset) {
    return db.manyOrNone('SELECT * FROM $<board^>.POSTS WHERE PARENT_ID IN (SELECT ID FROM $<board^>.THREADS ORDER BY TIMESTAMP DESC OFFSET $<offset^> LIMIT $<limit^>) AND IS_PARENT = 1 ORDER BY TIMESTAMP DESC;', {
      board: this.board,
      limit: limit,
      offset: offset
    });
  }

  getPostsByParentId(parent_id) {
    return db.manyOrNone('SELECT * FROM $<board^>.POSTS WHERE PARENT_ID = $<parent_id^> ORDER BY TIMESTAMP ASC;', {
      board: this.board,
      parent_id: parent_id
    })
  }
}

module.exports = Schema;
