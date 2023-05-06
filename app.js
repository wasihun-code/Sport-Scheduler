/* eslint-disable no-console */
const express = require('express');
const path = require('path');

// eslint-disable-next-line import/no-extraneous-dependencies
const bodyParser = require('body-parser');
// eslint-disable-next-line no-unused-vars
const { session, PlayersName } = require('./models');

const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, resp) => {
  const title = 'Sports Scheduler';

  resp.render('index', {
    title,
  });
});

app.get('/createSession', (req, resp) => {
  resp.render('createSession', {
    title: 'Create New Session',
  });
});

app.post('/createSession', async (req, resp) => {
  try {
    console.log(req.body);

    const ses = await session.add_session({
      date: req.body.dueDate,
      venue: req.body.venue,
      num_players: req.body.num_players,
    });
    console.log(ses.id);
    await PlayersName.add_players(req.body.players, ses.id);
    resp.redirect('/');
  } catch (error) {
    console.log(error);
  }
});

app.get('/editSession/:id', async (req, resp) => {
  const title = 'Edit Session';
  try {
    console.log('Oh my');
    const sessionItem = await session.findByPk(req.params.id);
    resp.render('editSession', {
      title,
      sessionItem,
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = app;
