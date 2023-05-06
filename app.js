/* eslint-disable no-console */
const express = require('express');
const path = require('path');

// eslint-disable-next-line import/no-extraneous-dependencies
const bodyParser = require('body-parser');
// eslint-disable-next-line no-unused-vars
const { Session, PlayersName } = require('./models');

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

app.get('/createSession/:id', async (req, resp) => {
  try {
    const sessionItem = await Session.findByPk(req.params.id);
    const playersList = await PlayersName.findAll({
      where: {
        sessionId: sessionItem.id,
      },
    });
    const players = playersList.map((player) => player.name).join(',');
    resp.render('createSession', {
      title: 'Edit Session',
      sessionItem,
      players,
    });
  } catch (error) {
    console.log(error);
  }
});

app.get('/createSession', (req, resp) => {
  resp.render('createSession', {
    title: 'Create New Session',
    sessionItem: null,
    players: null,
  });
});

app.post('/createSession', async (req, resp) => {
  try {
    let ses = null;
    console.log(req.query.id);
    if (req.query.id) {
      const dueDate = new Date(req.body.dueDate);
      console.log('YAY id is specified');
      ses = await Session.update_existing_session({
        dueDate,
        venue: req.body.venue,
        num_players: req.body.num_players,
        id: req.query.id,
      });
    } else {
      console.log('NO ID SPECIFIED');
      ses = await Session.add_session({
        dueDate: req.body.dueDate,
        venue: req.body.venue,
        num_players: req.body.num_players,
      });
    }
    await PlayersName.add_players(req.body.players, ses.id);
    resp.redirect('/');
  } catch (error) {
    console.log(error);
  }
});

app.get('/editSession/:id', async (req, resp) => {
  const title = 'Edit Session';
  try {
    const sessionItem = await Session.findByPk(req.params.id);
    const playersList = await PlayersName.findAll({
      where: {
        sessionId: sessionItem.id,
      },
    });

    resp.render('editSession', {
      title,
      sessionItem,
      playersList,
    });
  } catch (error) {
    console.log(error);
  }
});

app.delete('/editSession/:playerId', async (req, res) => {
  try {
    await PlayersName.remove_player(req.params.playerId);
    return res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    return this.response.status(422).json(error);
  }
});

module.exports = app;
