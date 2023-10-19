# reportme-mocha

Simple, command-line tool to generate interactive test report for Mocha tests using d3.js.

## Installation

```
npm i reportme-mocha
```

## Usage

There is only one rule to follow: <b>Test files using Mocha.js should be organized inside `test` directory in the root of the project.</b> They can be organized in sub-directories.
Add a script in your `package.json` and use the `reportme` command for example:

```
// package.json
"scripts": {
    "mochaReport": "reportme"
  }
```

When this script executed with
```
npm run mochaReport
```
 it will do 3 things:
- run all the tests inside `test` directory and generate a `.csv` custom report inside `reports` directory (will be created if doesn't exist).
- will copy (if not copied already) an `.html` file named `index.html` inside your project `root/reporter` directory (will be created if doesn't exist).
- will start an express server on localhost port 3000 serving the `.csv` files and `index.html`.

When you open `localhost:3000` you will be presented with scatter plot matrix view of the test results.
Interactive test report mode on :)

## Dependencies

At this moment only Chai should be installed prior running the `reportme` command. All the other dependancies are included (mocha, express, typescript).

## Documentation

TBD
