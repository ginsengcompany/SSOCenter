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
        addUserUrl: '/addUser?access_token=' + req.query.access_token
    });
});

router.post('/', function (req, res) {
    if(configDB.db === 'mongo') {
        if (req.body.action === "elimina") {
            if (req.body._id) {
                return oauthMongo.deleteUser(req, res);
            } else {
                res.redirect('listUsers')
            }
        } else if (req.body.action === "aggiorna") {
            return oauthMongo.updateUser(req, res)
        }
    } else {
        if (req.body.action === "elimina") {
            if (req.body.id) {
                return oauthSql.deleteUser(req, res);
            } else {
                res.redirect('listUsers')
            }
        } else if (req.body.action === "aggiorna") {
            //return oauthSql.updateUser(req, res)
        }
    }

});

module.exports = router;