// server.js
// load the things we need
var express = require('express');
var app = express();
var PORT = 8080;
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
// set the view engine to ejs
app.set('view engine', 'ejs');

// use res.render to load up an ejs view file
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};



// index page
app.post("/login", (req, res) => {
  // console.log(req.body.username)
  res.cookie('username', req.body.username)
  // console.log(res.cookie.username)
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase,
  username: req.cookies['username'] };
  console.log(templateVars.username)
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { urls: urlDatabase,
    username: req.cookies['username']};
  res.render("urls_new", templateVars);
});

app.post("/urls/new", (req, res) => {
  const shortURL = generateShortURL();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, urls: urlDatabase[req.params.id], username: req.cookies['username'] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  console.log(req.body)
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  //delete objName.key;
  const shortURL = req.params.id;
  delete urlDatabase[shortURL];
  console.log(urlDatabase)
  res.redirect('/urls');
});

function generateShortURL() {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});