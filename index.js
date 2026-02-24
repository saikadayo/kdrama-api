const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

// mongoose.connect('mongodb://localhost:27017/kdramaDB');
mongoose.connect(process.env.CONNECTION_URI);

const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid');

const { check, validationResult } = require('express-validator');

const app = express();
const morgan = require('morgan');

const cors = require('cors');

let allowedOrigins = [
  'http://localhost:1234',
  'http://localhost:3000',
  'http://localhost:8080'
];

app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message ), false);
    }
    return callback(null, true);
  }
}));

const passport = require('passport');
require('./passport');

app.use(morgan('combined'));

app.use(bodyParser.json());

app.use(passport.initialize());

let auth = require('./auth')(app);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('Welcome to my Korean movie list!');
});

// Get the list of all movies (NOW FROM DB)
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => { 
  await Movies.find()
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Gets the data about a single movie (NOW FROM DB)
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => { 
  await Movies.findOne({ Title: req.params.title })
    .then((movie) => {
      if (movie) {
        res.status(200).json(movie);
      } else {
        res.status(404).send('Movie not found.'); 
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get the data about a genre by name/title (NOW FROM DB)
app.get('/genre/:name', passport.authenticate('jwt', { session: false }), async (req, res) => { 
  await Movies.findOne({
    'Genre.Name': { $regex: new RegExp('^' + req.params.name + '$', 'i') }
  })
    .then((movie) => {
      if (movie && movie.Genre) {
        res.status(200).json(movie.Genre);
      } else {
        res.status(400).send('Genre not found.'); 
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
}); 

// Get the data about a director by name (NOW FROM DB)
app.get('/director/:name', passport.authenticate('jwt', { session: false }), async (req, res) => { 
  await Movies.findOne({
    'Director.Name': { $regex: new RegExp('^' + req.params.name + '$', 'i') }
  })
    .then((movie) => {
      if (movie && movie.Director) {
        res.status(200).json(movie.Director);
      } else {
        res.status(400).send('Director not found.'); 
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Add a new movie to our list of movies (NOW TO DB)
app.post('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
  let newMovie = req.body;

  if (!newMovie.Title) {
    const message = 'Missing title in request body';
    res.status(400).send(message);
  } else {
    await Movies.create(newMovie)
      .then((movie) => {
        res.status(201).json(movie);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
});

// Delete a movie from our list by ID (NOW FROM DB)
app.delete('/movies/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.findByIdAndDelete(req.params.id)
    .then((movie) => {
      if (movie) {
        res.status(201).send('Movie ' + req.params.id + ' was deleted.');
      } else {
        res.status(404).send('Movie not found.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.post('/users',
  [
    check('Username', 'Username must be at least 5 characters').isLength({min: 5}),
    check('Username', 'Username contains non-alphanumeric characters that are not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], async (req, res) => {

    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + ' already exists');
        } else {
          Users
            .create({
              Username: req.body.Username,
              Password: hashedPassword,
              Email: req.body.Email,
              Birthday: req.body.Birthday
            })
            .then((user) => { res.status(201).json(user) })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  });

// Get all users
app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get a user by username
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Allow users to update username
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  if (req.user.Username !== req.params.Username) return res.status(400).send('Permission denied');

  let updateData = {
    Username: req.body.Username,
    Email: req.body.Email,
    Birthday: req.body.Birthday
  };

  if (req.body.Password) {
    updateData.Password = Users.hashPassword(req.body.Password);
  }

  Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);

  await Users.findOneAndUpdate({ Username: req.params.Username }, {
    $set: updateData
  },
  { new: true })
  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  })
});

// Allow users to add movie to their favorite list
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  if (req.user.Username !== req.params.Username) return res.status(400).send('Permission denied');
  await Users.findOneAndUpdate({ Username: req.params.Username }, {
    $push: { FavoriteMovies: req.params.MovieID }
  },
  { new: true })
  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

// Allow users to remove a movie from their favorite list
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  if (req.user.Username !== req.params.Username) return res.status(400).send('Permission denied');
  await Users.findOneAndUpdate({ Username: req.params.Username }, {
    $pull: { FavoriteMovies: req.params.MovieID }
  },
  { new: true })
  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

// Allow existing users to deregister
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  if (req.user.Username !== req.params.Username) return res.status(400).send('Permission denied');
  await Users.findOneAndDelete({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.get('/secreturl', passport.authenticate('jwt', { session: false }), (req, res) => {
  let responseText = 'This is a secret url with super top-secret content.';
  responseText += '<small>Requested at: ' + req.requestTime + '</small>';
  res.send(responseText);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const port = process.env.PORT || 8080;

app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});