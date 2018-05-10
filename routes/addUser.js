var express = require('express');
var oauth = require('../components/oauth/mongo-models');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('addUser', { title: 'Express' });
});

router.post('/', function (req, res) {
    if(req.body.materialFormRegisterPassword === req.body.materialFormRepeatPassword) {
        return oauth.addNewUser (req,res);
    }else{
        res.redirect('addUser')
    }
});

router.put('/addUser', function(req, res) {

});

router.delete('/addUser', function(req, res) {

});


module.exports = router;