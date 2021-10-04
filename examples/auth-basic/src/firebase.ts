import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebase = initializeApp(
  {
    apiKey: "AIzaSyD_pGb8yWAm-TL_nhiP-gbT3Y29cS_YmUk",
    authDomain: "react-query-firebase.firebaseapp.com",
    databaseURL: "https://react-query-firebase-default-rtdb.firebaseio.com",
    projectId: "react-query-firebase",
    storageBucket: "react-query-firebase.appspot.com",
    messagingSenderId: "355258056095",
    appId: "1:355258056095:web:2fa9a4802e2ef8484b11aa"
  },
  "auth-basic"
);

export const auth = getAuth(firebase);
