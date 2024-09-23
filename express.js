const express = require('express');

const app = express();
// app.use(compression());

app.get('/favicon.ico', (req, res) => res.status(200).send());
app.use(express.static('./src'));
app.listen(3001, () => console.log('Example app listening on port 3001!'));