var express = require('express');
var router = express.Router();
var authenticate = require('../components/oauth/authenticate');
var oauthMongo = require('../components/oauth/mongo-models');
var oauthSql = require('../components/oauth/models');
var configDB = require('../config');

/* GET home page. */
router.get('/', authenticate(), function (req, res, next) {
    res.render('listUsers', {
        listUserUrl: '/listUsers?access_token=' + req.query.access_token,
        addUserUrl: '/addUser?access_token=' + req.query.access_token,
        listClientUrl: '/listClient?access_token=' + req.query.access_token,
        addClientUrl: '/addClient?access_token=' + req.query.access_token
    });
});

router.post('/', function (req, res) {
    if (configDB.db === 'mongo') {
        return oauthMongo.updateUser(req, res);
    }
    else {
        return oauthSql.updateUser(req, res);
    }
});

router.delete('/:id', function (req, res) {
    var id = req.params.id;
    if (configDB.db === 'mongo') {
        return oauthMongo.deleteUser(id, res);
    } else {
        return oauthSql.deleteUser(id, res);
    }
});

module.exports = router;