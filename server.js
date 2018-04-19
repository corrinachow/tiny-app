// server.js

const express = require('express');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.set('view engine', 'ejs');


app.use((req, res, next) => {
  // console.log(`${req.cookies}`);
  next();
});

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "user3RandomID": {
    id: "user2RandomID",
    email: "example@example.com",
    password: "tests"
  }
};

// app.get("/", (req, res) =>
//   if(req.cookies.NAMEOFKEY) {
//     res.render(...)
//   } else if (req.cookies.NAMEOFKEY) {
//     res.render(...)
//   } else {
//     res.render('/register')
//   }
// });


/* REGISTRATION */

app.get("/register", (req, res) => {
  let templateVars = { urls: urlDatabase,
    user_id: users['user_id']
  };
  res.render("urls_register");
});

function checkExistingUsers(userInput, key) {
  console.log(key)
  //Retrieve all user_ids
  const currentUsers = Object.keys(users);
  //Loops through users using user_ids
  for (const user of currentUsers) {
    //if the user_id exists in the users object and is equal to the userInput
    if (users[user][key] === userInput) {
      return true;
    };
  };
  return false;
}

app.post("/register", (req, res) => {
  console.log(req.body.email)
  if (!req.body.email || !req.body.password || checkExistingUsers(req.body.email, 'email')) {
    res.status(400).send('Bad request')
  } else {
    const newUser = {
      id: generateRandomStr(),
      email: req.body.email,
      password: req.body.password,
    };
    users[newUser['id']] = newUser;
    res.cookie('user_id', newUser.id);
    let templateVars = { urls: urlDatabase,
    user_id: users['user_id'] };
    res.redirect('/urls');
}
});


function getUserID(email) {
  const currentUsers = Object.keys(users);
  for (const user of currentUsers) {
    if (users[user].email === email) {
      return user;
    };
  };
}

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

/* HOME PAGE */

app.get('/' , (req, res) => {

  console.log(req.cookies);
  let templateVars = { urls: urlDatabase,
  user_id: req.cookies.user_id,
  users: users }
  res.render('urls_index', templateVars)
})

/* LOGIN FORM */

app.get('/login' , (req, res) => {
  res.render('login_form')
});

app.post("/login", (req, res) => {
  if (checkExistingUsers(req.body.email, 'email') && checkExistingUsers(req.body.password, 'password')) {
    const userID = getUserID(req.body.email);
    res.cookie('user_id', userID)
    res.redirect('/')
  } else {
    res.status(403).send('403: User does not exist :(');
  }

  console.log(req.body.email)
  console.log(req.body.password)

  // res.cookie('user_id', req.body.email, 'password',req.body.password);
  // console.log(req.cookies)
  // res.send(req.cookies)
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

/* POST LOGIN */

app.get("/urls", (req, res) => {
  console.log(req.cookies.user_id)
  let templateVars = { urls: urlDatabase, users: users, user_id: undefined };
  if (req.cookies.user_id) {
    templateVars.user_id = req.cookies.user_id;
  };
  // console.log(`Current cookies: ${req.cookies.user_id.id}`)

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { urls: urlDatabase,
    user_id: users['user_id']};
  res.render("urls_new", templateVars);
});

app.post("/urls/new", (req, res) => {
  const shortURL = generateRandomStr();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, urls: urlDatabase[req.params.id], user_id: req.cookies['user_id'] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
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
  res.redirect('/urls');
});

function generateRandomStr() {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});