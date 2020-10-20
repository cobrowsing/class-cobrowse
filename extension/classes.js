/* globals log */

import { userId, pubnub } from "./db.js";

let classes;

export function getTitleFromId(classId) {
  return classId.replace(/\.[^\.]*$/, "").replace(/_/g, " ");
}

export async function addClass(classId, isTeacher) {
  if (!classId || typeof classId !== "string") {
    throw new Error(`Bad classId: ${classId}`);
  }
  classes.push({ title: getTitleFromId(classId), classId, isTeacher });
  await browser.storage.local.set({ classes });
  addClassDb(classId, isTeacher);
}

export async function initClasses() {
  const classesResult = await browser.storage.local.get(["classes"]);
  classes = classesResult.classes || [];
  for (const cls of classes) {
    addClassDb(cls.classId, cls.isTeacher);
  }
}

export function getClasses() {
  return classes;
}

pubnub.addListener({
  message(event) {
    const command = event.message;
    const classId = event.channel;
    command.userId = event.publisher;
    console.log("executeCommand?", executeCommand, event);
    executeCommand(classId, command).catch((e) => {
      log.error(`Error executing command ${command.type}:`, e + "", e.stack);
    });
  },
  presence(event) {
    const classId = event.channel;
    const action = event.action;
    log.info("Got presence event:", event);
    if (action === "join") {
      executeCommand(classId, {
        type: "join",
        userId: event.publisher,
      });
    } else if (action === "leave" || action === "timeout") {
      executeCommand(classId, {
        type: "leave",
        userId: event.publisher,
      });
    }
  },
});

function addClassDb(classId, isTeacher) {
  pubnub.subscribe({
    channels: [classId],
    withPresence: true,
  });
}

async function executeCommand(classId, command) {
  if (command.userId === userId) {
    return;
  }
  log.info(
    "Received command from class:",
    getTitleFromId(classId),
    "->",
    command
  );
  if (_onCommand) {
    await _onCommand(classId, command);
  }
}

let _onCommand;
export function registerOnCommand(callback) {
  if (_onCommand) {
    throw new Error("Double register");
  }
  _onCommand = callback;
}

export async function sendCommand(classId, command) {
  if (!classId || typeof classId !== "string") {
    throw new Error(`classId should be string (not ${typeof classId})`);
  }
  if (!command.type) {
    throw new Error("All commands must have a type");
  }
  command.created = Date.now();
  await pubnub.publish({
    channel: classId,
    message: command,
  });
  log.info("Sent command:", command);
}
