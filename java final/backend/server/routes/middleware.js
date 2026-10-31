// MIDDLEWARE: runs before a route handler. requireRole(...) blocks anyone who is not staff
// with one of the listed roles, and puts the staff record on req.staff for the handler to use.
const { verifyAccount } = require('../functions/auth');
const { fail } = require('../errors');

const requireRole = (...roles) => async (req, res, next) => {
  try {
    req.staff = await verifyAccount(req);
    if (!roles.includes(req.staff.role)) fail(403, 'Your role is not allowed to do this');
    next();
  } catch (err) {
    next(err); // handled by the error handler in app.js
  }
};

module.exports = { requireRole };
