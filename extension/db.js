/* globals firebase, buildSettings */

firebase.initializeApp(buildSettings.firebaseConfig);
firebase.analytics();

export const firebaseDb = firebase.firestore();
