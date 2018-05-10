var express = require('express');
var router = express.Router();
var oauth = require('../components/oauth/mongo-models');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/', oauth.login, function () {
      console.log(oauth.login);
    }
);

module.exports = router;
