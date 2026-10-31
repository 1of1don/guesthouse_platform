// Builds the Express app: shared middleware, the routes, and one place that turns errors into JSON.
// index.js starts it. The tests import it directly.
const express = require('express');
const cors = require('cors');
const routes = require('./routes/api/routes');

const app = express();

// Only these web addresses may call the API from a browser. Empty list = allow all (development only).
const origins = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true }));
app.use(express.json());

app.use('/api', routes);

// Unknown address.
app.use((req, res) => res.status(404).json({ code: 404, success: false, message: 'Route not found' }));

// Every error ends up here. Errors made with fail() carry their own status code.
// Anything else is unexpected, so we log it and send a generic 500.
app.use((err, req, res, next) => {
  const status = err.status || (err.type === 'entity.parse.failed' ? 400 : 500);
  if (status === 500) console.error(err);
  res.status(status).json({
    code: status,
    success: false,
    message: status === 500 ? 'Server error' : err.message,
  });
});

module.exports = app;
