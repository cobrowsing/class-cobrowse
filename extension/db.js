/* globals firebase, buildSettings */

firebase.initializeApp(buildSettings.firebaseConfig);
// FIXME: need to fix CSP for analytics:
// firebase.analytics();

export const firebaseDb = firebase.firestore();
