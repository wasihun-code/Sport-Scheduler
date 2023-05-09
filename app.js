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

const saltRounds = 10;
const {
  User, Session, Sport, PlayersName,
} = require('./models');

// Passport Js Configuration
app.use(flash());

app.use(
  session({
    secret: 'my-super-secret-key-187657654765423456788',
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
            message: 'Try again with a correct password',
          });
        })
        .catch(() => done(null, false, {
          message: 'No account found with this email. Please create new account',
        }));
    },
  ),
);

passport.serializeUser((user, done) => {
  console.log('Serializing user in session', user.id);
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
    let ses;

    const id = Number(req.body.sessionId);
    const dueDate = new Date(req.body.dueDate); // Parse the HTML datetime-local string

    const sportId = Number(req.body.sportId); // Extract sportId from path
    console.log('sportId inside post:', sportId);

    if (req.body.sessionId) {
      await Session.update_existing_session({
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
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/signup', (request, response) => {
  response.render('signup', {
    title: 'Signup',
  });
});

app.get('/signout', (req, resp, next) => {
  req.logout((error) => {
    if (error) {
      return next(error);
    }
    resp.redirect('/');
  });
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
    console.log(req.user);
    resp.redirect('/createSport');
  },
);

app.post('/users', async (req, resp) => {
  if (req.body.first_name.length === 0) {
    req.flash('error', 'First name is required');
    return resp.redirect('/signup');
  }

  if (req.body.last_name.length === 0) {
    req.flash('error', 'Last name is required');
    return resp.redirect('/signup');
  }

  if (req.body.email.length === 0) {
    req.flash('error', 'Email is required');
    return resp.redirect('/signup');
  }

  if (req.body.password.length < 6) {
    req.flash('error', 'Minimum password length is 6');
    return resp.redirect('/signup');
  }

  if (req.body.is_admin === 'Yes' && req.body.master_password < 10) {
    req.flash('error', 'Minimum Master password length is 6');
    return resp.redirect('/signup');
  }
  let is_admin = false;
  if (req.body.is_admin === 'Yes') {
    if (req.body.master_password === 1234) {
      is_admin = true;
    }
  }
  const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
  console.log(hashedPassword);
  try {
    const user = await User.create({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      password: hashedPassword,
      is_admin,
    });
    req.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      resp.redirect('/createSport');
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      req.flash('error', 'Email already exists');
      return resp.redirect('/signup');
    }
  }
});

module.exports = app;
