var express = require('express');
var router = express.Router();
var oauthMongo = require('../components/oauth/mongo-models');
var oauthSql = require('../components/oauth/models');
var configDB = require('../config');

/* GET home page. */
router.get('/', function(req, res, next) {
    if(configDB.db === 'mongo') {
        let r =  oauthMongo.getUsersInformations(req, res);
       console.log(next);
    }
    else return oauthSql.getUsersInformations(req,res);
});

router.post('/', function (req,res) {
    if(configDB.db === 'mongo') {
        return oauthMongo.filterUsersByID(req, res);
    }
    else return oauthSql.filterUsersByID(req,res)
});

module.exports = router;