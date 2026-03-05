// This file registers tsconfig path aliases at runtime so that
// compiled dist/ files can resolve @modules, @infrastructure etc.
// It must run before anything else — hence it's the entry point.

const { resolve } = require('path');
const { register } = require('tsconfig-paths');

const tsConfig = require('./tsconfig.json');

register({
  baseUrl: resolve(__dirname),
  paths: tsConfig.compilerOptions.paths,
});

// Now boot the actual app
require('./dist/main');