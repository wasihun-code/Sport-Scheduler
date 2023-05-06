const app = require('./app');

const port = 5000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Started express server at port ${port}`);
});
