const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/kdramaDB');

const express = require("express");
  bodyParser = require('body-parser'),
  uuid = require('uuid');

const { check, validationResult } = require('express-validator');

const app = express();
const morgan = require("morgan");

const cors = require('cors');

let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];

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

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

let movies = [{
    title: 'Parasite',
    director: {
      name: 'Bong Joon Ho',
      bio: 'He is a man who makes movies.',
      birthYear: '1969'
    },
    genre: {
      name: 'Thriller',
      description: 'spooky movies'
    }
  },
  {
    title: 'Past Lives',
    director: {
      name: 'Celine Song',
      bio: 'She makes romance movies.',
      birthYear: '1988'
    },
    genre: {
      name: 'Romance',
      description: 'lovey dovey'
    }
  },
  {
    title: 'Mother',
    director: {
      name: 'Bong Joon Ho',
      bio: 'He is a man who makes movies.',
      birthYear: '1969'
    },
    genre: {
      name: 'Horror',
      description: 'terrifying things'
    }
  },
  {
    title: 'Sympathy for Mr. Vengeance',
    director: {
      name: 'Park Chan-wook',
      bio: 'He makes horror and romance films.',
      birthYear: '1963'
    },
    genre: {
      name: 'Horror',
      description: 'terrifying things'
    }
  },
  {
    title: 'Burning',
    director: {
      name: 'Lee Chang-Dong',
      bio: 'He does suspense films.',
      birthYear: '1954'
    },
    genre: {
      name: 'Suspense',
      description: 'puts you on the edge of your seat'
    }
  },
  {
    title: 'The Handmaiden',
    director: {
      name: 'Park Chan-wook',
      bio: 'He makes horror and romance films.',
      birthYear: '1963'
    },
    genre: {
      name: 'Romance',
      description: 'lovey dovey'
    }
  },
  {
    title: 'Castaway in the Moon',
    director: {
      name: 'Lee Hae-jun',
      bio: 'She makes lovey dovey movies.',
      birthYear: '1973'
    },
    genre: {
      name: 'Romance',
      description: 'lovey dovey'
    }
  },
  {
    title: '1987: When the Day Comes',
    director: {
      name: 'Jung Sung ho',
      bio: 'He is a family man and makes family movies.',
      birthYear: '1974'
    },
    genre: {
      name: 'Drama',
      description: 'all the tea'
    }
  },
  {
    title: 'Marathon',
    director: {
      name: 'Yoon-Chul Jung',
      bio: 'He makes juicy drama films.',
      birthYear: '1971'
    },
    genre: {
      name: 'Drama',
      description: 'all the tea'
    }
  },
  {
    title: 'Moonlit Winter',
    director: {
      name: 'Dae Hyung Lim',
      bio: 'He makes some swoon-worthy movies.',
      birthYear: '1986'
    },
    genre: {
      name: 'Romance',
      description: 'lovey dovey'
    }
  }
];

let users= [];

app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('Welcome to my Korean movie list!');
});

// app.get('/documentation', (req, res) => {
//   res.sendFile('public/documentation.html', {
//     root: __dirname
//   });
// });

// Get the list of all movies
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json(movies);
});

// Gets the data about a single movie
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), (req, res) => { 
  const movie = movies.find((movie) => movie.title === req.params.title); 
  
  if (movie) { 
    res.json(movie); 
  } else { 
    res.status(404).send('Movie not found.'); 
  } 
});

// Get the data about a genre by name/title 
app.get('/genre/:name', passport.authenticate('jwt', { session: false }), (req, res) => { 
  const genre = movies.find((movie) => movie.genre.name.toLowerCase() === req.params.name.toLowerCase())?.genre; 
  
  if (genre) { 
    res.json(genre); 
  } else { 
    res.status(400).send('Genre not found.'); 
  } 
}); 

// Get the data about a director by name
app.get('/director/:name', passport.authenticate('jwt', { session: false }), (req, res) => { 
  const director = movies.find((movie) => movie.director.name.toLowerCase() === req.params.name.toLowerCase())?.director; 
  
  if (director) { 
    res.json(director); 
  } else { 
    res.status(400).send('Director not found.'); 
  } 
});

// Add a new movie to our list of movies
app.post('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
  let newMovie = req.body;

  if (!newMovie.title) {
    const message = 'Missing title in request body';
    res.status(400).send(message);
  } else {
    newMovie.id = uuid.v4();
    movies.push(newMovie);
    res.status(201).send(newMovie);
  }
});

// Delete a movie from our list by ID
app.delete('/movies/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  let movie = movies.find((movie) => { return movie.id === req.params.id });

  if (movie) {
    movies = movies.filter((obj) => { return obj.id !== req.params.id });
    res.status(201).send('Movie ' + req.params.id + ' was deleted.');
  }
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

// let myLogger = (req, res, next) => {
//   console.log(req.url);
//   next();
// };

// let requestTime = (req, res, next) => {
//  req.requestTime = Date.now();
//  next();
// };

// app.use(myLogger);
// app.use(requestTime);

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