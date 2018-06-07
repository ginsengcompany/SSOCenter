'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var UserSchema = new Schema({
  username:  String,
  password:  String,
  client : String,
  scope: String,
  type: {organization : String, role: String},
  OAuthClient: [{ type : Schema.Types.ObjectId, ref: 'OAuthClient' }],
});

module.exports = mongoose.model('User', UserSchema);

