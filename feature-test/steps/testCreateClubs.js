/*jslint nomen: true */
/*jslint node: true */
/*jslint newcap: true */
/*global before, afterEach, after, featureFile, scenarios, steps */
'use strict';

var path = require('path');
var Yadda = require('yadda');
var clubmanagementservice = require('../../lib/ts/ClubManagementService'); // The library that you wish to test
var databasefactory = require('../../lib/common/DatabaseFactory');
var dbhelpers = require('./common/DbHelpers');
var library = require('./CreateClubs');
var yadda;
//creating a path that works for locations, Yaddas calls is not as good as node's require and you need
//to be in the folder itself
var featureFilePath = path.resolve(__dirname, '../features/CreateClubs.feature');
var interpreter_context;

Yadda.plugins.mocha.StepLevelPlugin.init();

before(function (done) {
    var dbf = new databasefactory();
    dbf.levelredisasync(10, function (database) {
        var usersDb = dbf.userdb(database.leveldb),
            clubsDb = dbf.clubdb(database.leveldb),
            cms = new clubmanagementservice(clubsDb);
        interpreter_context = { cms: cms, database: database, usersDb: usersDb, clubsDb: clubsDb, createdUsers: [], createdClubs: [] };
        yadda = new Yadda.Yadda(library, { interpreter_context: interpreter_context });
        done();
    });
});

after(function (done) {
    var dbh = new dbhelpers();
    dbh.CascadeDelete({ clubsDb: interpreter_context.clubsDb, usersDb: interpreter_context.usersDb },
                      undefined, undefined, undefined,
                      interpreter_context.createdClubs, interpreter_context.createdUsers,
        function () {
            if (interpreter_context.database.clientdone) {
                interpreter_context.database.clientdone();
            }
            done();
        });
});

featureFile(featureFilePath, function (feature) {
    scenarios(feature.scenarios, function (scenario) {
        var scenario_context = { };
        steps(scenario.steps, function (step, done) {
            yadda.yadda(step, { scenario_context: scenario_context }, done);
        });
    });
});