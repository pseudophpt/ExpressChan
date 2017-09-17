var bcrypt = require('bcrypt');
var salt = bcrypt.genSaltSync(10);
console.log('----------------------------------------------------------------------------------------');
require('crypto').pseudoRandomBytes(24, function (err, raw) {
      var pw = raw.toString('base64');
      console.log('Password: ' + raw.toString('base64'));
      var hash = bcrypt.hashSync(raw.toString('base64'), salt);
      console.log('password_salt: \'' + salt + '\',');
      console.log('password_hash: \'' + hash + '\'');
});
console.log