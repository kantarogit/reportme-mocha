module.exports = MyReporter;
import { Test, Runner } from "mocha";
import * as fs from "fs";
import { ReportSummary } from "../models/report-model";
import { Priority } from "../utility/enums";
import { DbClient } from "../repository/dbClient";

async function MyReporter(runner: Runner) {
  const dbClient = new DbClient();
  await dbClient.connect();

  var passes = 0;
  var failures = 0;

  let reportObj: ReportSummary = {} as ReportSummary;
  reportObj.tests = [];
  if (!fs.existsSync("./reports")) {
    fs.mkdirSync("./reports");
  }

  const timestamp = new Date().getTime();

  try {
    await fs.promises.writeFile(`./reports/report-${timestamp}.csv`, "");
    console.info("File created successfully!");
    console.info("Now running tests...");
  } catch (err) {
    console.error("Error creating file:", err);
  }
  let csv = fs.createWriteStream(`./reports/report-${timestamp}.csv`);

  runner.on("pass", async function (test: Test) {
    passes++;
    //print the test case name and green checkmark symbol in a format: Test Case Name, ✓
    console.log(
      "\x1b[32m%s\x1b[0m",
      `${test.fullTitle()} > duration: ${test.duration}ms > status: ✓`
    );

    let testPath = test.file?.slice(test.file.indexOf("test") + 5);
    let fileName = testPath?.slice(
      testPath.lastIndexOf("\\") + 1,
      testPath.length - 3
    );

    // TODO: add test age and last 5 runs success rate percentage
    // TODO: Test Case Pass Count (how many times the test has passed)
    // TODO: Case Fail Count (how many times the test has failed)
    // TODO: fail when no connection established
    // TODO: check number of tests passed and failed and total vs db records
    // TODO: run on empty db
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

  runner.on("fail", async function (test: Test, err: Error) {
    failures++;
    //print the error and the assertion stack trace in a format: Test Case Name, Error Message, Assertion Stack Trace, X (red cross), all with red color
    console.error(
      "\x1b[31m%s\x1b[0m",
      `${test.fullTitle()} > ${err.message}, ${err.stack} > status: X`
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

  runner.on("test", async function (test: Mocha.Test) {
    if (!test.metadata) {
      test.metadata = { priority: Priority.P5 };
    }
  });

  runner.on("end", async function () {
    reportObj = {
      totalTests: passes + failures,
      totalPassed: passes,
      totalFailed: failures,
      totalSkipped: 0,
      tests: reportObj.tests,
    };

    try {
      await dbClient.updateTestResult(reportObj.tests, timestamp.toString());
      console.info("All documents inserted");
      console.info("Reading documents from the database");
      console.info("Calculating rank for each test");
      for (const test of reportObj.tests) {
        const rank = await dbClient.calculateRank(test.file, test.testTitle);
        test.rank = rank;
      }
      console.info("Ranking completed");
    } catch (err) {
      console.error("Error inserting documents:", err);
    } finally {
      //close the database connection
      await dbClient.close();
      console.info("Database connection closed");
    }

    const headers = Object.keys(reportObj.tests[0]);
    csv.write(headers.join(","));
    csv.write("\n");
    reportObj.tests.forEach((test) => {
      csv.write(Object.values(test).join(","));
      csv.write("\n");
    });
    csv.end();

    //end node process with an exit code of 0 if all tests passed, otherwise end with an exit code of 1
    csv.on("finish", () => {
      console.info("Report generated successfully!");
      process.exit(failures);
    });
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
