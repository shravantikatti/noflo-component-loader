/* eslint-disable */
exports.registerCustomLoaders = function (loader, loaders, callback) {
  if (!loaders.length) {
    return callback();
  }
  var customLoader = loaders.shift();
  loader.registerLoader(customLoader, function (err) {
    if (err) {
      return callback(err);
    }
    exports.registerCustomLoaders(loader, loaders, callback);
  });
};


exports.setSource = function (sources, loader, packageId, name, source, language, callback) {
  var implementation;
  var originalSource = source;
  // Transpiling
  if (language === 'coffeescript') {
    if (typeof window !== 'undefined' && !window.CoffeeScript) {
      return callback(new Error('CoffeeScript compiler needed for ' + packageId + '/' + name + ' not available'));
    }
    try {
      source = window.CoffeeScript.compile(source, {
        bare: true
      });
    } catch (e) {
      return callback(e);
    }
  }
  if (language === 'es6' || language === 'es2015') {
    if (typeof window !== 'undefined' && window.babel) {
      try {
        source = window.babel.transform(source).code;
      } catch (e) {
        return callback(e);
      }
    }
  }
  // Eval the contents to get a runnable component
  try {
    var withExports = '(function () { var exports = {}; ' + source + '; return exports; })();';
    implementation = eval(withExports);
  } catch (e) {
    return callback(e);
  }

  if (typeof implementation !== 'function' && (!implementation.getComponent || typeof implementation.getComponent !== 'function')) {
    return callback(new Error('Provided source for ' + packageId + '/' + name + ' failed to create a runnable component'));
  }

  var fullName = packageId + '/' + name;
  sources[fullName] = {
    language: language,
    source: originalSource
  };

  loader.registerComponent(packageId, name, implementation, callback);
};

exports.getSource = function (sources, loader, name, callback) {
  if (!loader.components[name]) {
    return callback(new Error('Component ' + name + ' not available'));
  }
  var component = loader.components[name];
  if (name.indexOf('/') !== -1) {
    var nameParts = name.split('/');
    var componentData = {
      name: nameParts[1],
      library: nameParts[0]
    };
  } else {
    var componentData = {
      name: name,
      library: ''
    };
  }
  if (loader.isGraph(component)) {
    componentData.code = JSON.stringify(component, null, 2);
    componentData.language = 'json';
    return callback(null, componentData);
  } else if (sources[name]) {
    componentData.code = sources[name].source;
    componentData.language = sources[name].language;
    return callback(null, componentData);
  } else if (typeof component === 'function') {
    componentData.code = component.toString();
    componentData.language = 'javascript';
    return callback(null, componentData);
  } else if (typeof component.getComponent === 'function') {
    componentData.code = component.getComponent.toString();
    componentData.language = 'javascript';
    return callback(null, componentData);
  }
  return callback(new Error('Unable to get sources for ' + name));
};
