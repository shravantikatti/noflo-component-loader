const utils = require('loader-utils');
const discover = require('./lib/discover');
const serialize = require('./lib/serialize');

function generateLoader() {
  let options = utils.getOptions(this);
  if (!options) {
    options = {};
  }
  if (!options.debug) {
    options.debug = false;
  }
  if (!options.graph) {
    options.graph = null;
  }
  if (!options.baseDir) {
    options.baseDir = process.cwd();
  }
  if (!options.manifest) {
    options.manifest = {
      runtimes: ['noflo'],
      discover: true,
      recursive: true,
    };
  }
  this.cacheable();
  const callback = this.async();
  discover(options)
    .then(modules => serialize(modules, options))
    .then((loader) => {
      console.log('----LOADER---');
      console.log(loader);
      console.log('----LOADER---');
      callback(null, loader);
    })
    .catch((err) => {
      callback(err);
    });
}

module.exports = generateLoader;