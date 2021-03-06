var express = require('express');
var router = express.Router();
var authenticate = require('../components/oauth/authenticate');

/* GET home page. */
router.get('/', authenticate(), function(req, res, next) {
    res.render('administrationPanel',
        {
            addUserUrl: '/addUser?access_token=' + req.query.access_token,
            listUserUrl: '/listUsers?access_token=' + req.query.access_token,
            addClientUrl: '/addClient?access_token=' + req.query.access_token,
            listClientUrl: '/listClient?access_token=' + req.query.access_token
        });
});

module.exports = router;