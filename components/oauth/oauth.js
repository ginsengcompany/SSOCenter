var oauthServer = require('oauth2-server');
var config = require('../../config')

var oauth = new oauthServer({
  model: config.db==='mongo' ? require('./mongo-models.js') : require('./models.js')
});

module.exports = oauth;