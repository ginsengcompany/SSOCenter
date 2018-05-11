var express = require('express');
var oauth = require('../components/oauth/mongo-models');
var router = express.Router();
var authenticate = require('../components/oauth/authenticate');
var oauth = require('../components/oauth/mongo-models');

/* GET home page. */
router.get('/', authenticate(), function(req, res, next) {
    res.render('addUser', {addUserUrl: '/addUser?access_token=' + req.query.access_token});
});

router.post('/', function (req, res) {
    if(req.body.materialFormRegisterPassword === req.body.materialFormRepeatPassword) {
        return oauth.addNewUser (req,res);
    }else{
        res.redirect('addUser')
    }
});


module.exports = router;