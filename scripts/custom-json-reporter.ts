module.exports = MyReporter;
import { Test, Runner } from "mocha";
import * as fs from "fs";
import { ReportSummary } from "../models/report-model";
import { Priority } from "../utility/enums";

function MyReporter(runner: Runner) {
  var passes = 0;
  var failures = 0;

  let reportObj: ReportSummary = {} as ReportSummary;
  reportObj.tests = [];
  if (!fs.existsSync("./reports")) {
    fs.mkdirSync("./reports");
  }

  const timestamp = new Date().getTime();

  fs.writeFile(
    `./reports/report-${timestamp}.csv`,
    "",
    function (err: Error | null) {
      if (err) throw err;
      console.log("File created successfully!");
      console.log("Now running tests...");
    }
  );
  let csv = fs.createWriteStream(`./reports/report-${timestamp}.csv`);

  runner.on("pass", function (test: Test) {
    passes++;
    //print the test case name and green checkmark symbol in a format: Test Case Name, ✓
    console.log("\x1b[32m%s\x1b[0m", `${test.title}, ✓`);

    let testPath = test.file?.slice(test.file.indexOf("test") + 5);
    let fileName = testPath?.slice(
      testPath.lastIndexOf("\\") + 1,
      testPath.length - 3
    );

    // TODO: add test age and last 5 runs success rate percentage
    // TODO: Test Case Pass Count (how many times the test has passed)
    // TODO: Case Fail Count (how many times the test has failed)
    reportObj.tests.push({
      testTitle: test.title,
      status: test.state ?? "invalid",
      duration: test.duration ?? 0,
      file: fileName ?? "unknown",
      priority: test.metadata.priority ?? Priority.P5,
      suite: test.parent?.title ?? "unknown",
      linesOfCode: test.body.split("\n").length - 2,
      successPercentage: 100,
    });
  });

  runner.on("fail", function (test: Test, err: Error) {
    failures++;
    //print the error and the assertion stack trace in a format: Test Case Name, Error Message, Assertion Stack Trace, X (red cross), all with red color
    console.log(
      "\x1b[31m%s\x1b[0m",
      `${test.title}, ${err.message}, ${err.stack}, X`
    );

    let testPath = test.file?.slice(test.file.indexOf("test") + 5);
    let fileName = testPath?.slice(
      testPath.lastIndexOf("\\") + 1,
      testPath.length - 3
    );

    const lineNumber = parseInt(
      err.stack?.split("\n")[1].split(":")[1] || "0",
      10
    );

    const fileContents = fs.readFileSync(test.file!, "utf8");
    const lines = fileContents.split("\n");

    let linesToIt = 0;
    //ignoring the failing line and the it() line
    for (let i = lineNumber - 2; i > 0; i--) {
      if (lines[i].trimStart().startsWith("it(" || "xit(")) {
        break;
      }
      linesToIt++;
    }

    // test is always pointing to the .js file.
    // 4 lines we dont need are the compile noise added by the tsc compiler
    const percentage = (linesToIt / (test.body.split("\n").length - 2)) * 100;

    reportObj.tests.push({
      testTitle: test.title,
      status: test.state ?? "invalid",
      duration: test.duration ?? 0,
      file: fileName ?? "unknown",
      priority: test.metadata.priority ?? Priority.P5,
      suite: test.parent?.title ?? "unknown",
      linesOfCode: test.body.split("\n").length - 2,
      successPercentage: percentage,
    });
  });

  runner.on("test", function (test: Mocha.Test) {
    if (!test.metadata) {
      test.metadata = { priority: Priority.P5 };
    }
  });

  runner.on("end", function () {
    reportObj = {
      totalTests: passes + failures,
      totalPassed: passes,
      totalFailed: failures,
      totalSkipped: 0,
      tests: reportObj.tests,
    };
    const headers = Object.keys(reportObj.tests[0]);
    csv.write(headers.join(","));
    csv.write("\n");
    reportObj.tests.forEach((test) => {
      csv.write(Object.values(test).join(","));
      csv.write("\n");
    });
    csv.end();
  });

  runner.on("error", function (err) {
    console.error(err);
  });
}

declare module "mocha" {
  interface Test {
    metadata: {
      priority: Priority;
    };
  }
}
