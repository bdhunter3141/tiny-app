const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

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
  }
};

let currentUser= null;

function generateRandomString() {
  const letterNumberBank = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  let randomStringArr = [];
  for (let val of letterNumberBank) {
    if (!randomStringArr[5]) {
      randomStringArr.push(letterNumberBank[Math.floor(Math.random() * letterNumberBank.length) + 1]);
    }
  }
  let randomString = randomStringArr.join("");
  return randomString;
}

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>");
});

app.get("/urls/new", (req, res) => {
  if (req.cookies.user_id) {
    res.render("urls_new", { user_id: users[req.cookies.user_id] });
  } else {
    res.status(403).redirect("/login/");
  }
});

app.get("/register", (req, res) => {
  res.render("urls_register", { user_id: users[req.cookies.user_id] });
});

app.post("/register", (req, res) => {
  let userRandomID = generateRandomString();
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).end("Please fill in all form fields.");
  }
  for (user in users) {
    if (users[user].email === req.body.email) {
      res.status(400).end("You seem to be registered already! Please sign in.");
    }
  }
  if (users[userRandomID]) {
    while (users[userRandomID]) {
      userRandomID = generateRandomString();
    }
  }
  users[userRandomID] = {
    id: userRandomID,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie("user_id", userRandomID);
  res.status(301).redirect("/urls");
});

app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  if (urlDatabase[randomString]) {
    while (urlDatabase[randomString]) {
      randomString = generateRandomString();
    }
  }
  urlDatabase[randomString] = req.body.longURL;
  res.status(301).redirect(`/urls/${randomString}`);
});

app.post("/login", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(403).end("Please enter both email and password.");
  }
  for (user in users) {
    if (users[user].email == req.body.email) {
      if (users[user].password == req.body.password) {
        res.cookie("user_id", user);
        res.status(301).redirect("/urls");
      } else {
        res.status(403).end("You seem to have entered the incorrect password. Please try again.");
      }
    }
  }
  res.status(403).end("You seem to have entered the incorrect email. Please try again.");
});

app.get("/login", (req, res) => {
  res.render("urls_login", { user_id: users[req.cookies.user_id] });
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.status(301).redirect("/urls");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user_id: users[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let originalURL = "There is no URL by that name!";
  for (let short in urlDatabase) {
    if (short === req.params.id) {
      originalURL = urlDatabase[short];
    }
  }
  let templateVars = {
    shortURL: req.params.id,
    origURL: originalURL,
    user_id: users[req.cookies.user_id]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/", (req, res) => {
  let shortURL = "";
  let longURL = "";
  for (let item in req.body) {
    shortURL = item;
    longURL = req.body[item];
  };
  urlDatabase[shortURL] = longURL;
  res.status(301).redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let longURL = urlDatabase[req.params.shortURL];
    res.status(301).redirect(longURL);
  } else {
    res.status(404).end("Page not found. Please check that you have the correct 'Tiny' URL.");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.status(301).redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Listening on: https://localhost:${PORT}!`);
});








