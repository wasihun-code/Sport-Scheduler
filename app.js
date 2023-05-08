/* eslint-disable no-console */
const express = require('express');
const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const bodyParser = require('body-parser');
// eslint-disable-next-line no-unused-vars
const { Session, PlayersName, Sport } = require('./models');

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

app.get('/sport/:sportId/createSession', async (req, res) => {
  res.render('createSession', {
    title: 'Create New Session',
    sessionItem: null,
    players: null,
    sportId: req.params.sportId,
  });
});

app.get('/sport/:sportId/createSession/:sessionId', async (req, resp) => {
  const { sportId } = req.params;

  const sessionItem = await Session.findByPk(req.params.sessionId);
  const playersList = await PlayersName.findAll({
    where: {
      sessionId: sessionItem.id,
    },
  });
  const players = playersList.map((player) => player.name).join(',');
  resp.render('createSession', {
    title: 'Create New Session',
    sessionItem,
    players,
    sportId,
  });
});

app.post('/createSession', async (req, resp) => {
  try {
    let ses = null;

    const id = Number(req.body.sessionId);
    const dueDate = new Date(req.body.dueDate); // Parse the HTML datetime-local string

    const sportId = Number(req.body.sportId); // Extract sportId from path
    console.log('sportId inside post:', sportId);

    if (req.body.sessionId) {
      ses = await Session.update_existing_session({
        dueDate,
        venue: req.body.venue,
        num_players: req.body.num_players,
        sportId,
        id,
      });
      await PlayersName.update_players(req.body.players, id);
      resp.redirect(`/sport/${sportId}/editSession/${id}`);
      console.log('After Updating: ', id);
      console.log('type of id', typeof (id));
    } else {
      ses = await Session.add_session({
        dueDate: req.body.dueDate,
        venue: req.body.venue,
        num_players: req.body.num_players,
        sportId,
      });
      await PlayersName.add_players(req.body.players, ses.id);
      resp.redirect(`/sport/${sportId}/editSession/${ses.id}`);
    }
  } catch (error) {
    console.log(error);
  }
});

app.get('/sport/:sportId/editSession/:sessionId', async (req, resp) => {
  const title = 'Edit Session';
  try {
    const sportId = Number(req.params.sportId);
    console.log('sportId inside listing players page', sportId);
    const sessionItem = await Session.findByPk(req.params.sessionId);
    const playersList = await PlayersName.findAll({
      where: {
        sessionId: sessionItem.id,
      },
    });

    resp.render('editSession', {
      title,
      sessionItem,
      playersList,
      sportId,
    });
  } catch (error) {
    console.log(error);
  }
});

// eslint-disable-next-line no-unused-vars
app.delete('/editSession/deletePlayer/:playerId', async (req, res) => {
  try {
    await PlayersName.remove_player(req.params.playerId);
    res.render('index');
  } catch (error) {
    console.log(error);
  }
});

app.delete('/editSession/deleteSession/:sessionId', async (req, res) => {
  try {
    await Session.remove_session(req.params.sessionId);
    console.log('Removed');
    res.render('index');
  } catch (error) {
    console.log(error);
  }
});

app.get('/createSport', (req, resp) => {
  resp.render('createSport', {
    title: 'Create Sport',
  });
});

app.get('/sport/:id', async (req, resp) => {
  const sport = await Sport.findByPk(req.params.id);
  const sessionItem = await Session.findAll({
    where: {
      sportId: sport.id,
    },
  });
  resp.render('sport', {
    sport,
    sessionItem,
  });
});

app.post('/createSport', async (req, res) => {
  try {
    const sport = await Sport.create_sport(req.body.title);
    res.redirect(302, `/sport/${sport.id}`);
  } catch (error) {
    console.log(error);
  }
});

module.exports = app;
