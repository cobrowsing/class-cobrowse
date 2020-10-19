/* globals log */

import { firebaseDb } from "./db.js";
import makeId from "./makeId.js";

let classes;
let myUserId;

function getTitleFromId(classId) {
  return classId.replace(/\.[^\.]*$/, "").replace(/_/g, " ");
}

export async function addClass(classId, isTeacher) {
  classes.push({ title: getTitleFromId(classId), classId, isTeacher });
  await browser.storage.local.set({ classes });
  addClassDb(classId, isTeacher);
}

export async function initClasses() {
  const userIdResult = browser.storage.local.get(["myUserId"]);
  if (!userIdResult.myUserId) {
    myUserId = "u-" + makeId();
    await browser.storage.local.set({ myUserId });
  } else {
    myUserId = userIdResult.myUserId;
  }
  const classesResult = browser.storage.local.get(["classes"]);
  classes = classesResult.classes || [];
  for (const cls of classes) {
    addClassDb(cls.name, cls.isTeacher);
  }
}

export function getClasses() {
  return classes;
}

export function getUserId() {
  return myUserId;
}

function addClassDb(classId, isTeacher) {
  firebaseDb
    .collection("classes")
    .doc(classId)
    .collection("inbox")
    .onSnapshot(
      async (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => items.push(doc));
        for (const doc of items) {
          const data = doc.data();
          try {
            await executeCommand(classId, isTeacher, data);
            // FIXME: I'm sure this is a terrible way to do the delete:
            await firebaseDb
              .collection("commands")
              .doc(classId)
              .collection("inbox")
              .doc(doc.id)
              .delete();
          } catch (e) {
            log.error("Error trying to execute command:", data, e);
            await firebaseDb
              .collection("commands")
              .doc(classId)
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
  sendCommand(classId, {
    type: "hello",
  });
}

async function executeCommand(classId, isTeacher, command) {
  log.info(
    "Received command from class:",
    getTitleFromId(classId),
    "->",
    command
  );
}

export async function sendCommand(classId, command) {
  if (!classId || typeof classId !== "string") {
    throw new Error(`classId should be string (not ${typeof classId})`);
  }
  if (!myUserId) {
    throw new Error("Attempt to send command before setting userId");
  }
  if (!command.type) {
    throw new Error("All commands must have a type");
  }
  command.userId = myUserId;
  command.created = Date.now();
  await firebaseDb
    .collection("commands")
    .doc(classId)
    .collection("inbox")
    .doc("C" + Date.now())
    .set({ command });
  log.info("Sent command:", command);
}
