const functions = require("firebase-functions");

module.exports.test = functions.https.onCall((data) => {
  return {
    response: data,
  };
});
