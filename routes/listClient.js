var express = require('express');
var router = express.Router();
var authenticate = require('../components/oauth/authenticate');
var oauthMongo = require('../components/oauth/mongo-models');
var oauthSql = require('../components/oauth/models');
var configDB = require('../config');

/* GET home page. */
router.get('/', authenticate(), function (req, res, next) {
    res.render('listClient', {
        listUserUrl: '/listUsers?access_token=' + req.query.access_token,
        addUserUrl: '/addUser?access_token=' + req.query.access_token,
        listClientUrl: '/listClient?access_token=' + req.query.access_token,
        addClientUrl: '/addClient?access_token=' + req.query.access_token
    });
});

router.post('/', function (req, res) {
    if(configDB.db === 'mongo') {
        if (req.body.action === "elimina") {
            if (req.body._id) {
                return oauthMongo.deleteClient(req, res);
            } else {
                res.redirect('listClient')
            }
        } else if (req.body.action === "aggiorna") {
            return oauthMongo.updateClient(req, res)
        }else if (req.body.action === "aggiungi")
            return oauthMongo.addNewClient(req, res)
    } else{
        if (req.body.action === "elimina") {
            if (req.body.id) {
                return oauthSql.deleteClient(req, res);
            } else {
                res.redirect('listClient')
            }
        }else if (req.body.action === "aggiorna") {
            return oauthSql.updateClient(req, res)
        }else if
            (req.body.action === "aggiungi")
            return oauthSql.addNewClient(req,res);
        }
});

module.exports = router;