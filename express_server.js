const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const urlsArr = [];

for (let url in urlDatabase) {
  urlsArr.push({ "shortened": url, "original": urlDatabase[url] });
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

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlsArr };
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
    origURL: originalURL
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Listening on: https://localhost:${PORT}!`);
});