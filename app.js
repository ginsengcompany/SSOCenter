var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('./config.js');
var authenticate = require('./components/oauth/authenticate');
var routes = require('./routes/index');
var users = require('./routes/users');
var addUser = require('./routes/addUser');
var listUsers = require('./routes/listUsers');
var getUsers = require('./routes/getUsers');
var getClient = require('./routes/getClient');
var listClient = require('./routes/listClient');
var addClient = require('./routes/addClient');
var deleteUser = require('./routes/listUsers');
var administrationPanel = require('./routes/administrationPanel');
var db = require('./components/oauth/sqldb/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

if (config.seedDB) { require('./components/oauth/seed'); }
if (config.seedMongoDB) { require('./components/oauth/seed-mongo'); }

db.sequelize.sync({force: false}).then(() => {
    console.log('Drop and Resync with { force: true }');
});

/** Public Area **/

require('./components/oauth')(app)

/** Control Private through OAuth **/

app.use('/', routes);
app.use('/users', users);
app.use('/addUser', addUser);
app.use('/listUsers', listUsers);
app.use('/administrationPanel',administrationPanel);
app.use('/getUsers',getUsers);
app.use('/getClient',getClient);
app.use('/listClient',listClient);
app.use('/addClient',addClient);
app.use('/deleteUser',deleteUser);

app.get('/secure', authenticate(), function(req,res){
  res.json({message: 'Secure data'})
});

app.get('/me', authenticate(), function(req,res){
  res.json({
    me: req.user,
    messsage: 'Authorization success, Without Scopes, Try accessing /profile with `profile` scope',
    description: 'Try postman https://www.getpostman.com/collections/37afd82600127fbeef28',
    more: 'pass `profile` scope while Authorize'
  })
});

app.get('/profile', authenticate({scope:'profile'}), function(req,res){
  res.json({
    profile: req.user
  })
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
