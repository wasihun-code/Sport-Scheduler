/* eslint-disable max-len */
/* eslint-disable object-curly-newline */
/* eslint-disable no-unused-vars */
/* eslint-disable consistent-return */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable camelcase */
/* eslint-disable no-console */
const express = require('express');
const path = require('path');
const csrf = require('tiny-csrf');
// eslint-disable-next-line import/no-extraneous-dependencies
const bodyParser = require('body-parser');
// eslint-disable-next-line no-unused-vars
const cookieParser = require('cookie-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('shh! some secret string'));
app.use(csrf('this_should_be_32_character_long', ['POST', 'PUT', 'DELETE']));

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
const {
  User, Session, Sport, PlayersName,
} = require('./models');

const saltRounds = 10;
const { sportsQuotes, signupErrorHandling } = require('./utility');
// Passport Js Configuration
app.use(flash());
function requireAdministrator(req, res, next) {
  if (req.user && req.user.is_admin) {
    return next();
  // eslint-disable-next-line no-else-return
  } else {
    req.flash('error', 'Unauthorized User. You need to be admin for that.');
    res.redirect('/listSports');
  }
}
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

app.get('/signup', (req, response) => {
  response.render('signup', {
    title: 'Signup',
    csrfToken: req.csrfToken(),
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
  resp.render('login', { title: 'Login', csrfToken: req.csrfToken() });
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
    csrfToken: req.csrfToken(),
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
  requireAdministrator,
  connectEnsureLogin.ensureLoggedIn(),
  (req, resp) => {
    resp.render('createSport', {
      title: 'Create Sport',
      quotes: sportsQuotes,
      sport: null,
      csrfToken: req.csrfToken(),
    });
  },
);

app.get(
  '/createSport/:sportId',
  requireAdministrator,
  connectEnsureLogin.ensureLoggedIn(),
  async (req, resp) => {
    const sport = await Sport.findByPk(req.params.sportId);
    resp.render('createSport', {
      title: 'Edit Sport',
      quotes: sportsQuotes,
      sport,
      csrfToken: req.csrfToken(),
    });
  },
);

app.post('/createSport', requireAdministrator, async (req, res) => {
  const { sportId, title } = req.body;
  const { id } = req.user;
  try {
    if (sportId) {
      await Sport.update_sport(title, id, sportId);
      res.redirect(302, `/sport/${Number(sportId)}`);
    } else {
      const sport = await Sport.create_sport(title, id);
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
    const current_user_sessions = await Session.get_current_sessions_of_user(sportId, id);
    const joined_sessions = await Session.joined_session(sportId, player_sessions_id);
    const canceled_sessions = await Session.canceled_sessions(sportId);
    // eslint-disable-next-line no-restricted-syntax
    resp.render('sport', { sport, csrfToken: req.csrfToken(), past_sessions, current_sessions_others, current_user_sessions, joined_sessions, canceled_sessions, userisadmin });
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
      csrfToken: req.csrfToken(),
    });
  },
);

app.get(
  '/sport/:sportId/createSession/:sessionId',
  connectEnsureLogin.ensureLoggedIn(),
  async (req, resp) => {
    const { sportId, sessionId } = req.params;
    const title = 'Create Your Session';
    const sessionItem = await Session.findByPk(sessionId);
    const playersList = await PlayersName.findAll({ where: { sessionId } });
    const players = playersList.map((player) => player.name).join(',');
    resp.render('createSession', { title, csrfToken: req.csrfToken(), sessionItem, players, sportId });
  },
);

app.post('/sport/:sportId/createSession', async (req, resp) => {
  try {
    let sessionItem;
    const { sportId } = req.params;
    const { id } = req.user;

    // eslint-disable-next-line prefer-const
    let { venue, num_players, dueDate, players, sessionId } = req.body;
    dueDate = new Date(req.body.dueDate); // Parse the HTML datetime-local string

    if (sessionId) {
      await
      Session.update_existing_session(dueDate, venue, num_players, sportId, id, sessionId);
      await PlayersName.update_players(players, sessionId);
      resp.redirect(`/sport/${sportId}/editSession/${sessionId}`);
    } else {
      sessionItem = await Session.add_session(dueDate, venue, num_players, sportId, id);
      await PlayersName.add_players(players, req.user.first_name, sessionItem.id);
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
    const { sportId, sessionId } = req.params;
    const { id } = req.user;
    try {
      const sessionItem = await Session.findByPk(sessionId);
      const user = await User.findByPk(Number(id));
      const playersList = await PlayersName.findAll({
        where: {
          sessionId,
        },
      });
      resp.render('editSession', { title, csrfToken: req.csrfToken(), sessionItem, playersList, sportId, user });
    } catch (error) {
      console.log(error);
    }
  },
);

app.get(
  '/sport/:sportId/cancelSession/:sessionId',
  connectEnsureLogin.ensureLoggedIn(),
  async (req, resp) => {
    const title = 'Cancel Session';
    const { sportId, sessionId } = req.params;

    try {
      const sessionItem = await Session.findByPk(Number(sessionId));
      resp.render('cancelSession', { title, csrfToken: req.csrfToken(), sessionItem, sportId });
    } catch (error) {
      console.log(error);
    }
  },
);

app.post(
  '/sport/:sportId/cancelSession/:sessionId',
  connectEnsureLogin.ensureLoggedIn(),
  async (req, resp) => {
    try {
      const { sportId, sessionId } = req.params;
      const sessionItem = await Session.findByPk(Number(sessionId));
      const canceled = !sessionItem.canceled;
      const reason = !canceled ? ' '.trim() : req.body.reason;
      await Session.toggle_cancel(sessionId, canceled, reason);
      resp.redirect(302, `/sport/${sportId}`);
    } catch (error) {
      console.log(error);
    }
  },
);
// eslint-disable-next-line no-unused-vars
app.post('/sport/:sportId/editSession/:sessionId/deletePlayer/player/:playerId', async (req, res) => {
  const { playerId, sportId, sessionId } = req.params;
  try {
    await PlayersName.remove_player(playerId);
    res.redirect(302, `/sport/${sportId}/editSession/${sessionId}`);
  } catch (error) {
    console.log(error);
  }
});

app.post('/sport/:sportId/editSession/deleteSession/:sessionId', async (req, res) => {
  const { sportId, sessionId } = req.params;
  try {
    await Session.remove_session(sessionId);
    res.redirect(302, `/sport/${Number(sportId)}`);
  } catch (error) {
    console.log(error);
  }
});

app.post('/sport/deleteSport/:sportId', requireAdministrator, async (req, res) => {
  const { sportId } = req.params;
  console.log('Inside post route for deleting session');
  try {
    console.log('Before removing sport');
    await Sport.remove_sport(sportId);
    console.log('After removing sport');
    res.redirect(302, '/listSports');
    console.log('After redirecting');
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

app.post('/sport/:sportId/createSession/:sessionId/join/:userId', async (req, res) => {
  const { sportId, sessionId, userId } = req.params;
  const user = await User.findByPk(Number(userId));
  try {
    const ses = await Session.findByPk(sessionId);
    await Session.update(
      {
        num_players: ses.num_players - 1,
      },
      {
        where: {
          id: sessionId,
        },
      },
    );
    await PlayersName.create({
      name: user.first_name,
      sessionId,
    });
    res.redirect(302, `/sport/${sportId}/editSession/${sessionId}`);
  } catch (error) {
    console.log(error);
  }
});

app.post('/sport/:sportId/createSession/:sessionId/leave/:userId', async (req, res) => {
  const { sportId, sessionId, userId } = req.params;
  const user = await User.findByPk(Number(userId));

  try {
    const ses = await Session.findByPk(sessionId);
    await Session.update(
      {
        num_players: ses.num_players + 1,
      },
      {
        where: {
          id: sessionId,
        },
      },
    );
    await PlayersName.destroy({
      where: {
        name: user.first_name,
        sessionId,
      },
    });
    res.redirect(302, `/sport/${sportId}/editSession/${sessionId}`);
  } catch (error) {
    console.log(error);
  }
});
app.get('/404', (req, res) => {
  res.status(404).render('error', {
    title: '404 - Not Found',
    errorCode: 404,
    errorMessage: 'The page you are looking for does not exist.',
  });
});

app.get('/500', (req, res) => {
  res.status(500).render('error', {
    title: '500 - Internal Server Error',
    errorCode: 500,
    errorMessage: 'An internal server error occurred.',
  });
});
// Error handling middleware
app.use((req, res, next) => {
  res.status(404).redirect('/404');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).redirect('/500');
});
module.exports = app;
