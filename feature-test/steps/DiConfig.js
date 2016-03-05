'use strict'

var DiConfig = function(application) {
  this.application = application;
};

var configureDependencies = function() {
  var config = loadDiConfig();
  bind(this.application, config);
};

var loadDiConfig = function() {
  var config;

  try {
    config = require('./di.config.json');

    if(!config) {
      throw 'unable to load config';
    }
    
    if(!config.items) {
      throw '"items" not defined';
    }
    
  }
  catch(e) {
    throw 'Unable to parse "di.config.json": ' + e;
  }

  return config;
};

var bind = function(application, config) {
  require('./common/test-dependency-injector')(application);

  bindItems(application, config.items);
};

var bindItems = function(application, dependencyItems) {
  var dependencyItemsLength = dependencyItems.length;

  for(var i = 0; i < dependencyItemsLength; i++) {
    var Item = require(dependencyItems[i].item);
    var scope = dependencyItems[i].scope;
    var ItemDependencies = [];

    var dependencies = dependencyItems[i].dependencies;
    var dependeciesLength = dependencies.length;
    var dependency;
    
    for(var k = 0; k < dependeciesLength; k++) {
      try {
        dependency = dependencies[k];
        console.log('Adding dependency %s', dependency);
        if (dependency === 'null')
          ItemDependencies.push(null);
        else if (dependency.substring(0, 1) !== '.') {
          ItemDependencies.push(makeLiteralReturnFunction(dependency));
        }
        else
          ItemDependencies.push(require(dependency));
      }
      catch (e) {
        console.log(e.message + ' ' + dependency);
        throw e;
      }
    }

    application.bind(Item, ItemDependencies, scope);
  }
  
  function makeLiteralReturnFunction(dependency) {
    return function() { return dependency; };
  }

};

var resolve = function(name) {
  
}

DiConfig.prototype = {
  configureDependencies: configureDependencies,
  resolve: resolve
};

module.exports = DiConfig;