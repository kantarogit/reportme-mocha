#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const scriptsPath = path.dirname(require.resolve("reportme-mocha"));

const expressServer = spawn("node", [
  path.join(scriptsPath, "/reports-server.js"),
]);

expressServer.stdout.on("data", (data) => {
  console.log(`expressServer: ${data}`);
});

expressServer.stderr.on("data", (data) => {
  console.error(`expressServer: ${data}`);
});

expressServer.on("error", (error) => {
  console.error(`expressServer err: ${error}`);
});

expressServer.on("close", (code) => {
  console.log(`expressServer closed with code ${code}`);
});
