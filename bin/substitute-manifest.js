/* eslint-disable no-console */

const ejs = require("ejs");
const path = require("path");
const fs = require("fs");
const package_json = require("../package.json");
const child_process = require("child_process");
const { getVersionNumber } = require("./calculate-version.js");
const { extensionDir, writeFile } = require("./script-utils.js");

const OUTPUT = path.join(extensionDir, "manifest.json");
const TEMPLATE = OUTPUT + ".ejs";
const BUILD_OUTPUT = path.join(extensionDir, "buildSettings.js");
const BUILD_TEMPLATE = BUILD_OUTPUT + ".ejs";

function ignoreFilename(filename) {
  return (
    filename.startsWith(".") ||
    filename.endsWith(".txt") ||
    filename.endsWith(".js") ||
    filename.endsWith(".toml")
  );
}

const gitCommit = child_process
  .execSync("git describe --always --dirty", {
    encoding: "UTF-8",
  })
  .trim();

const context = {
  env: process.env,
  version: getVersionNumber(),
  package_json,
  gitCommit,
  buildTime: new Date().toISOString(),
};

// ejs options:
const options = {
  escape: JSON.stringify,
};

ejs.renderFile(TEMPLATE, context, options, function(err, str) {
  if (err) {
    console.error("Error rendering", TEMPLATE, "template:", err);
    process.exit(1);
    return;
  }
  writeFile(OUTPUT, str);
});

ejs.renderFile(BUILD_TEMPLATE, context, options, function(err, str) {
  if (err) {
    console.error("Error rendering", BUILD_TEMPLATE, "template:", err);
    process.exit(1);
    return;
  }
  writeFile(BUILD_OUTPUT, str);
});
