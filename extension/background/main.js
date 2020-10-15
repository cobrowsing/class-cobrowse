/* globals log */
import makeId from "../makeId.js";

import { initClasses, getClasses, addClass } from "../classes.js";

browser.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case "getPopupData":
      return getPopupData();
    case "inviteAccepted":
      return inviteAccepted(message.className);
    case "createClass":
      return createClass();
    default:
      log.error("Unexpected message:", message.type);
      break;
  }
  return undefined;
});

async function getPopupData() {
  return {
    classes: getClasses(),
  };
}

async function inviteAccepted(className) {
  return addClass(className, false);
}

async function createClass() {
  const className = makeId();
  await addClass(className, true);
  await reinitPopup();
}

async function reinitPopup() {
  await browser.runtime.sendMessage({
    type: "reinitPopup",
  });
}

initClasses();
