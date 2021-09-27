const functions = require("firebase-functions");
const axios = require("axios");

module.exports.test = functions.https.onCall((data) => {
  return {
    response: data,
  };
});

module.exports.getJoke = functions.https.onCall(async (data) => {
  return axios("https://api.icndb.com/jokes/random").then(
    (res) => res.data.value.joke
  );
});
