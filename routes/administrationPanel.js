var express = require('express');
var router = express.Router();
var authenticate = require('../components/oauth/authenticate');

/* GET home page. */
router.get('/', authenticate(), function(req, res, next) {
    res.render('administrationPanel', {addUserUrl: '/addUser?access_token=' + req.query.access_token});
});

module.exports = router;