/*jslint nomen: true */
/*jslint node: true */
/*jslint newcap: true */
/*global before, afterEach, after, featureFile, scenarios, steps */
'use strict';

var path = require('path');
var Yadda = require('yadda');
var squadmanagementservice = require('../../lib/ts/SquadManagementService'); // The library that you wish to test
var databasefactory = require('../../lib/common/DatabaseFactory');
var dbhelpers = require('./common/DbHelpers');

Yadda.plugins.mocha.StepLevelPlugin.init();

//creating a path that works for locations, Yaddas calls is not as good as node's require and you need
//to be in the folder itself
var featureFilePath = path.resolve(__dirname, '../features/AddPlayersToSquads.feature');
var interpreter_context;
var usersDb;
var clubsDb;
var squadsDb;
var playersDb;
var squadplayersDb;
var database;
var sms;

function setupInterpreterContext() {
    var dbf = new databasefactory();
    database = dbf.levelredis();
    usersDb = dbf.userdb(database.leveldb);
    clubsDb = dbf.clubdb(database.leveldb);
    squadsDb = dbf.squaddb(database.leveldb);
    squadplayersDb = dbf.squadplayersdb(database.leveldb);
    playersDb = dbf.playerdb(database.leveldb);
    sms = new squadmanagementservice(squadsDb, playersDb, squadplayersDb);
    interpreter_context = { sms: sms, database: database, usersDb: usersDb, clubsDb: clubsDb, squadsDb: squadsDb, playersDb: playersDb, squadplayersDb: squadplayersDb,
                            createdUsers: [], createdClubs: [], createdSquads: [], createdSquadPlayers: [], createdPlayers: [] };
}

setupInterpreterContext();

before(function (done) {
    done();
});

after(function (done) {
    var dbh = new dbhelpers();
    dbh.CascadeDelete({ playersDb: playersDb, squadsDb: squadsDb, squadplayersDb: squadplayersDb, clubsDb: clubsDb, usersDb: usersDb },
                      interpreter_context.createdPlayers, interpreter_context.createdSquads, interpreter_context.createdSquadPlayers,
                      interpreter_context.createdClubs, interpreter_context.createdUsers, done);
});

var library = require('./AddPlayersToSquads');
var yadda = new Yadda.Yadda(library, { interpreter_context: interpreter_context });

featureFile(featureFilePath, function (feature) {
    scenarios(feature.scenarios, function (scenario) {
        var scenario_context = { };
        steps(scenario.steps, function (step, done) {
            yadda.yadda(step, { scenario_context: scenario_context }, done);
        });
    });
});