const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const urlsArr = [];

for (url in urlDatabase) {
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

app.listen(PORT, () => {
  console.log(`Listening on: https://localhost:${PORT}!`);
});