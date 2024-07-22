const express = require("express");
const app = express();
const morgan = require("morgan");

let topMovies = [{
    title: 'Parasite',
    director: 'Bong Joon Ho'
  },
  {
    title: 'Past Lives',
    director: 'Celine Song'
  },
  {
    title: 'Mother',
    director: 'Bong Joon Ho'
  },
  {
    title: 'Sympathy for Mr. Vengeance',
    director: 'Park Chan-wook'
  },
  {
    title: 'Burning',
    director: 'Lee Chang-Dong'
  },
  {
    title: 'The Handmaiden',
    director: 'Park Chan-wook'
  },
  {
    title: 'Castaway in the Moon',
    director: 'Lee Hae-jun'
  },
  {
    title: '1987: When the Day Comes',
    director: 'Jung Sung ho'
  },
  {
    title: 'Marathon',
    director: 'Yoon-Chul Jung'
  },
  {
    title: 'Moonlit Winter',
    director: 'Dae Hyung Lim'
  }
];

app.use(morgan())
app.use(express.static('public'));

// GET requests
app.get('/', (req, res) => {
  res.send('Welcome to my Korean movie list!');
});

// app.get('/documentation', (req, res) => {
//   res.sendFile('public/documentation.html', {
//     root: __dirname
//   });
// });

app.get('/movies', (req, res) => {
  res.json(topMovies);
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