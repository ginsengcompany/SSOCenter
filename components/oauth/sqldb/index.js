var config = require('./../../../config');
var Sequelize = require('sequelize');

var db = {
  sequelize: new Sequelize(
    config.sql.database,
    config.sql.username,
    config.sql.password,
    config.sql
  )
};

db.OAuthAccessToken = db.sequelize.import('./OAuthAccessToken');
db.OAuthAuthorizationCode = db.sequelize.import('./OAuthAuthorizationCode');
db.OAuthClient = db.sequelize.import('./OAuthClient');
db.OAuthRefreshToken = db.sequelize.import('./OAuthRefreshToken');
db.OAuthScope = db.sequelize.import('./OAuthScope');
db.User = db.sequelize.import('./User');
//db.JoinUserClient = db.sequelize.import('./JoinUserClient');
db.Thing = db.sequelize.import('./Thing');

db.OAuthClient.belongsToMany(db.User, { as: 'Utenti', through: 'utenti_client', foreignKey: 'client_id', otherKey: 'user_id'});
db.User.belongsToMany(db.OAuthClient, { as: 'Client', through: 'utenti_client', foreignKey: 'user_id', otherKey: 'client_id'});

Object.keys(db).forEach(function(modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

module.exports = db;