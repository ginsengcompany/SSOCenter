var express = require('express');
var router = express.Router();
var oauthMongo = require('../components/oauth/mongo-models');
var oauthSql = require('../components/oauth/models');
var configDB = require('../config');

router.get('/', function(req, res, next) {
    if(configDB.db === 'mongo') {
        return oauthMongo.getClientInformations(req, res);
    }
    else return oauthSql.getClientInformations(req,res);
});

module.exports = router;