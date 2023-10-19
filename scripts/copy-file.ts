//script to copy index.html from reporter/ folder to parent folder
const fs = require("fs");
const path = require("path");
const { fileURLToPath } = require("url");
const source = path.join(__dirname, "../reporter/index.html");
const destination = path.join(process.cwd(), "./reporter/index.html");
//check if the file already exists in destination
if (fs.existsSync(destination)) {
  console.log("index.html already exists in root folder");
} else {
  //check if reporter folder exists
  if (!fs.existsSync(path.join(process.cwd(), "reporter"))) {
    console.log("reporter folder does not exist");
    fs.mkdirSync(path.join(process.cwd(), "reporter"));
  }
  fs.copyFile(source, destination, (err: any) => {
    if (err) throw err;
    console.log("index.html was copied reporter folder");
  });
}
