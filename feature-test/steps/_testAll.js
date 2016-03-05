/* jslint node: true */
/* global featureFile, scenarios, steps */
"use strict";

var Yadda = require('yadda');
Yadda.plugins.mocha.AsyncStepLevelPlugin.init();

new Yadda.FeatureFileSearch('../features').each(function(file) {

    featureFile(file, function(feature) {

        var library = require('./AddaPlayer');
        var yadda = new Yadda.Yadda(library);

		before(function(done) {
		// ensure a clean environment
		console.log('running before');
            done();
        });
		
        scenarios(feature.scenarios, function(scenario) {
            steps(scenario.steps, function(step, done) {
                yadda.yadda(step, done);
            });
        });
		
		after(function(done) {
		// ensure a clean environment
		console.log('running after');
            done();
        });
    });
});