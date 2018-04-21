const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['dfshjkaf90dsafjk']
}));

const urlDatabase = {
  'b2xVn2': {
    userID:'userRandomID',
    url:'http://www.lighthouselabs.ca',
    date: 'Thu Apr 19 2018 21:32:50 GMT-0400 (EDT)',
    ipOfVisitors: ['12.345.67.890', '12.345.67.890']
  },
  '9sm5xK': {
    userID:'user2RandomID',
    url:'http://www.google.com',
    date: 'Thu Apr 19 2018 21:32:50 GMT-0400 (EDT)',
    ipOfVisitors: ['12.345.67.890']
  },
  '5x6rvqp': {
    userID:'user3RandomID',
    url:'https://wikipedia.org',
    date: 'Thu Apr 19 2018 21:32:50 GMT-0400 (EDT)',
    ipOfVisitors: ['01.234.56.789', '12.345.67.890', '12.345.67.890']
  }
};

const users = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: bcrypt.hashSync('password', 10)
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: bcrypt.hashSync('password', 10)
  },
  'user3RandomID': {
    id: 'user3RandomID',
    email: 'example@example.com',
    password: bcrypt.hashSync('tests', 10)
  }
};

// Retrieves user object from email
function getUser(email) {
  const currentUsers = Object.keys(users);
  for (const user_id of currentUsers) {
    if (users[user_id].email === email) {
      return users[user_id];
    }
  }
  return false;
};

// Retrieves short URLs associate with user ID
function urlsForUser(id) {
  const urls = {};
  const shortURLs = Object.keys(urlDatabase);
  for (const shortURL of shortURLs) {
    if (urlDatabase[shortURL].userID === id) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls;
};


// Gets unique values from array
function getUnique(value, index, element) {
  return element.indexOf(value) === index;
};

function validateEmail(email) {
  const re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  return re.test(email.toLowerCase());
};

function validateWebsite(longURL) {
  const re = /^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+\.[a-z]+(\/[a-zA-Z0-9#]+\/?)*$/i;
  return re.test(longURL.toLowerCase());
};

function generateRandomStr() {
  return Math.random().toString(36).substring(6);
};

/**
 * ------------------------------------------------------------------------
 * APP JSON DATA
 * ------------------------------------------------------------------------
 */

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

/**
 * ------------------------------------------------------------------------
 * USER REGISTRATION
 * ------------------------------------------------------------------------
 */

// If user is logged in, redirects to /urls, otherwise renders registration page
app.get('/register', (req, res) => {
  const { user_id } = req.session
  if (user_id) {
    return res.redirect('/urls');
  };
  let templateVars = { urls: urlDatabase,
    user: users[user_id]
  };
  return res.render('urls_register');
});

/**
* Makes POST to /register to create new account if user enters valid email and password
*
* Adds new user information to users database, hash password, and sets cookie
*
* Redirects user to /urls upon successful account creation
*/

app.post('/register', (req, res) => {
  const { email, password } = req.body;

  // Checks for email and password
  if (!email || !password) {
    return res.status(400).send('<h1>Invalid email or password</h1>');

    // Checks if email is already used in database
  } else if (getUser(email)) {
    return res.status(400).send('<h1>Email already in use</h1>');

    // Checks for a valid email
  } else if(!validateEmail(email)) {
    return res.status(400).send('<h1>Please enter a valid email</h1>');

    // Populates new user object
  } else {
    const newUser = {
      id: generateRandomStr(),
      email: email,
      password: bcrypt.hashSync(password, 10),
    }
    users[newUser['id']] = newUser;

    // Sets cookie
    req.session.user_id = newUser.id;
    let templateVars = { urls: urlDatabase,
    user: users[req.session.user_id] };
    return res.redirect('/urls');
  };
});


// Clears cookies on logout
app.post('/logout', (req, res) => {
  delete req.session.user_id;
  return res.redirect('/urls');
});

/**
 * ------------------------------------------------------------------------
 * HOME PAGE
 * ------------------------------------------------------------------------
 */

app.get('/' , (req, res) => {
  // Redirects to /urls if user is already logged in, otherwise redirects to login page
  if (req.session.user_id) {
    return res.redirect('/urls');
  } else {
    return res.redirect('/login');
  }
});

/**
 * ------------------------------------------------------------------------
 * LOGIN FORM
 * ------------------------------------------------------------------------
 */

app.get('/login' , (req, res) => {
  // Checks for user_id from cookies and redirects to /urls
  if (req.session.user_id) {
    return res.redirect('/urls');
  }
  return res.render('login_form');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Retrieves user info object from email, returns false if user does not exist
  const user = getUser(email);

  // Redirects to /urls upon successful authentication
  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user_id = user.id;
    return res.redirect('/urls')
  } else {
    return res.status(403).send('<h1>403: Email or password invalid</h1><a href="/login">Go back</a>');
  }
});

/**
 * ------------------------------------------------------------------------
 * USER CONTROLS
 * ------------------------------------------------------------------------
 */


/**
* Displays all short URLs create by user along with:
* - creation date
* - long URL
* - times visited
* - unique visits
*
* Authorised users can delete/edit their short URLs
*
* Users can create new short URLs
*/

app.get('/urls', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };

  // Retrieves all short URLs associated with logged in user
  if (req.session.user_id) {
    templateVars.urls = urlsForUser(req.session.user_id);
  };
  return res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {

  // Redirects non-logged-in users to login page
  if (!req.session.user_id) {
    res.redirect('/login');
  } else {
    let templateVars = {
      urls: urlDatabase,
      user: users[req.session.user_id]
    };
    return res.render('urls_new', templateVars);
  }
});

/**
 * ------------------------------------------------------------------------
 * NEW SHORT URL GENERATOR
 * ------------------------------------------------------------------------
 */

app.post('/urls', (req, res) => {
  const { longURL } = req.body;

  if (!validateWebsite(longURL)) {
    return res.status(400).send('Please enter a valid URL');
  };
  const shortURL = generateRandomStr();

  // Adds new shortURL to database
  urlDatabase[shortURL] = {
    userID: req.session.user_id,
    url: longURL,
    date: new Date(),
    ipOfVisitors: []
  };
  return res.redirect(`/urls/${shortURL}`);
});

/**
 * ------------------------------------------------------------------------
 * EDIT SHORT URL PAGE
 * ------------------------------------------------------------------------
 */

/**
* Allows user to edit their short URLs and view the following analytics:
* - date created
* - times visited
* - unique visits
*
* Renders HTML error if:
* - short URL does not exist in database
* - user is not logged in
* - user is logged in but is not the user who created the short URL
*/

app.get('/urls/:id', (req, res) => {
  const { user_id } = req.session;
  const { id } = req.params;
  let templateVars = {
    shortURL: id,
    longURL: '',
    user: '',
    date: '',
    timesVisited: '',
    uniqueVisits: '',
    invalidURL: false,
    noUser: false,
    isNotAuthUser: false
  };

  // Verifies if the short URL code exists in the database
  if (!urlDatabase.hasOwnProperty(id)) {
    console.log('URL does not exist');
    templateVars.invalidURL = true;
    return res.render('urls_show', templateVars);

  // Checks if user is logged in
  } else if (!user_id) {
    console.log('User not logged in');
    templateVars.noUser = true;
    return res.render('urls_show', templateVars);

  // Checks if user accessing short URL page is the creator
  } else if (urlDatabase[id].userID !== user_id) {
    console.log('User does not have access');
    templateVars.isNotAuthUser = true;
    return res.render('urls_show', templateVars);
  } else {
    // Gets unique visitors but filtering duplicate IP address entries
    const uniqueVisitors = (urlDatabase[id].ipOfVisitors).filter(getUnique);

    templateVars.longURL = urlDatabase[id].url;
    templateVars.user = users[user_id];
    templateVars.date = urlDatabase[id].date;
    templateVars.timesVisited = (urlDatabase[id].ipOfVisitors).length;
    templateVars.uniqueVisits = uniqueVisitors.length;
  }
  return res.render('urls_show', templateVars);
});

// POST to update short URL
app.post('/urls/:id', (req, res) => {
  const { user_id } = req.session;
  const { id } = req.params;
  const { longURL } = req.body;

  // Checks for valid URL format
  if (!validateWebsite(longURL)) {
    return res.status(400).send(`<h1>Please enter a valid URL</h1><a href="/urls/${id}">Go back</a>`);
  }

  // Updates urlDatabase with new values
  urlDatabase[id] = {
    userID: user_id,
    url:longURL,
    date: urlDatabase[id].date,
    ipOfVisitors: urlDatabase[id].ipOfVisitors
  };
  return res.redirect(`/urls/${id}`);
});

/**
 * ------------------------------------------------------------------------
 * REDIRECTION
 * ------------------------------------------------------------------------
 */

app.get('/u/:shortURL', (req, res) => {
  const { user_id } = req.session;
  const { shortURL } = req.params;

  // Verifies if shortURL exists in database, otherwise redirect
  if (!urlDatabase.hasOwnProperty(shortURL)) {
    return res.send('<h1>short URL code does not exist</h1><a href="/">Go back</a>');
  };
  const longURL = urlDatabase[shortURL].url;

  // Logs IP address of user to track unique visits
  urlDatabase[shortURL].ipOfVisitors.push(req.ip);
  return res.redirect(longURL);
});

/**
 * ------------------------------------------------------------------------
 * DELETE SHORT URL
 * ------------------------------------------------------------------------
 */

app.post('/urls/:id/delete', (req, res) => {
  const { user_id } = req.session;
  const { id } = req.params;

  // Verify user and user's permissions
  if (!user_id) {
    return res.status(401).send('<h1>401: Unauthorised</h1>');
  } else if (urlDatabase[id].userID !== user_id) {
    return res.status(401).send('<h1>403: Forbidden</h1>');
  } else {
    delete urlDatabase[id];
    return res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});