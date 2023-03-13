const express = require('express');
const session = require('express-session');

const app = express();

app.use(session({
  secret: "changeit",
  resave: true,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
}))

app.get('/', (req, res) => {
  console.log(req.session.id)
  req.session.views = (req.session.views || 0) + 1;
  res.send(`You have viewed this page ${req.session.views} times`);
});

app.listen(3000, () => console.log('Listening on port 3000!'));