// Compile the application TypeScript for Node's built-in test runner.
const ts = require("typescript");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const original = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request.startsWith("@/"))
    request = path.join(process.cwd(), "src", request.slice(2));
  return original.call(this, request, parent, ...rest);
};
require.extensions[".ts"] = function (module, filename) {
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    filename
  );
};
