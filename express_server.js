// Requirements

const cookieSession = require("cookie-session");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");

// Dependencies setup

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(cookieSession({
  name: "session",
  keys: ["ljfw4OYT8QFN6OTDU4QIHEKNLEYTN4389aklhfciraljkljICWFfLFCEJKFLDSAHJKEQHLLWFEioeirtcqicq023cqerqc4rghwhg35q"],
}));

// Databases

const urlDatabase = [];

const users = {};


// Functions

  // Creates a custom URL array for individual users

const urlsForUser = function(id) {
  let userURLs = [];
  for (let object in urlDatabase) {
    if (urlDatabase[object].user_id === id) {
      userURLs.push(urlDatabase[object]);
    }
  }
  return userURLs;
}

  // Creates a random string for user IDs and Tiny URLs

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

// GET "/" Page: Redirect to URLS for user & Login otherwise

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.status(301).redirect("/urls");
  } else {
    res.status(301).redirect("/login");
  }
});

// GET New URL Page: Input a new URL for user and redirect to Login otherwise

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    res.render("urls_new", { user_id: users[req.session.user_id] });
    return;
  } else {
    res.status(403).redirect("/login/");
  }
});

// GET Registration Page: Redirect to homepage for users and a registration page otherwise

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.status(301).redirect("/urls");
  } else {
    res.render("urls_register", { user_id: users[req.session.user_id] });
  }
});

// POST Registration Page: Takes input from Registration Form

app.post("/register", (req, res) => {
  let userRandomID = generateRandomString();

  // Requires both fields to have inputs
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).end("Please fill in all form fields.");
    return;
  }

  // Check to see if email in database
  for (let user in users) {
    if (users[user].email === req.body.email) {
      res.status(400).end("You seem to be registered already! Please sign in.");
      return;
    }
  }

  // Generate a random user ID and if it is already used, then generate a new one
  if (users[userRandomID]) {
    while (users[userRandomID]) {
      userRandomID = generateRandomString();
    }
  }

  // Create a user object for the database
  users[userRandomID] = {
    id: userRandomID,
    email: req.body.email
  };

  // Create an encrypted password and add it to the user object
  bcrypt.hash(req.body.password, 10, function(err, hash) {
    if (err) {
      console.log(err);
      res.status(400).end("Server error. Please try again.");
      return;
    }
    users[userRandomID]["password"] = hash;

    // Assign a cookie and redirect to homepage
    req.session.user_id = userRandomID;
    res.status(301).redirect("/urls");
  });
});

// POST Homepage: Takes input from URL submission and adds to database

app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  for (let object in urlDatabase) {

    // If the short URL already exists, generate a new one
    if (urlDatabase[object].shortURL === randomString) {
      while (urlDatabase[object].shortURL === randomString) {
        randomString = generateRandomString();
      }
    }
  }

  // Push the new URL object to the URL database
  urlDatabase.push({
    shortURL: randomString,
    longURL: req.body.longURL,
    user_id: req.session.user_id
  });

  // Redirect to page displaying the new URL
  res.status(301).redirect(`/urls/${randomString}`);
});

// POST Login Page: Takes input from Login Form

app.post("/login", (req, res) => {

  // Ensures that both fields have input
  if (req.body.email === "" || req.body.password === "") {
    res.status(403).end("Please enter both email and password.");
    return;
  }

  // Ensure that email exists in database and assigns user to userEmailMatch variable if it does
  let userEmailMatch = null;
  for (let user in users) {
    if (users[user].email == req.body.email) {
      userEmailMatch = user;
    }
  }

  // If no user in database then it displays error
  if (userEmailMatch === null) {
    res.status(403).end("You seem to have entered the incorrect email. Please try again.");
  } else {

    // If there is a user in the database, it checks if the encrypted password matches the one in the database
    bcrypt.compare(req.body.password, users[userEmailMatch].password, function(err, response) {

      // If there is an error, it is logged to console and user receives an error message
      if (err) {
        console.log(err);
        res.status(500).end("Server error. Please try again.");
        return;
      }

      // If the passwords match then a cookie is created and they are redirected to the homepage
      if (response == true) {
        req.session.user_id = userEmailMatch;
        res.status(301).redirect("/urls");
        return;
      } else {

        // If the passwords do not match then the user receives an error
        res.status(403).end("You seem to have entered the incorrect password. Please try again.");
        return;
      }
    });
  }
});

// GET Login Page: Contains login form or redirects to homepage if already signed in

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.status(301).redirect("/urls");
  } else {
    res.render("urls_login", { user_id: users[req.session.user_id] });
  }
});

// POST Logout Page: Removes cookie and redirects to homepage

app.post("/logout", (req, res) => {
  req.session = null;
  res.status(301).redirect("/urls");
});

// GET Homepage: Displays user URLS if logged in, or message asking to login or register otherwise

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlsForUser(req.session.user_id), user_id: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

// GET Individual URL Page: Displays short URL and edit link if logged in, and short URL and message to register otherwise

app.get("/urls/:id", (req, res) => {

  // Checks if URL exists in database
  let originalURL = "There is no URL by that name!";
  let exists = null;
  for (let object in urlDatabase) {
    if (urlDatabase[object].shortURL === req.params.id) {
      originalURL = urlDatabase[object].longURL;
      exists = true;
    }
  }

  // Passes all URL information to URL Page
  let templateVars = {
    shortURL: req.params.id,
    origURL: originalURL,
    user_id: users[req.session.user_id],
    exists: exists
  };
  res.render("urls_show", templateVars);
});

// POST Individual URL Page: Takes input from the edit form

app.post("/urls/:id/", (req, res) => {
  let short = "";
  let long = "";
  for (let item in req.body) {
    short = item;
    long = req.body[item];
  }

  // Reassigns value of the long URL to a new one
  for (let object in urlDatabase) {
    if (urlDatabase[object].shortURL === short) {
      urlDatabase[object].longURL = long;
    }
  }

  //Redirects to URL page
  res.status(301).redirect(`/urls/${short}`);
});

// GET URL Redirect: Redirects to original URL

app.get("/u/:shortURL", (req, res) => {
  for (let object in urlDatabase) {
    if (urlDatabase[object].shortURL === req.params.shortURL) {
      let long = urlDatabase[object].longURL;
      res.status(301).redirect(long);
      return;
    }
  }

  // If no short URL matches in database then the user receives an error
  res.status(404).end("Page not found. Please check that you have the correct 'Tiny' URL.");
});

// POST Delete page: Takes delete input from delete button

app.post("/urls/:id/delete", (req, res) => {
  for (let object in urlDatabase) {

    // Deletes URL from database and redirects to homepage if user is logged in
    if (urlDatabase[object].user_id === req.session.user_id) {
      urlDatabase.splice(object, 1);
      res.status(301).redirect("/urls");
      return;
    }
  }

  // If not logged in then an error message is displayed
  res.status(403).end("You must be the creator of the URL to delete it!");
});

// Listen on port and log to console

app.listen(PORT, () => {
  console.log(`Listening on: https://localhost:${PORT}!`);
});








