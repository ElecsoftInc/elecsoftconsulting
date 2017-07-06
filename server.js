"use strict";

require('dotenv').config();

const PORT        = process.env.PORT || 8080;
const ENV         = process.env.ENV || "development";
const express     = require("express");
const bodyParser  = require("body-parser");
const sass        = require("node-sass-middleware");
const app         = express();

const knexConfig  = require("./knexfile");
const knex        = require("knex")(knexConfig[ENV]);
const morgan      = require('morgan');
const knexLogger  = require('knex-logger');
const nodemailer  = require('nodemailer');

// Seperated Routes for each Resource
const usersRoutes = require("./routes/users");

// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan('dev'));

// Log knex SQL queries to STDOUT as well
app.use(knexLogger(knex));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/styles", sass({
  src: __dirname + "/styles",
  dest: __dirname + "/public/styles",
  debug: true,
  outputStyle: 'expanded'
}));
app.use(express.static("public"));

// Mount all resource routes
app.use("/api/users", usersRoutes(knex));

// Home page
app.get("/", (req, res) => {
  res.render("home");
});

app.get('/generic', (req, res) => {
  res.render('generic')
})

app.get('/elements', (req, res) => {
  res.render('elements')
})

//sends email from Get in touch form
app.post('/mail', (req, res) => {
  console.log("this is the info you get", req.body)

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'elecsoftconsulting@gmail.com',
      pass: process.env.NODEMAILER_PASS
    }
  });

  let mailOptions = {
    from: req.body.email,
    to: 'elecsoftconsulting@gmail.com',
    subject: `${req.body.name} wants to get in touch.`,
    text: `${req.body.name}, ${req.body.email}, ${req.body.message}`,
    html: `<div><h4>${req.body.name} ~ ${req.body.email}</h4> <p>${req.body.message}</p></div>`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log("THERE IS AN ERROR",error)
    }
      console.log('Message %s sent: %s', info.messageId, info.response)
  });

  setTimeout(function () {
    res.redirect('/');
  }, 5000);
})


app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
});
