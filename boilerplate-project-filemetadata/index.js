var express = require('express');
var cors = require('cors');
var multer = require('multer')
require('dotenv').config()

var app = express();

app.use(cors());
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/fileanalyse', multer().single('upfile'), function (req, res, next) {
  if (req.file) {
    const { originalname: name, mimetype: type, size } = req.file
    res.json({ name, type, size })
  } else {
    res.json({ error: 'no file' })
  }
})

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Your app is listening on port ' + port)
});
