/* globals log */

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

export async function getClasses() {
  return classes;
}

function addClassDb(name, isTeacher) {
  firebaseDb
    .collection("classes")
    .doc(name)
    .collection("inbox")
    .onSnapshot(
      async (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => items.push(doc));
        for (const doc of items) {
          const data = doc.data();
          try {
            await executeCommand(name, isTeacher, data);
            // FIXME: I'm sure this is a terrible way to do the delete:
            await firebaseDb
              .collection("commands")
              .doc(name)
              .collection("inbox")
              .doc(doc.id)
              .delete();
          } catch (e) {
            log.error("Error trying to execute command:", data, e);
            await firebaseDb
              .collection("commands")
              .doc(name)
              .collection("inbox")
              .doc(doc.id)
              .delete();
          }
        }
      },
      (error) => {
        log.error("Error receiving Firebase snapshots:", error);
      }
    );
}

async function executeCommand(name, isTeacher, command) {}

async function sendCommand(name, command) {
  await firebaseDb
    .collection("commands")
    .doc(name)
    .collection("inbox")
    .doc("C" + Date.now())
    .set({ command });
}
