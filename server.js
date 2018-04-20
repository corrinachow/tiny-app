const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');

const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(cookieSession({
  name: 'session',
  keys: ['dfshjkaf90dsafjk']
}));

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

const urlDatabase = {
  'b2xVn2': { userID:'userRandomID', url:'http://www.lighthouselabs.ca' },
  '9sm5xK': { userID:'user2RandomID', url:'http://www.google.com' },
  '5x6rvqp': { userID:'user3RandomID', url:'https://wikipedia.org' }
};

const users = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: bcrypt.hashSync('purple-monkey-dinosaur', 10)
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: bcrypt.hashSync('dishwasher-funk', 10)
  },
  'user3RandomID': {
    id: 'user3RandomID',
    email: 'example@example.com',
    password: bcrypt.hashSync('tests', 10)
  }
};

/* REGISTRATION */

function getUser(email) {
  const currentUsers = Object.keys(users);
  for (const user_id of currentUsers) {
    if (users[user_id].email === email) {
      return users[user_id];
    }
  }
  return false;
}

function urlsForUser(id) {
  const urls = {};
  const shortURLs = Object.keys(urlDatabase);
  for (const shortURL of shortURLs) {
    if (urlDatabase[shortURL].userID === id) {
      urls[shortURL] = urlDatabase[shortURL].url;
    }
  }
  return urls;
}

app.get('/register', (req, res) => {
  console.log(req.session.user_id)
  let templateVars = { urls: urlDatabase,
    user: users[req.session.user_id]
  };
  res.render('urls_register');
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send('Invalid email or password');
    if (getUser(email)) {
      res.status(400).send('Email already in use');
    };
  } else {
    const newUser = {
      id: generateRandomStr(),
      email: email,
      password: bcrypt.hashSync(password, 10),
    };
    users[newUser['id']] = newUser;
    req.session.user_id = newUser.id
    let templateVars = { urls: urlDatabase,
    user: users[req.session.user_id] };
    res.redirect('/urls');
  };
});

app.post('/logout', (req, res) => {
  delete req.session.user_id;
  res.redirect('/urls');
});

/* HOME PAGE */

app.get('/' , (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

/* LOGIN FORM */

app.get('/login' , (req, res) => {
  res.render('login_form')
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  //user returns either user Obj or false;
  const user = getUser(email);
  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user_id = user.id;
    res.redirect('/urls')
  } else {
    res.status(403).send('403: Email or password invalid');
  }
});

/* POST LOGIN */

app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  };
  if (req.session.user_id) {
    templateVars.urls = urlsForUser(req.session.user_id);
  }
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
  } else {
    let templateVars = { urls: urlDatabase,
      user: users[req.session.user_id]};
    res.render('urls_new', templateVars);
  };
});

/* MAKES NEW URL */

app.post('/urls', (req, res) => {
  const shortURL = generateRandomStr();
  urlDatabase[shortURL] = {
    userID: req.session.user_id,
    url: req.body.longURL};
  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls/:id', (req, res) => {
  const { user_id } = req.session;
  const { id } = req.params;
  console.log(id);
  console.log(urlDatabase);
  if (!user_id) {

    res.send('Please log in to edit URLs');
  } else if (urlDatabase[id].userID !== user_id) {
    return res.send(`You don't have access to this page`)
  };
  let templateVars = {
    shortURL: id,
    longURL: urlDatabase[id].url,
    user: users[user_id],
  };
  res.render('urls_show', templateVars);
});

app.post('/urls/:id', (req, res) => {
  const { user_id } = req.session;
  const { id } = req.params;
  const { longURL } = req.body;
  urlDatabase[id] = {userID: user_id, url:longURL};
  res.redirect(`/urls/${id}`);
});

app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(longURL);
});

app.post('/urls/:id/delete', (req, res) => {
  const shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

function generateRandomStr() {
  return Math.random().toString(36).substring(6);
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});