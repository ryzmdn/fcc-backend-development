const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB is connected successfully'))
  .catch((error) => console.log(error));

const exerciseSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true },
}, { collection: 'exercises' });

const logSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  username: { type: String, required: true },
  count: { type: Number, required: true },
  log: [{
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, required: true },
  }],
}, { collection: 'logs' });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
}, { collection: 'users' });

const Exercise = mongoose.model('Exercise', exerciseSchema);
const Log = mongoose.model('Log', logSchema);
const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', (req, res) => {
  const user = new User({ username: req.body.username });
  user.save()
    .then(savedUser => {
      res.json(savedUser);
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

app.get('/api/users', (req, res) => {
  User.find()
    .then(users => {
      res.json(users);
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  User.findById(req.params._id)
    .then(user => {
      if (!user) {
        return res.status(404).send('User Not Found!');
      }

      const date = req.body.date ? new Date(req.body.date) : new Date();
      const exercise = new Exercise({
        user_id: user._id,
        username: user.username,
        description: req.body.description,
        duration: parseInt(req.body.duration),
        date,
      });

      exercise.save()
        .then(savedExercise => {
          Exercise.find({ user_id: user._id })
            .then(exercises => {
              const log = exercises.map(({ description, duration, date }) => ({
                description,
                duration,
                date,
              }));

              const count = log.length;

              Log.findByIdAndUpdate(
                user._id,
                {
                  _id: user._id,
                  username: user.username,
                  count,
                  log
                },
                { upsert: true, new: true }
              )
                .then(() => {
                  res.json({
                    _id: user._id,
                    username: user.username,
                    description: savedExercise.description,
                    duration: savedExercise.duration,
                    date: savedExercise.date.toDateString(),
                  });
                })
                .catch(err => {
                  res.status(500).json({ error: err.message });
                });
            })
            .catch(err => {
              res.status(500).json({ error: err.message });
            });
        })
        .catch(err => {
          res.status(500).json({ error: err.message });
        });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const { from, to, limit } = req.query;

  Log.findById(req.params._id)
    .then(user_log => {
      if (!user_log) {
        return res.status(404).send('User Log Not Found!');
      }

      let filteredLog = user_log.log;

      if (from) {
        const fromDate = new Date(from);
        filteredLog = filteredLog.filter(log => log.date >= fromDate);
      }

      if (to) {
        const toDate = new Date(to);
        filteredLog = filteredLog.filter(log => log.date <= toDate);
      }

      if (limit) {
        filteredLog = filteredLog.slice(0, parseInt(limit));
      }

      const log_obj = filteredLog.map((obj) => ({
        description: obj.description,
        duration: obj.duration,
        date: new Date(obj.date).toDateString()
      }));

      res.json({
        _id: user_log._id,
        username: user_log.username,
        count: log_obj.length,
        log: log_obj
      });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});