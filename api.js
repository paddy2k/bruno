const dotenv = require('dotenv').config();
const express = require('express');
const app = express();

app
  .get('/api', (req, res) => {
    res.send('Hello World!') 
  })
  .get('/api/mowers', (req, res) => {
    res.send('Hello MOWERS!') 
  })
;
app.listen(process.env.SERVER_PORT, () => console.log(`Example app listening on port ${process.env.SERVER_PORT}!`))
