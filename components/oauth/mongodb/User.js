/**
 * Created by Manjesh on 14-05-2016.
 */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var UserSchema = new Schema({
  username:  String,
  password:  String,
  client : String,
  type: {organization : String, role: String}
});

module.exports = mongoose.model('User', UserSchema);

