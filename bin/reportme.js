#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const mochaPath = path.dirname(require.resolve("mocha"));
const scriptsPath = path.dirname(require.resolve("reportme-mocha"));
const mochaNodeProcess = spawn(
  "node",
  [
    mochaPath + "/bin/mocha.js",
    "-r",
    "ts-node/register",
    "./test/**/*.ts",
    "--reporter",
    path.join(scriptsPath, "custom-json-reporter.js"),
  ],
  { timeout: 0 }
);

mochaNodeProcess.stdout.on("data", (data) => {
  console.log(`mocha: ${data}`);
});

mochaNodeProcess.stderr.on("data", (data) => {
  console.error(`mocha: ${data}`);
});

mochaNodeProcess.on("error", (error) => {
  console.log(error);
  console.error(`mocha err: ${error}`);
});

mochaNodeProcess.on("close", (code) => {
  console.log(`mocha closed with code ${code}`);
});

//wait for mocha to finish before starting the server
mochaNodeProcess.on("exit", (code) => {
  console.log(`mocha exited with code ${code}`);
  if (code == 1) {
    return;
  }
  copyFile();
});

function copyFile() {
  //copy the report file to the root directory
  const copyFile = spawn("node", [path.join(scriptsPath, "/copy-file.js")]);

  copyFile.stdout.on("data", (data) => {
    console.log(`copyFile: ${data}`);
  });

  copyFile.stderr.on("data", (data) => {
    console.error(`copyFile: ${data}`);
  });

  copyFile.on("error", (error) => {
    console.log(error);
    console.error(`copyFile error: ${error}`);
  });

  copyFile.on("close", (code) => {
    console.log(`copyFile closed with code ${code}`);
    if (code == 1) {
      return;
    }
    startServer();
  });
}

function startServer() {
  const expressServer = spawn("node", [path.join(scriptsPath, "/reports-server.js")]);

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
}
