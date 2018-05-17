var express = require('express');
var router = express.Router();
var oauthMongo = require('../components/oauth/mongo-models');
var oauthSql = require('../components/oauth/models');
var configDB = require('../config');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index');
});

router.post('/', function (req,res) {
    if(configDB.db === 'mongo'){
        oauthMongo.login(req,res);
    }else {
        oauthSql.login(req, res);
    }
});

module.exports = router;
