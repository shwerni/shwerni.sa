// test preload (npm test). plain node + tsx run the app's typescript as commonjs, where node:test's
// module mocks don't apply, so the stand-ins hook require directly:
// - "server-only" is bundled by next and isn't an installed package: it resolves to an empty module
// - globalThis.stubModule(specifier, exports): every later require of that module ("@/..." alias, a
//   relative path or a package name) gets the stand-in. register before the code under test loads
const Module = require("node:module");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const stubs = new Map();

// the key of a module: its resolved file without the extension
const keyOf = (filename) => filename.replace(/\.(tsx?|[cm]?js)$/, "");

const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === "server-only") return path.join(__dirname, "server-only.cjs");
  return resolve.call(this, request, ...rest);
};

globalThis.stubModule = (specifier, exports) => {
  const filename = Module._resolveFilename(specifier, {
    id: path.join(root, "index.ts"),
    filename: path.join(root, "index.ts"),
    paths: Module._nodeModulePaths(root),
  });
  stubs.set(keyOf(filename), exports);
};

const load = Module._load;
Module._load = function (request, parent, isMain) {
  if (stubs.size > 0 && request !== "server-only") {
    try {
      const key = keyOf(Module._resolveFilename(request, parent, isMain));
      if (stubs.has(key)) return stubs.get(key);
    } catch {
      // not resolvable here: the normal loader reports it
    }
  }
  return load.apply(this, arguments);
};
