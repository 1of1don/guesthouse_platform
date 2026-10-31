// ENTRY POINT. Loads settings from .env, then starts the web server.
// Run with: npm start   (or npm run dev to restart on file changes)
require('dotenv').config();
const app = require('./server/app');

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
