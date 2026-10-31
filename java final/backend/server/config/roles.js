// STAFF ROLES AND WHO MAY DO WHAT.
// A person is staff when a document exists at admins/{uid} in Firestore. Its "role" field is one of these.
// To change permissions, edit the lists below. routes.js reads them, nothing else needs to change.
const SUPERADMIN = 'superadmin'; // everything, including adding and removing staff
const ADMIN = 'admin'; //           manages guesthouses and reviews
const MODERATOR = 'moderator'; //   reviews only

module.exports = {
  ROLES: [SUPERADMIN, ADMIN, MODERATOR],
  ANY_STAFF: [SUPERADMIN, ADMIN, MODERATOR], // see the dashboard
  CAN_EDIT_GUESTHOUSES: [SUPERADMIN, ADMIN],
  CAN_MODERATE_REVIEWS: [SUPERADMIN, ADMIN, MODERATOR],
  CAN_MANAGE_STAFF: [SUPERADMIN],
};
