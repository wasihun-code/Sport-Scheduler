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

const sportsQuotes = [
  {
    quote: "Winning isn't everything, it's the only thing.",
    author: 'Vince Lombardi',
  },
  {
    quote: "It's not the will to win that matters—everyone has that. It's the will to prepare to win that matters.",
    author: "Paul 'Bear' Bryant",
  },
  {
    quote: "The difference between the impossible and the possible lies in a man's determination.",
    author: 'Tommy Lasorda',
  },
  {
    quote: "The only way to prove that you're a good sport is to lose.",
    author: 'Ernie Banks',
  },
  {
    quote: 'The more difficult the victory, the greater the happiness in winning.',
    author: 'Pele',
  },
  {
    quote: 'Champions keep playing until they get it right.',
    author: 'Billie Jean King',
  },
  {
    quote: "You miss 100% of the shots you don't take.",
    author: 'Wayne Gretzky',
  },
  {
    quote: "If you don't have confidence, you'll always find a way not to win.",
    author: 'Carl Lewis',
  },
  {
    quote: "It ain't over till it's over.",
    author: 'Yogi Berra',
  },
  {
    quote: "You can't put a limit on anything. The more you dream, the farther you get.",
    author: 'Michael Phelps',
  },
  {
    quote: "Gold medals aren't really made of gold. They're made of sweat, determination, and a hard-to-find alloy called guts.",
    author: 'Dan Gable',
  },
  {
    quote: "When you've got something to prove, there's nothing greater than a challenge.",
    author: 'Terry Bradshaw',
  },
  {
    quote: 'The more I practice, the luckier I get.',
    author: 'Gary Player',
  },
  {
    quote: "It's not whether you get knocked down; it's whether you get up.",
    author: 'Vince Lombardi',
  },
  {
    quote: 'Persistence can change failure into extraordinary achievement.',
    author: 'Marv Levy',
  },
  {
    quote: "You can't climb the ladder of success with your hands in your pockets.",
    author: 'Arnold Schwarzenegger',
  },
  {
    quote: 'If you want to go fast, go alone. If you want to go far, go together.',
    author: 'African proverb',
  },
  {
    quote: "I've failed over and over and over again in my life and that is why I succeed.",
    author: 'Michael Jordan',
  },
  {
    quote: 'Never say never because limits, like fears, are often just an illusion.',
    author: 'Michael Jordan',
  },
  {
    quote: 'The pain you feel today will be the strength you feel tomorrow.',
    author: 'Arnold Schwarzenegger',
  },
  {
    quote: 'The greatest glory in living lies not in never falling, but in rising every time we fall.',
    author: 'Nelson Mandela',
  },
  {
    quote: 'Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing or learning to do.',
    author: 'Pele',
  },
  {
    quote: 'The man who has no imagination has no wings.',
    author: 'Muhammad Ali',
  },
];

// Passport Js Configuration
app.use(flash());

app.use(
  session({
    secret: 'my-super-secret-key-187657654765423456788',
    resave: true,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
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

  if (req.body.is_admin === 'Yes' && req.body.master_password < 4) {
    req.flash('error', 'Minimum Master password length is 4');
    return resp.redirect('/signup');
  }
  let is_admin = false;
  if (req.body.is_admin === 'Yes') {
    if (req.body.master_password === 1234) {
      is_admin = true;
    }
  }
  const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
  try {
    const user = await User.add_user(
      req.body.first_name,
      req.body.last_name,
      req.body.email,
      hashedPassword,
      is_admin,
    );
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
    resp.redirect('/createSport');
  },
);

app.get('/', (req, resp) => {
  const title = 'Sports Scheduler';
  resp.render('login', {
    title,
  });
});

app.get(
  '/createSport',
  connectEnsureLogin.ensureLoggedIn(),
  (req, resp) => {
    resp.render('createSport', {
      title: 'Create Sport',
      quotes: sportsQuotes,
    });
  },
);

app.post('/createSport', async (req, res) => {
  try {
    const sport = await Sport.create_sport(req.body.title, req.user.id);
    res.redirect(302, `/sport/${sport.id}`);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get(
  '/sport/:id',
  connectEnsureLogin.ensureLoggedIn(),
  async (req, resp) => {
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

    const sessionId = Number(req.body.sessionId);
    const dueDate = new Date(req.body.dueDate); // Parse the HTML datetime-local string
    const sportId = Number(req.params.sportId); // Extract sportId from path

    if (req.body.sessionId) {
      await Session.update_existing_session({
        dueDate,
        venue: req.body.venue,
        num_players: req.body.num_players,
        sportId,
        userId: req.user.id,
        id: sessionId,
      });
      await PlayersName.update_players(req.body.players, req.user.first_name, sessionId);
      resp.redirect(`/sport/${sportId}/editSession/${sessionId}`);
    } else {
      sessionItem = await Session.add_session({
        dueDate: req.body.dueDate,
        venue: req.body.venue,
        num_players: req.body.num_players,
        sportId,
        userId: req.user.id,
      });
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

app.get('/signout', (req, resp, next) => {
  req.logout((error) => {
    if (error) {
      return next(error);
    }
    resp.redirect('/');
  });
});

module.exports = app;
