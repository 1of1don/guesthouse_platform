// Small helper for "stop here and reply with this status".
// Usage inside any function:  fail(404, 'Guesthouse not found');
// The error handler in app.js turns it into { code, success: false, message }.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const fail = (status, message) => {
  throw new HttpError(status, message);
};

module.exports = { HttpError, fail };
