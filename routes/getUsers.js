var express = require('express');
var router = express.Router();
var oauth = require('../components/oauth/mongo-models');

/* GET home page. */
router.get('/', function(req, res, next) {
    return oauth.getUsersInformations(req,res);
});

module.exports = router;