require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');

// Basic Configuration
const port = process.env.PORT || 3000;
const DNS = require('dns');

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

let urls = [];
let urlId = 0;

// Your first API endpoint
app.post('/api/shorturl', (req, res) => {
  const { url: _url } = req.body;

  if (_url === "") {
    return res.json({ "error": "invalid url" });
  }

  const modified_url = _url.replace(/(ftp|http|https):\/\/(\w+:?\w*@)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/, '');

  try {
    new URL(_url); // Removed the assignment to parsed_url
  } catch (err) {
    return res.json({ "error": "invalid url" });
  }

  DNS.lookup(modified_url, (err) => {
    if (err) {
      return res.json({ "error": "invalid url" });
    } else {
      const urlExists = urls.find(l => l.original_url === _url);

      if (urlExists) {
        return res.json(
          {
            original_url: _url,
            short_url: urlId
          }
        );
      } else {
        urlId++;

        const urlObj = {
          original_url: _url,
          short_url: `${urlId}`
        };

        urls.push(urlObj);

        return res.json(
          {
            original_url: _url,
            short_url: urlId
          }
        );
      }
    }
  });
});

app.get('/api/shorturl/:urlId', (req, res) => {
  const { urlId: _id } = req.params;

  const shortUrl = urls.find(sl => sl.short_url === _id);

  if (shortUrl) {
    return res.redirect(shortUrl.original_url);
  } else {
    return res.json({ "error": "invalid URL" });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});