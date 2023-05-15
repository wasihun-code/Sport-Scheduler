/* eslint-disable no-unused-vars */
/* eslint-disable consistent-return */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable camelcase */
/* eslint-disable no-console */
const express = require('express');
const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const bodyParser = require('body-parser');
// eslint-disable-next-line no-unused-vars

const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// bcrypt config
const passport = require('passport');
// eslint-disable-next-line no-unused-vars
const connectEnsureLogin = require('connect-ensure-login');
const session = require('express-session');
// eslint-disable-next-line import/no-extraneous-dependencies
const flash = require('connect-flash');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const signupErrorHandling = require('./utility');

const saltRounds = 10;
const {
  User, Session, Sport, PlayersName,
} = require('./models');

const { sportsQuotes } = require('./utility');

// Passport Js Configuration
app.use(flash());

app.use(
  session({
    secret: 'my-super-secret-key-187657654765423456788',
    resave: true,
    saveUninitialized: false,
    cookies: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

app.use((req, resp, next) => {
  // eslint-disable-next-line no-param-reassign
  resp.locals.messages = req.flash();
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          }
          return done(null, false, {
            message: 'Invalid email or password',
          });
        })
        .catch(() => done(null, false, {
          message: 'Invalid email or password',
        }));
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get('/signup', (request, response) => {
  response.render('signup', {
    title: 'Signup',
  });
});

app.post('/users', async (req, resp) => {
  // A utility function for handling erros
  if (!req.body.first_name.length) {
    req.flash('error', 'First name is required');
    return resp.redirect('/signup');
  }

  if (!req.body.last_name.length) {
    req.flash('error', 'Last name is required');
    return resp.redirect('/signup');
  }

  if (!req.body.email.length) {
    req.flash('error', 'Email is required');
    return resp.redirect('/signup');
  }

  if (req.body.password.length < 6) {
    req.flash('error', 'Minimum password length is 6');
    return resp.redirect('/signup');
  }

  if (req.body.is_admin === 'Yes' && req.body.master_password < 4) {
    if (req.body.master_password !== 1234) {
      req.flash('error', 'Master password was incorrect');
    } else {
      req.flash('error', 'Minimum Master password length is 4');
    }
    return resp.redirect('/signup');
  }

  const is_admin = req.body.is_admin === 'yes';
  const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
  const { first_name, last_name, email } = req.body;
  try {
    const user = await User.add_user(first_name, last_name, email, hashedPassword, is_admin);
    req.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      resp.redirect('/listSports');
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      req.flash('error', 'Email already exists');
      return resp.redirect('/signup');
    }
  }
});

app.get('/login', (req, resp) => {
  resp.render('login', { title: 'Login' });
});

app.post(
  '/session',
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true,
  }),
  (req, resp) => {
    resp.redirect('/listSports');
  },
);

app.get('/', (req, resp) => {
  const title = 'Sports Scheduler';
  resp.render('login', {
    title,
  });
});

app.get(
  '/listSports',
  connectEnsureLogin.ensureLoggedIn(),
  async (req, resp) => {
    let sports;
    const { id } = req.user;
    const userisadmin = !!req.user.is_admin;

    if (req.user.is_admin) {
      sports = await Sport.get_all_sports_user(id);
    } else {
      sports = await Sport.findAll();
    }

    resp.render('listSports', {
      title: 'Sports List',
      sports,
      userisadmin,
    });
  },
);

app.get(
  '/createSport',
  connectEnsureLogin.ensureLoggedIn(),
  (req, resp) => {
    resp.render('createSport', {
      title: 'Create Sport',
      quotes: sportsQuotes,
      sport: null,
    });
  },
);

app.get(
  '/createSport/:sportId',
  connectEnsureLogin.ensureLoggedIn(),
  async (req, resp) => {
    const sport = await Sport.findByPk(req.params.sportId);
    resp.render('createSport', {
      title: 'Edit Sport',
      quotes: sportsQuotes,
      sport,
    });
  },
);

app.post('/createSport', async (req, res) => {
  try {
    if (req.body.sportId) {
      await Sport.update_sport(req.body.title, req.user.id, req.body.sportId);
      res.redirect(302, `/sport/${Number(req.body.sportId)}`);
    } else {
      const sport = await Sport.create_sport(req.body.title, req.user.id);
      res.redirect(302, `/sport/${Number(sport.id)}`);
    }
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      req.flash('error', 'Sport already exists. Choose another name.');
      res.redirect('/createSport');
    }
  }
});

app.get(
  '/sport/:id',
  connectEnsureLogin.ensureLoggedIn(),
  async (req, resp) => {
    const { id, first_name } = req.user;
    const sport = await Sport.findByPk(req.params.id);
    const sportId = sport.id;
    const userisadmin = !!req.user.is_admin;
    const past_sessions = await Session.get_past_sessions(sportId);
    const player_sessions_id = (await
    PlayersName.findAll({ where: { name: first_name } })).map((player) => player.sessionId);
    // eslint-disable-next-line max-len
    const current_sessions_others = await Session.get_current_sessions_of_other_users(sportId, id);
    const current_user_sessions = await Session.get_current_sessions_of_user(sportId, req.user.id);
    const joined_sessions = await Session.joined_session(sportId, player_sessions_id);
    // eslint-disable-next-line no-restricted-syntax

    resp.render('sport', {
      sport,
      past_sessions,
      current_sessions_others,
      current_user_sessions,
      joined_sessions,
      userisadmin,
    });
  },
);

app.get(
  '/sport/:sportId/createSession',
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    res.render('createSession', {
      title: 'Create New Session',
      sessionItem: null,
      players: null,
      sportId: req.params.sportId,
    });
  },
);

app.get(
  '/sport/:sportId/createSession/:sessionId',
  connectEnsureLogin.ensureLoggedIn(),
  async (req, resp) => {
    const { sportId } = req.params;

    const sessionItem = await Session.findByPk(req.params.sessionId);
    const playersList = await PlayersName.findAll({
      where: {
        sessionId: req.params.sessionId,
      },
    });
    const players = playersList.map((player) => player.name).join(',');
    resp.render('createSession', {
      title: 'Create New Session',
      sessionItem,
      players,
      sportId,
    });
  },
);

app.post('/sport/:sportId/createSession', async (req, resp) => {
  try {
    let sessionItem;

    const id = Number(req.body.sessionId);
    const sportId = Number(req.params.sportId); // Extract sportId from path
    const userId = req.user.id;
    // eslint-disable-next-line prefer-const
    let { venue, num_players, dueDate } = req.body;
    dueDate = new Date(req.body.dueDate); // Parse the HTML datetime-local string

    if (req.body.sessionId) {
      await Session.update_existing_session(dueDate, venue, num_players, sportId, userId, id);
      await PlayersName.update_players(req.body.players, req.user.first_name, id);
      resp.redirect(`/sport/${sportId}/editSession/${id}`);
    } else {
      sessionItem = await Session.add_session(dueDate, venue, num_players, sportId, userId);
      await PlayersName.add_players(req.body.players, req.user.first_name, sessionItem.id);
      resp.redirect(`/sport/${sportId}/editSession/${sessionItem.id}`);
    }
  } catch (error) {
    console.log(error);
  }
});

app.get(
  '/sport/:sportId/editSession/:sessionId',
  connectEnsureLogin.ensureLoggedIn(),
  async (req, resp) => {
    const title = 'Edit Session';
    try {
      const sportId = Number(req.params.sportId);
      const sessionItem = await Session.findByPk(req.params.sessionId);
      const user = await User.findByPk(Number(req.user.id));
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
        user,
      });
    } catch (error) {
      console.log(error);
    }
  },
);

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
    res.render('index');
  } catch (error) {
    console.log(error);
  }
});

app.delete('/sport/deleteSport/:sportId', async (req, res) => {
  try {
    await Sport.remove_sport(req.params.sportId);
    res.render('listSports');
  } catch (error) {
    console.log(error);
  }
});

app.get('/signout', (req, resp, next) => {
  req.logout((error) => {
    if (error) {
      return next(error);
    }
    resp.redirect('/');
  });
});

app.post('/sport/:sportId/createSession/:sessionId/join/:userid', async (req, res) => {
  const user = await User.findByPk(Number(req.params.userid));
  try {
    const ses = await Session.findByPk(req.params.sessionId);
    await Session.update(
      {
        num_players: ses.num_players - 1,
      },
      {
        where: {
          id: req.params.sessionId,
        },
      },
    );
    await PlayersName.create({
      name: user.first_name,
      sessionId: req.params.sessionId,
    });
    res.redirect(302, `/sport/${req.params.sportId}/editSession/${req.params.sessionId}`);
  } catch (error) {
    console.log(error);
  }
});

app.post('/sport/:sportId/createSession/:sessionId/leave/:userid', async (req, res) => {
  const user = await User.findByPk(Number(req.params.userid));

  try {
    const ses = await Session.findByPk(req.params.sessionId);
    await Session.update(
      {
        num_players: ses.num_players + 1,
      },
      {
        where: {
          id: req.params.sessionId,
        },
      },
    );
    await PlayersName.destroy({
      where: {
        name: user.first_name,
        sessionId: req.params.sessionId,
      },
    });
    res.redirect(302, `/sport/${req.params.sportId}/editSession/${req.params.sessionId}`);
  } catch (error) {
    console.log(error);
  }
});

module.exports = app;
