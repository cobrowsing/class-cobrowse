/* globals log */
import makeId from "../makeId.js";

import {
  initClasses,
  getClasses,
  addClass,
  sendCommand,
  getTitleFromId,
  registerOnCommand,
} from "../classes.js";

browser.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case "getPopupData":
      return getPopupData();
    case "inviteAccepted":
      return inviteAccepted(message.classId);
    case "createClass":
      return createClass(message.name);
    case "startClass":
      return startClass(message.classId);
    default:
      log.error("Unexpected message:", message.type);
      break;
  }
  return undefined;
});

async function getPopupData() {
  const activeTab = await getActiveTab();
  let activeClass = activeClassesByTabId[activeTab.id] || null;
  if (activeClass) {
    activeClass = activeClass.toJSON();
  }
  return {
    classes: getClasses(),
    activeClass,
  };
}

async function inviteAccepted(classId) {
  return addClass(classId, false);
}

async function createClass(name) {
  name = name.replace(/\s+/g, "_");
  name = name.replace(/[^a-zA-Z0-9_]/g, "");
  const classId = name + "." + makeId();
  await addClass(classId, true);
  await reinitPopup();
}

async function getActiveTab() {
  return (
    await browser.tabs.query({
      active: true,
      currentWindow: true,
    })
  )[0];
}

async function startClass(classId) {
  const activeTab = await getActiveTab();
  if (activeClassesById[classId]) {
    log.warn("Removing old class and starting a new one");
    activeClassesById[classId].deactivate();
  }
  const activeClass = (activeClassesById[classId] = new ActiveClass(
    classId,
    activeTab.id,
    true
  ));
  await activeClass.activate();
  await reinitPopup();
}

async function startClassOnDemand(classId) {
  if (activeClassesById[classId]) {
    log.warn("Restarting a class we're already in:", classId);
    await browser.tabs.update(activeClassesById[classId].tabId, {
      active: true,
    });
    return;
  }
  // Called when a class is started remotely
  const tab = await browser.tabs.create({ active: true });
  const activeClass = (activeClassesById[classId] = new ActiveClass(
    classId,
    tab.id,
    false
  ));
  await activeClass.activate();
  await reinitPopup();
}

const activeClassesById = {};
const activeClassesByTabId = {};

class ActiveClass {
  constructor(classId, tabId, isTeacher) {
    this.classId = classId;
    this.tabId = tabId;
    this.onUpdated = this.onUpdated.bind(this);
    this.lastTabUpdate = {};
    this.isTeacher = isTeacher;
  }

  async onUpdated(tabId, changeInfo, tab) {
    if (
      (changeInfo.title && this.lastTabUpdate.title !== changeInfo.title) ||
      (changeInfo.url && this.lastTabUpdate.url !== changeInfo.url)
    ) {
      this.lastTabUpdate.url = changeInfo.url || this.lastTabUpdate.url;
      this.lastTabUpdate.title = changeInfo.title || this.lastTabUpdate.title;
      if (this.isTeacher) {
        await sendCommand(this.classId, {
          type: "tabUpdate",
          url: this.lastTabUpdate.url,
          title: this.lastTabUpdate.title,
        });
      }
    }
  }

  async activate() {
    await sendCommand(this.classId, {
      type: "classStarting",
    });
    browser.tabs.update(this.tabId, { pinned: this.isTeacher });
    browser.tabs.onUpdated.addListener(this.onUpdated, { tabId: this.tabId });
    browser.browserAction.setIcon({
      path: "images/icon-active.svg",
      tabId: this.tabId,
    });
    const myTab = await browser.tabs.get(this.tabId);
    this.lastTabUpdate = { url: myTab.url, title: myTab.title };
    sendCommand(this.classId, {
      type: "tabUpdate",
      url: this.lastTabUpdate.url,
      title: this.lastTabUpdate.title,
    });
    activeClassesByTabId[this.tabId] = this;
  }

  async deactivate() {
    browser.tabs.onUpdated.removeListener(this.onUpdated);
    await sendCommand(this.classId, {
      type: "classEnding",
    });
    browser.tabs.update(this.tabId, { pinned: false });
    browser.browserAction.setIcon({
      path: "images/icon.svg",
      tabId: this.tabId,
    });
    delete activeClassesByTabId[this.tabId];
  }

  async executeCommand(command) {
    const methodName = `action_${command.type}`;
    if (!this[methodName]) {
      log.warn("Unimplemented command type:", command.type, command);
      return undefined;
    }
    return this[methodName](command);
  }

  async action_tabUpdate(command) {
    const tab = await browser.tabs.get(this.tabId);
    if (tab.url !== command.url) {
      await browser.tabs.update(this.tabId, { url: command.url });
    }
  }

  toJSON() {
    return {
      classId: this.classId,
      classTitle: getTitleFromId(this.classId),
      isTeacher: this.isTeacher,
    };
  }
}

registerOnCommand(async (classId, command) => {
  if (command.type === "classStarting") {
    await startClassOnDemand(classId, command);
  }
  const c = activeClassesById[classId];
  if (!c) {
    throw new Error(`Incoming message to unexpected class: ${classId}`);
  }
  await c.executeCommand(command);
});

async function reinitPopup() {
  try {
    await browser.runtime.sendMessage({
      type: "reinitPopup",
    });
  } catch (e) {
    if (
      !e.message.includes(
        "Could not establish connection. Receiving end does not exist"
      )
    ) {
      throw e;
    }
  }
}

initClasses();
