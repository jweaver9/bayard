const { exec } = require("child_process");
const pkg = require("../../puck/package.json");

exec("git rev-parse --short HEAD", (_, stdout) => {
  console.log(`${pkg.version}-${process.argv[2] || "canary"}.${stdout}`);
  process.exit();
});
