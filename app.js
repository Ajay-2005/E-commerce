var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session=require("express-session")
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
const bodyParser = require('body-parser')
const hbs = require('express-handlebars');
var db=require('./config/mongo connection')
var fileUpload=require('express-fileupload');
const { log } = require('console');
const ratelimit=require('express-rate-limit');
const csrf = require('lusca').csrf;
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir:path.join( __dirname + '/views/layouts/'),
  partialsDir:[path.join (__dirname + '/views/partials/',
)]

}))
db.connect((err)=>{
  if(err) console.log("error");
  else console.log("Database connected")
})
app.use(csrf());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.use(
  session({
    secret: process.env.Session_key || 'your-secret-key', // Replace 'your-secret-key' with your actual secret key
    cookie: { maxAge: 600000, secure: true }, // secure: true will only send the cookie over HTTPS connections
    resave: false,
    saveUninitialized: true,
  })
);
app.use('/', userRouter);
app.use('/admin', adminRouter);
const RateLimit = ratelimit({
  windowMs: 60 * 1000, // Time window for rate-limiting in milliseconds (1 minute in this case)
  max: 5, // Maximum number of requests per windowMs (5 in this case)
  message: 'Too many  attempts, please try again later.',
});

app.use(RateLimit)
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
