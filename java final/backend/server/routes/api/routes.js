// ROUTES: the list of web addresses (endpoints). Each one only does three things:
//   1) check who may call it (requireRole)   2) call a function   3) send the result as JSON.
// No business logic belongs here. Put it in server/functions/.
//
// Every success reply looks like { code, success: true, data }.
// Every error reply looks like   { code, success: false, message }.
//
// To add an endpoint: add one router.<method>(...) line below and a function in server/functions/.
const express = require('express');
const { requireRole } = require('../middleware');
const roles = require('../../config/roles');
const guesthouse = require('../../functions/guesthouse');
const review = require('../../functions/review');
const admin = require('../../functions/admin');
const stats = require('../../functions/stats');

const router = express.Router();

// Wraps a function so its result is sent as JSON and its errors go to the error handler.
// "status" is the success code (200 normally, 201 for "created").
const handle = (fn, status = 200) => (req, res, next) =>
  Promise.resolve(fn(req))
    .then((data) => res.status(status).json({ code: status, success: true, data }))
    .catch(next);

// Health check
router.get('/health', handle(async () => ({ status: 'ok' })));

// Who am I? The web app calls this after login to learn the role and decide which menus to show.
router.post('/auth/verify', requireRole(...roles.ANY_STAFF), handle((req) => req.staff));

// Guesthouses: reading is public, writing needs admin or super admin.
router.get('/guesthouses', handle(() => guesthouse.list()));
router.get('/guesthouses/suspended', requireRole(...roles.CAN_EDIT_GUESTHOUSES), handle(() => guesthouse.listSuspended()));
router.get('/guesthouses/:id', handle((req) => guesthouse.get(req.params.id)));
router.post('/guesthouses', requireRole(...roles.CAN_EDIT_GUESTHOUSES), handle((req) => guesthouse.create(req.body, req.staff.uid), 201));
router.put('/guesthouses/:id', requireRole(...roles.CAN_EDIT_GUESTHOUSES), handle((req) => guesthouse.update(req.params.id, req.body)));
// DELETE only suspends. Nothing is removed from the database.
router.delete('/guesthouses/:id', requireRole(...roles.CAN_EDIT_GUESTHOUSES), handle((req) => guesthouse.remove(req.params.id)));
router.post('/guesthouses/:id/restore', requireRole(...roles.CAN_EDIT_GUESTHOUSES), handle((req) => guesthouse.restore(req.params.id)));

// Dashboard numbers
router.get('/dashboard', requireRole(...roles.ANY_STAFF), handle(() => stats.dashboard()));

// Reviews: list, and suspend abusive ones (moderators included).
router.get('/reviews', requireRole(...roles.CAN_MODERATE_REVIEWS), handle((req) => review.list(req.query.guesthouseId)));
router.delete('/reviews/:id', requireRole(...roles.CAN_MODERATE_REVIEWS), handle((req) => review.remove(req.params.id)));
router.post('/reviews/:id/restore', requireRole(...roles.CAN_MODERATE_REVIEWS), handle((req) => review.restore(req.params.id)));

// Staff accounts: super admin only.
router.get('/admins', requireRole(...roles.CAN_MANAGE_STAFF), handle(() => admin.list()));
router.post('/admins', requireRole(...roles.CAN_MANAGE_STAFF), handle((req) => admin.create(req.body, req.staff.uid), 201));
router.delete('/admins/:uid', requireRole(...roles.CAN_MANAGE_STAFF), handle((req) => admin.remove(req.params.uid, req.staff.uid)));
router.post('/admins/:uid/restore', requireRole(...roles.CAN_MANAGE_STAFF), handle((req) => admin.restore(req.params.uid)));

module.exports = router;
