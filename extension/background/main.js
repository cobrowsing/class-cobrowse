/* globals log */

import { initClasses, getClasses } from "./classes.js";

browser.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case "getPopupData":
      return getPopupData();
    case "inviteAccepted":
      return inviteAccepted(message.className);
    default:
      log.error("Unexpected message:", message.type);
      break;
  }
});

async function getPopupData() {
  return {
    classes: getClasses(),
  };
}

async function inviteAccepted(className) {}

initClasses();
