/*jslint node: true */
/*jslint newcap: true */
/*global before, beforeEach, afterEach, after, describe, it */
/*jslint nomen: true */
"use strict";

var assert = require('assert');
var English = require('yadda').localisation.English;
var dbhelpers = require('./common/DbHelpers');
var Worker = require('webworker-threads').Worker;
var workers = [], workerErrors = [], workerMessage, worker;
var createUser;

function createUsers(testdata, useremailfieldname, userfirstnamefieldname, userlastnamefieldname, userpasswordfieldname, createdUsers, usersDb, next) {
    var testdatalength = testdata.length,
        currentarrayitem,
        dbh = new dbhelpers(),
        i;
    for (i = 0; i < testdatalength; i += 1) {
        currentarrayitem = testdata[i];
        createUser(dbh, usersDb, createdUsers, currentarrayitem[userfirstnamefieldname], currentarrayitem[userlastnamefieldname],
                   currentarrayitem[userpasswordfieldname], currentarrayitem[useremailfieldname], i, testdatalength, next);
    }
}

function createUser(dbh, usersDb, createdUsers, userfirstname, userlastname, userpassword, useremail, currentUserCount, testUserCount, next) {
    dbh.CreateUser(usersDb, createdUsers, userfirstname, userlastname, userpassword, useremail, '', true,
        function (err) {
            //force failure
            if (err) {
                assert.fail(err, undefined, "Error in Create User with error: " + err.message);
            }
            //need to wait for creation to complete before proceeding
            if (currentUserCount === testUserCount - 1) {
                console.log('user creation completed');
                next();
            }
        });
}

function createClubs(testdata, tms, createdClubs, clubnamefieldname, fieldnamefieldname, suburbnamefieldname, citynamefieldname, useremailfieldname, next) {
    var testdatalength = testdata.length,
        currentarrayitem, 
        i;
    // a simulation of n users by using worker threads
    // setup the workers    
    for(i = 0; i < testdatalength; i++) {
        worker = new Worker(function() {
            //var workerthis = this;
            this.onmessage = function(event) {
                console.log("Event data is " + event.data);
                console.log("Event data club is" + event.data.club);
                console.log('event data next ' + event.data.next);
                postMessage(event.data);
                self.close();
                var databasefactory = require('../../lib/common/DatabaseFactory');
                console.log('Got the databasefactory object');
                var teammanagementservice = require('../../lib/ts/TeamManagementService'); 
                console.log('Got the teammanagementservice object');
                var dbf = new databasefactory();
                console.log('Got the dbf object');
                var database = dbf.levelredis();
                console.log('Got the database object');
                var clubsDb = dbf.clubdb(database.leveldb);
                console.log('Got the clubsDb object');
                var tms = new teammanagementservice(clubsDb);
                console.log('Got the tms object');
                var data = event.data;
                tms.CreateClub(data.club, data.field, data.suburb, data.city, data.adminemail, function(err) {
                    postMessage({ error: err, club: data.club, city: data.city, next: next });
                    self.close();
                });
            };
        });
        worker.onmessage = function(event) {
            // var workerErrors = event.data.workErrors,
            //     workerError,
            //     totalCompletedWorkers = workerErrors.length + event.data.createdClubs.length;
            // if (totalCompletedWorkers === event.data.targetForCompletion) {
            //     //all workers have completed, report any errors - just the first one - keeping it simple
            //     if (workerErrors.length > 0) {
            //         workerError = workerErrors[0];
            //         assert.fail(workerError.error, undefined, "Error in CreateClub with error: " + workerError.error.message);
            //     }
            //     //done we can tell the rest of the test fixture to execute
            console.log('Completed');
            console.log('event data ' + event.data);
            console.log("Event data club is" + event.data.club);
            console.log('event data next ' + event.data.next);
                event.data.next();
            //}
        };
        workers.push(worker);
    }
    //kick off the workers
    // for(i = 0; i < testdatalength; i++) {
    //     currentarrayitem = testdata[i];
    //     createClub(tms, currentarrayitem[clubnamefieldname], currentarrayitem[fieldnamefieldname], currentarrayitem[suburbnamefieldname], 
    //         currentarrayitem[citynamefieldname], currentarrayitem[useremailfieldname], createdClubs, i, testdatalength, next);
    // }
    for(i = 0; i < testdatalength; i++) {
        currentarrayitem = testdata[i];
        workerMessage = {
            club: currentarrayitem[clubnamefieldname], 
            field: currentarrayitem[fieldnamefieldname], 
            suburb: currentarrayitem[suburbnamefieldname], 
            city: currentarrayitem[citynamefieldname], 
            adminemail: currentarrayitem[useremailfieldname], 
            targetForCompletion: testdatalength,
            // createdClubs: createdClubs, 
            // workerErrors: workerErrors,
            // tms: tms, 

            next: next
        };
        workers[i].postMessage(workerMessage);
    }
    
}

function createClub(tms, clubname, fieldname, suburbname, cityname, adminemail, createdClubs, currentClubCount, totalClubCount, next) {
    tms.CreateClub(clubname, fieldname, suburbname, cityname, adminemail,
        function (err) {
            if (err)
                assert.fail(err, undefined, "Error in CreateClub with error: " + err.message);
            //saving the created club for cleaning up later on
            createdClubs.push({ club: clubname, city: cityname });
            if (currentClubCount === totalClubCount - 1) {
                next();
            }
        });
}

function checkClubCreated(dbh, clubsDb, clubname, cityname, suburbname, fieldname, adminemail, currentClubCount, totalClubCount, next) {
    dbh.GetClub(clubsDb, clubname, cityname, function (err, res) {
        if (err)
            assert.fail(err, undefined, "Error in getting the club back with error: " + err.message);
        assert.equal(res.admin, adminemail, 'admin email should have been set to ' + adminemail + ' instead it was ' + res.admin);
        assert.equal(res.suburb, suburbname, 'suburb should have been set to ' + suburbname + ' instead it was ' + res.suburb);
        assert.equal(res.field, fieldname, 'fieldname should have been set to ' + fieldname + ' instead it was ' + res.field);
        if (currentClubCount === totalClubCount - 1) {
            next();
        }        
    });
}

module.exports = (function () {

    return English.library()

        // Background
        .given("There will be several users as specified in our test user file $testdatafile who are creating clubs. The user details are in fields $adminemail, $adminfirstname, $adminlastname, $adminpassword",
            function (testdatafile, useremailfieldname, userfirstnamefieldname, userlastnamefieldname, userpasswordfieldname, next) {
                this.interpreter_context.testdata = require(testdatafile);
                createUsers(this.interpreter_context.testdata, useremailfieldname, userfirstnamefieldname, userlastnamefieldname, userpasswordfieldname, 
                            this.interpreter_context.createdUsers, this.interpreter_context.usersDb, next);
            })

        // Scenario 1
        .given("$useremailfieldname gives the club name $clubnamefieldname located at $fieldnamefieldname in the suburb of $suburbnamefieldname in the city of $citynamefieldname", 
            function (useremailfieldname, clubnamefieldname, fieldnamefieldname, suburbnamefieldname, citynamefieldname, next) {
                this.interpreter_context.useremailfieldname = useremailfieldname; 
                this.interpreter_context.clubnamefieldname = clubnamefieldname;
                this.interpreter_context.fieldnamefieldname = fieldnamefieldname; 
                this.interpreter_context.suburbnamefieldname = suburbnamefieldname;
                this.interpreter_context.citynamefieldname = citynamefieldname;
                createClubs(this.interpreter_context.testdata, this.interpreter_context.tms, this.interpreter_context.createdClubs, 
                        clubnamefieldname, fieldnamefieldname, suburbnamefieldname, 
                        citynamefieldname, useremailfieldname, next);
            }
        )

        .when("the club is saved", function (next) {
            next();
        })

        .then("the $useremailfieldname will also be the administrator of the club", function (emailfieldname, next) {
            var testdata = this.interpreter_context.testdata;
            var testdatalength = testdata.length,
                dbh = new dbhelpers(),
                currentarrayitem;
            for(var i = 0; i < testdatalength; i++) {
                currentarrayitem = testdata[i];
                checkClubCreated(dbh, this.interpreter_context.clubsDb, currentarrayitem[this.interpreter_context.clubnamefieldname], 
                                currentarrayitem[this.interpreter_context.citynamefieldname], currentarrayitem[this.interpreter_context.suburbnamefieldname],
                                 currentarrayitem[this.interpreter_context.fieldnamefieldname], currentarrayitem[this.interpreter_context.useremailfieldname], i, testdatalength, next);
            }
        });
}());
