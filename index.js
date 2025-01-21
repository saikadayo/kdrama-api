const express = require("express");
  bodyParser = require('body-parser'),
  uuid = require('uuid');

const app = express();
const morgan = require("morgan");

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

app.use(morgan());
app.use(bodyParser.json());
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
app.get('/movies', (req, res) => {
  res.json(movies);
});

// Gets the data about a single movie
app.get('/movies/:title', (req, res) => { 
  const movie = movies.find((movie) => movie.title === req.params.title); 
  
  if (movie) { 
    res.json(movie); 
  } else { 
    res.status(404).send('Movie not found.'); 
  } 
});

// Get the data about a genre by name/title 
app.get('/genre/:name', (req, res) => { 
  const genre = movies.find((movie) => movie.genre.name.toLowerCase() === req.params.name.toLowerCase())?.genre; 
  
  if (genre) { 
    res.json(genre); 
  } else { 
    res.status(400).send('Genre not found.'); 
  } 
}); 

// Get the data about a director by name
app.get('/director/:name', (req, res) => { 
  const director = movies.find((movie) => movie.director.name.toLowerCase() === req.params.name.toLowerCase())?.director; 
  
  if (director) { 
    res.json(director); 
  } else { 
    res.status(400).send('Director not found.'); 
  } 
});

// Add a new movie to our list of movies
app.post('/movies', (req, res) => {
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
app.delete('/movies/:id', (req, res) => {
  let movie = movies.find((movie) => { return movie.id === req.params.id });

  if (movie) {
    movies = movies.filter((obj) => { return obj.id !== req.params.id });
    res.status(201).send('Movie ' + req.params.id + ' was deleted.');
  }
});

// Allow new users to register 
app.post('/users', (req, res) => { 
  let newUser = req.body; 
  if (!newUser.username) { 
    const message = 'Missing username in request body'; 
    res.status(400).send(message); 
  } else { 
    newUser.id = uuid.v4(); 
    users.push(newUser); 
    res.status(201).send(newUser); 
  } 
}); 
  
// Allow users to update username
app.put('/users/:id', (req, res) => { 
  let user = users.find((user) => user.id === req.params.id); 
  if (user) { 
    user.username = req.body.username; 
    res.status(200).send(user); 
  } else { 
    res.status(404).send('User not found.'); 
  }
}); 

// Allow users to add movie to their favorite list
app.post('/users/:id/movies/:movieTitle', (req, res) => { 
  let user = users.find((user) => user.id === req.params.id); 
  let movie = movies.find((movie) => movie.title === req.params.movieTitle); 
  if (user && movie) { 
    if (!user.favorites) { 
      user.favorites = []; 
    } 
    user.favorites.push(movie.title); 
    res.status(200).send(`Movie '${movie.title}' has been added to your favorites!`); 
  } else { 
    res.status(404).send('User or movie not found.'); 
  } 
}); 

// Allow users to remove a movie from their favorite list
app.delete('/users/:id/movies/:movieTitle', (req, res) => { 
  let user = users.find((user) => user.id === req.params.id); 
  if (user && user.favorites) { 
    user.favorites = user.favorites.filter((title) => title !== req.params.movieTitle); 
    res.status(200).send(`Movie '${req.params.movieTitle}' has been removed from your favorites!`); 
  } else { 
    res.status(404).send('User not found.'); 
  }
}); 

// Allow existing users to deregister
app.delete('/users/:id', (req, res) => { 
  let user = users.find((user) => user.id === req.params.id); 
  if (user) { 
    users = users.filter((obj) => obj.id !== req.params.id); 
    res.status(200).send(`User with ID ${req.params.id} has been deregistered.`); 
  } else { 
    res.status(404).send('User not found.'); 
}
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

app.get('/', (req, res) => {
  let responseText = 'Welcome to my app!';
  responseText += '<small>Requested at: ' + req.requestTime + '</small>';
  res.send(responseText);
});

app.get('/secreturl', (req, res) => {
  let responseText = 'This is a secret url with super top-secret content.';
  responseText += '<small>Requested at: ' + req.requestTime + '</small>';
  res.send(responseText);

});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});