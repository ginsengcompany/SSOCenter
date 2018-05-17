var express = require('express');
var oauth = require('../components/oauth/mongo-models');
var router = express.Router();
var authenticate = require('../components/oauth/authenticate');
var oauthMongo = require('../components/oauth/mongo-models');
var oauthSql = require('../components/oauth/models');
var configDB = require('../config');

/* GET home page. */
router.get('/', authenticate(), function(req, res, next) {
    res.render('addUser', {
        addUserUrl: '/addUser?access_token=' + req.query.access_token,
        listUserUrl: '/listUsers?access_token=' + req.query.access_token
    });
});

router.post('/', function (req, res) {
    if(configDB.db === 'mongo') {
        if (req.body.materialFormRegisterPassword === req.body.materialFormRepeatPassword) {
            oauthMongo.addNewUser(req, res);
        } else {
            res.redirect('addUser');
        }
    } else {
        if (req.body.materialFormRegisterPassword === req.body.materialFormRepeatPassword) {
            oauthSql.addNewUser(req, res);
        } else {
            res.redirect('addUser');
        }
    }
});


module.exports = router;