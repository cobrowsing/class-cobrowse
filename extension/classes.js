import { firebaseDb } from "./db.js";

let classes;

export async function addClass(name, isTeacher) {
  classes.push({ name, isTeacher });
  await browser.storage.local.save({ classes });
  addClassDb(name, isTeacher);
}

export async function initClasses() {
  const classesResult = browser.storage.local.load(["classes"]);
  classes = classesResult.classes || [];
  for (const cls of classes) {
    addClassDb(cls.name, cls.isTeacher);
  }
}

function addClassDb(name, isTeacher) {
  firebaseDb
    .collection("classes")
    .doc(name)
    .collection("inbox")
    .onSnapshot(async (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => items.push(doc));
    });
}
