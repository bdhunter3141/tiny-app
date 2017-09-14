const cookieSession = require("cookie-session");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(cookieSession({
  name: "session",
  keys: ["ljfw4OYT8QFN6OTDU4QIHEKNLEYTN4389aklhfciraljkljICWFfLFCEJKFLDSAHJKEQHLLWFEioeirtcqicq023cqerqc4rghwhg35q"],
}));

const urlDatabase = [];

const users = {};

const urlsForUser = function(id) {
  let userURLs = [];
  for (let object in urlDatabase) {
    if (urlDatabase[object].user_id === id) {
      userURLs.push(urlDatabase[object]);
    }
  }
  return userURLs;
}

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
  if (req.session.user_id) {
    res.render("urls_new", { user_id: users[req.session.user_id] });
    return;
  } else {
    res.status(403).redirect("/login/");
  }
});

app.get("/register", (req, res) => {
  res.render("urls_register", { user_id: users[req.session.user_id] });
});

app.post("/register", (req, res) => {
  let userRandomID = generateRandomString();
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).end("Please fill in all form fields.");
    return;
  }
  for (let user in users) {
    if (users[user].email === req.body.email) {
      res.status(400).end("You seem to be registered already! Please sign in.");
      return;
    }
  }
  if (users[userRandomID]) {
    while (users[userRandomID]) {
      userRandomID = generateRandomString();
    }
  }
  users[userRandomID] = {
    id: userRandomID,
    email: req.body.email
  };
  bcrypt.hash(req.body.password, 10, function(err, hash) {
    if (err) {
      console.log(err);
      res.status(400);
      return;
    }
    users[userRandomID]["password"] = hash;
    console.log(users[userRandomID])
    req.session.user_id = userRandomID;
    res.status(301).redirect("/urls");
  });
});

app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  for (let object in urlDatabase) {
    if (urlDatabase[object].shortURL === randomString) {
      while (urlDatabase[object].shortURL === randomString) {
        randomString = generateRandomString();
      }
    }
  }
  urlDatabase.push({
    shortURL: randomString,
    longURL: req.body.longURL,
    user_id: req.session.user_id
  });
  res.status(301).redirect(`/urls/${randomString}`);
});

app.post("/login", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(403).end("Please enter both email and password.");
    return;
  }
  let userEmailMatch = null;
  for (let user in users) {
    if (users[user].email == req.body.email) {
      userEmailMatch = user;
    }
  }
  if (userEmailMatch === null) {
    res.status(403).end("You seem to have entered the incorrect email. Please try again.");
  } else {
    bcrypt.compare(req.body.password, users[userEmailMatch].password, function(err, response) {
      if (err) {
        console.log(err);
        res.status(500).end("Server error.");
        return;
      }
      if (response == true) {
        req.session.user_id = userEmailMatch;
        res.status(301).redirect("/urls");
        return;
      } else {
        res.status(403).end("You seem to have entered the incorrect password. Please try again.");
        return;
      }
    });
  }
});

app.get("/login", (req, res) => {
  res.render("urls_login", { user_id: users[req.session.user_id] });
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.status(301).redirect("/urls");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlsForUser(req.session.user_id), user_id: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let originalURL = "There is no URL by that name!";
  let exists = null;
  for (let object in urlDatabase) {
    if (urlDatabase[object].shortURL === req.params.id) {
      originalURL = urlDatabase[object].longURL;
      exists = true;
    }
  }
  let templateVars = {
    shortURL: req.params.id,
    origURL: originalURL,
    user_id: users[req.session.user_id],
    exists: exists
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/", (req, res) => {
  let short = "";
  let long = "";
  for (let item in req.body) {
    short = item;
    long = req.body[item];
  };
  for (let object in urlDatabase) {
    if (urlDatabase[object].shortURL === short) {
      urlDatabase[object].longURL = long;
    }
  }
  res.status(301).redirect(`/urls/${short}`);
});

app.get("/u/:shortURL", (req, res) => {
  for (let object in urlDatabase) {
    if (urlDatabase[object].shortURL === req.params.shortURL) {
      let long = urlDatabase[object].longURL;
      res.status(301).redirect(long);
      return;
    }
  }
  res.status(404).end("Page not found. Please check that you have the correct 'Tiny' URL.");
});

app.post("/urls/:id/delete", (req, res) => {
  for (let object in urlDatabase) {
    if (urlDatabase[object].user_id === req.session.user_id) {
      urlDatabase.splice(object, 1);
      res.status(301).redirect("/urls");
      return;
    }
  }
  res.status(403).end("You must be the creator of the URL to delete it!");
});

app.listen(PORT, () => {
  console.log(`Listening on: https://localhost:${PORT}!`);
});








