const { resolve } = require('path');
const { register } = require('tsconfig-paths');

register({
  baseUrl: resolve(__dirname),
  paths: {
    '@modules/*':        ['src/modules/*'],
    '@infrastructure/*': ['src/infrastructure/*'],
    '@common/*':         ['src/common/*'],
  },
});

require('./dist/main');