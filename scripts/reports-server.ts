const express = require("express");
const { readdir } = require("fs");
const { join } = require("path");

const app = express();
app.use(express.static("./reports"));
app.use(express.static("./reporter"));

app.get(
  "/reports",
  function (
    req: any,
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        send: { (arg0: string): void; new (): any };
      };
      json: (arg0: any) => void;
    }
  ) {
    console.log(process.cwd());
    const directoryPath = join(process.cwd(), "reports");

    readdir(directoryPath, function (err: any, files: any) {
      if (err) {
        console.error(err);
        res.status(500).send("Internal server error");
        return;
      }

      res.json(files);
    });
  }
);

app.listen(3000, function () {
  console.log("Server listening on port 3000");
});
