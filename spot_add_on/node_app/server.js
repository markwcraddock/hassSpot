const express = require('express');
const app = express();
const port = 3001;

app.get('/', (req, res) => {
  res.send('Hello, Home Assistant!');
});

app.listen(port, '0.0.0.0',() => {
  console.log(`Hello World app now listening at http://localhost:${port}`);
});
