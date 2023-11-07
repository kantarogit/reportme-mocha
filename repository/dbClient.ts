//define a class to handle database operations
//database is a mongoDb atlas cluster
//database name is "reportmeMocha"

import {
  Collection,
  Db,
  MongoClient,
  ServerApiVersion,
  ObjectId,
} from "mongodb";
import { TestResult } from "../models/test-model";
const uri =
  "mongodb+srv://platformAdmin:B5hJkJQAzIU3RAfJ@cluster0.5trh4j9.mongodb.net/?retryWrites=true&w=majority";

export class DbClient {
  private client: MongoClient;
  private db: Db | undefined;
  private collection: Collection | undefined;
  constructor() {
    this.client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
  }
  async connect() {
    try {
      console.log("connecting to db");
      await this.client.connect();
      this.db = this.client.db("reportmeMocha");
      this.collection = this.db!.collection("testResults");
      console.log("connected to db");
    } catch (error) {
      console.error(error);
      console.error("Error connecting to the database...Can't continue");
      process.exit(1);
    }
  }
  async insertOne(doc: any) {
    await this.collection!.insertOne(doc);
  }
  async close() {
    try {
      await this.client.close();
    } catch (error) {
      console.error(error);
    }
  }

  async updateTestResult(testCaseResults: TestResult[], timestamp: string) {
    const session = this.client.startSession();

    session.startTransaction();
    console.info("Updating documents in the database");

    try {
      for (const testCaseResult of testCaseResults) {
        const testCaseId = `${testCaseResult.file}-${testCaseResult.testTitle}`;

        // Update the test case document
        await this.collection!.updateOne(
          {
            fileName: testCaseResult.file,
            testName: testCaseResult.testTitle,
          },
          {
            $push: {
              executions: {
                $each: [
                  { timestamp: timestamp, result: testCaseResult.status },
                ],
                $slice: -10, // Keep the last 10 executions
              },
            },
            $setOnInsert: {
              testName: testCaseResult.testTitle,
              fileName: testCaseResult.file,
            },
          },
          { upsert: true, session } // Pass the session to the updateOne method
        );
      }

      await session.commitTransaction();
    } catch (error) {
      console.error(error);
      await session.abortTransaction();
    } finally {
      console.info("All documents updated");
      session.endSession();
    }
  }

  //async function to read the test result by the filename and test title from the database and calculate the rank
  async calculateRank(fileName: string, testName: string): Promise<number> {
    try {
      const result = await this.collection!.findOne({
        fileName: fileName,
        testName: testName,
      });

      if (!result) {
        return 0;
      }

      const testResults: string[] = result.executions.map(
        (execution: any) => execution.result
      );

      return doRanking(testResults);
    } catch (error) {
      console.error(error);
      return 0;
    }
  }
}

function doRanking(testResults: string[]): number {
  if (testResults.length > 10) {
    testResults = testResults.slice(-10);
  }

  const weights: number[] = Array.from(
    { length: testResults.length },
    (_, i) => 0.9 ** i
  );
  const numericResults: number[] = testResults.map((result) =>
    result === "passed" ? 1 : 0
  );
  const weightedScores: number[] = numericResults.map(
    (result, index) => result * weights[index] * 100
  );
  const rank: number =
    weightedScores.reduce((sum, score) => sum + score, 0) /
    weights.reduce((sum, weight) => sum + weight, 0);
  return rank;
}
