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
const session     = require('express-session')

// Seperated Routes for each Resource
const usersRoutes = require("./routes/users");


// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan('dev'));

app.use(session({
  secret: 'sshshshsh',
  resave: true,
  saveUninitialized: true
}));

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

//sitemap
app.get('/sitemap.xml', (req, res) => {
  res.render('sitemap')
})

//route for the courses page. Selects everything from the courses page and
//sends to front end to be rendered on the courses.ejs template
app.get('/courses', (req, res)=> {
  knex
    .select('*')
    .from('courses')
    .then((response)=> {
      console.log("this is the response", response)
      var templateVar = {response: response, admin: req.session.userID}
      res.render('courses', templateVar);
    })
})

//get route for the admin login page.
//checks to see if session exists, if no, then renders login form, or else redirects to admin dashboard.
app.get('/admin', (req, res) => {
  if(!req.session.userID){
    res.render('adminForm');
  } else {
    res.redirect('/admin/adminDashboard')
  }
})

//get route for course page where admin can add courses.
//if session exists, page is rendered, else, redirected to login form
app.get('/admin/course', (req, res)=> {
  if (req.session.userID) {
    res.render('addCourse')
  } else {
    res.redirect("adminForm")
  }
})

//Get route for templates page.
app.get('/admin/templates', (req, res) => {
  if (req.session.userID){
    res.send("This does not work yet");
  } else {
    res.send('NOPE.')
  }

})

//Get route for admin dashboard.
app.get('/admin/adminDashboard', (req, res)=> {
  if(req.session.userID){
    var templateVar = {
      admin: req.session.userID
    }
    res.render('adminDashboard', templateVar)
  } else {
    res.redirect('/admin')
  }
})

// Destroys session and redirects to home page.
app.get('/logout', (req, res)=> {
  req.session.destroy(function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log('req.session',req.session)
      res.redirect('/');
    }
  })
})

//posting from the login form.
//selecting the id, email and username where the email and password are the same.
//then setting session to id and rendering dashboard
app.post('/admin/adminDash', (req, res) => {
  if(req.session.userID){
    res.render('adminDashboard');
  } else{
    console.log(req.body);
    console.log(req.body.email)
    console.log(req.body.password)
    knex('users')
        .select('id', 'email', 'password')
        .where({
          email: req.body.email,
          password: req.body.password
        })
    .then((response)=> {
      console.log("RESPONSE", response)
      console.log("req session before", req.session.userID)
      console.log('setting session now')
      req.session.userID = response[0].id;
      console.log('req session after', req.session.userID)
      var templateVar = {
        admin: req.session.userID
      }
      res.render('adminDashboard', templateVar)
    })
  }
})

//post route for the add a course form.
//inserts everything entered into the form into the courses table.
//then sends a thank you message to the form end.
app.post('/admin/addACourse', (req, res)=> {
  console.log(req.body)
  console.log(req.body.date)
  console.log(req.body.url)
  console.log(req.body.title)
  console.log(req.body.description)
  knex('courses')
      .insert({
        title: req.body.title,
        date_of_event: req.body.date,
        event_url: req.body.url,
        event_description: req.body.description
      })
  .then((response)=> {
    console.log("inside response", response)
    var thankYouMsg = {
      thanks: 'Your course has been added. Go to the courses page and check it out.'
    }
    res.send(JSON.stringify(thankYouMsg));
  })
})

//edit route for each course by id.
// renders selected course onto a specific page onto a page to be edited.
app.get('/admin/editCourse/:id', (req, res)=> {
  console.log("HELLLLLLO")
  console.log('req.params', req.params)
  if (req.session.userID){
    console.log("CHECK THIS OUT HELLLLLLO")
    knex
      .select('*')
      .from('courses')
      .where({
        course_id: req.params.id
      })
    .then((response) => {
      console.log("this is the response from the server", response);
      var templateVar = {response: response, admin: req.session.userID};
      res.render('editACourse', templateVar)
    })
  } else {
    res.send('NOOOOOOPE.')
  }
})

//post route for editing a apecific course.
//selects course by id and then updates the course accoridng to the changes made in the form.
//then redirects to the courses page after two seconds
app.post('/admin/updateCourse/:id', (req, res)=> {
  if (req.session.userID){
    knex('courses')
          .where({
            course_id: req.params.id
          })
          .update({
            title: req.body.updateTitle,
            date_of_event: req.body.updateDate,
            event_url: req.body.updateUrl,
            event_description: req.body.updateDescription
          })
    .then((response)=> {
      console.log('INSIDE THE RESPONSE', response)
      setTimeout(()=>{
        res.redirect('/courses')
      }, 2000)
    })
  } else {
    res.send('NOPE.')
  }
})

//delete route for course by id.
//selects course by id and then deletes it.
//then redirects to courses page so admin can make sure its deleted
app.get('/admin/deleteCourse/:id', (req, res)=> {
  if(req.session.userID){
    knex('courses')
        .where({
          course_id: req.params.id
        })
        .del()
    .then((response)=> {
      console.log("inside the delete promise", response)
      res.redirect('/courses')
    })
  } else {
    res.send('NOPE.')
  }
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

  var templateVar = {
    thanks: 'Thank you for getting in touch. We will get back to you shortly.'
  }

  res.send(templateVar);
})



app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
});
