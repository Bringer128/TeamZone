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
var featureFilePath = path.resolve(__dirname, '../features/AddPlayersToSquad.feature');
var library = require('./AddPlayersToSquad');
var interpreter_context;
var yadda;

before(function (done) {
    var dbf = new databasefactory();
    dbf.levelredisasync(10, function (database) {
        var usersDb = dbf.userdb(database.leveldb),
            clubsDb = dbf.clubdb(database.leveldb),
            squadsDb = dbf.squaddb(database.leveldb),
            squadplayersDb = dbf.squadplayersdb(database.leveldb),
            playersDb = dbf.playerdb(database.leveldb),
            sms = new squadmanagementservice(squadsDb, playersDb, squadplayersDb);
        interpreter_context = { sms: sms, database: database,
                                playersDb: playersDb, usersDb: usersDb, clubsDb: clubsDb, squadsDb: squadsDb, squadplayersDb: squadplayersDb,
                                createdPlayers: [], createdUsers: [], createdClubs: [], createdSquads: [],
                                createdSquadPlayers: [] };
        yadda = new Yadda.Yadda(library, { interpreter_context: interpreter_context });
        done();
    });
});

after(function (done) {
    var dbh = new dbhelpers();
    dbh.CascadeDelete({ playersDb: interpreter_context.playersDb, squadsDb: interpreter_context.squadsDb, squadplayersDb: interpreter_context.squadplayersDb,
                      clubsDb: interpreter_context.clubsDb, usersDb: interpreter_context.usersDb },
                      interpreter_context.createdPlayers, interpreter_context.createdSquads, interpreter_context.createdSquadPlayers,
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
        var scenario_context = { TooYoungError: undefined };
        steps(scenario.steps, function (step, done) {
            yadda.yadda(step, { scenario_context: scenario_context }, done);
        });
    });

});