/*jslint node: true */
/*jslint newcap: true */
/*global before, beforeEach, afterEach, after, describe, it, $$jsInject */
/*jslint nomen: true */
"use strict";

var assert = require('assert'); // built-in node lib
var levelcache = require('level-cache');
var sinon = require('sinon');
require('mocha-sinon');
require('../../common/jsInject');
var squadmanagementservice = require('../SquadManagementService');
var createError = require('errno').create;

describe("Squad Management Service - Create Squad Unit Tests", function () {
    // 1. Module Setup
    var levelimdb,
        sms,
        spyCallback,
        sandbox,
        $jsInject,
        clubname,
        cityname,
        adminemail,
        squadname,
        season,
        agelimit,
        stubPut,
        stubGet,
        errorNotFound;

    function injectDependenciesForUserManagementService() {
        //use in memory db, some calls are mocked anyway - but this makes it easier anyway
        levelimdb = levelcache();

        $jsInject = new $$jsInject();
        $jsInject.register("SquadManagementService", ["clubs", "squads", squadmanagementservice]);
        $jsInject.register("clubs", [function () { return levelimdb; }]);
        $jsInject.register("squads", [function () { return levelimdb; }]);

        //methods to tests are here with required dependencies passed through construction
        sms = $jsInject.get("SquadManagementService");
    }

    beforeEach(function () {
        //Setup that is used across all tests
        injectDependenciesForUserManagementService();

        clubname = 'Western Knights';
        cityname = 'Perth';
        adminemail = 'joe.king@gmail.com';
        squadname = '1st Team';
        season = '2015';
        agelimit = 'unrestricted';

        //sandbox to cleanup global spies
        sandbox = sinon.sandbox.create();
        spyCallback = sandbox.spy();

        stubPut = sandbox.stub(levelimdb, 'put');
        stubPut.yields();
        stubGet = sandbox.stub(levelimdb, 'get');
        stubGet.yields(null, { });

        var NotFoundError = createError('NotFoundError');
        NotFoundError.prototype.notFound = true;
        errorNotFound = new NotFoundError();
    });

    function assertCallBackToClientCalledOnce() {
        var callbackcount = spyCallback.callCount;
        assert.equal(callbackcount, 1, 'Callback should only be called once, but was called ' + callbackcount + ' times');
    }

    function callbackCalledWithNoError() {
        assertCallBackToClientCalledOnce();
        return !spyCallback.calledWith(sinon.match.instanceOf(Error));
    }

    function callbackCalledWithError(optionalMessage) {
        assertCallBackToClientCalledOnce();
        var calledWithError = spyCallback.calledWith(sinon.match.instanceOf(Error)),
            messageMatches = !optionalMessage || spyCallback.calledWith(sinon.match.has("message", optionalMessage));
        return calledWithError && messageMatches;
    }

    function assertReturnsErrorForMissingParameter(parametername) {
        assert(callbackCalledWithError('The argument ' + parametername + ' is a required argument'), 'Missing parameter ' + parametername);
    }

    function assertReturnsErrorForInvalidEmail() {
        assert(callbackCalledWithError('The admin email is invalid'), 'Admin Email should have failed validation');
    }

    function assertSquadWasCreated() {
        assert(stubPut.calledWith(clubname + '~' + cityname + '~' + squadname + '~' + season, { agelimit: agelimit, admin: adminemail }, { sync: true }), 'put not called with correct parameters for the key');
        assert(callbackCalledWithNoError(), 'Callback not called after saving the team');
    }

    function assertReturnsErrorWhenSquadInSameClubSeasonAlreadyExists() {
        assert(callbackCalledWithError('Squad in the same club and season cannot be created more than once'), 'Error message not returned through callback');
    }

    function assertReturnsErrorOnGeneralDatabaseFailure(message) {
        assert(callbackCalledWithError(message), 'Error message not returned through callback');
    }

    function assertReturnsErrorWhenNewUserDoesNotGetSavedToTheDatabase(errormessage) {
        assert(callbackCalledWithError(errormessage), 'Failed to raise error message ' + errormessage);
    }

    // 2. Module Exercise

    it('Can create a valid squad', function (done) {
        // 1. Setup
        stubGet.yields(errorNotFound);

        // 2. Exercise
        sms.CreateSquad(clubname, cityname, squadname, season, agelimit, adminemail, spyCallback);

        // 3. Verify
        assertSquadWasCreated();

        // 4. Cleanup/Teardown
        done();
    });

    it('Returns error clubname parameter is missing', function (done) {
        // 1. Setup

        // 2. Exercise
        sms.CreateSquad(null, cityname, squadname, season, agelimit, adminemail, spyCallback);

        // 3. Verify
        assertReturnsErrorForMissingParameter('clubname');

        // 4. Cleanup/Teardown
        done();
    });

    it('Returns error cityname parameter is missing', function (done) {
        // 1. Setup

        // 2. Exercise
        sms.CreateSquad(clubname, null, squadname, season, agelimit, adminemail, spyCallback);

        // 3. Verify
        assertReturnsErrorForMissingParameter('cityname');

        // 4. Cleanup/Teardown
        done();
    });

    it('Returns error squadname parameter is missing', function (done) {
        // 1. Setup

        // 2. Exercise
        sms.CreateSquad(clubname, cityname, '', season, agelimit, adminemail, spyCallback);

        // 3. Verify
        assertReturnsErrorForMissingParameter('squadname');

        // 4. Cleanup/Teardown
        done();
    });

    it('Returns error season parameter is missing', function (done) {
        // 1. Setup

        // 2. Exercise
        sms.CreateSquad(clubname, cityname, squadname, null, agelimit, adminemail, spyCallback);

        // 3. Verify
        assertReturnsErrorForMissingParameter('season');

        // 4. Cleanup/Teardown
        done();
    });

    it('Returns error agelimit parameter is missing', function (done) {
        // 1. Setup

        // 2. Exercise
        sms.CreateSquad(clubname, cityname, squadname, season, null, adminemail, spyCallback);

        // 3. Verify
        assertReturnsErrorForMissingParameter('agelimit');

        // 4. Cleanup/Teardown
        done();
    });

    it('Returns error admin parameter is missing', function (done) {
        // 1. Setup

        // 2. Exercise
        sms.CreateSquad(clubname, cityname, squadname, season, agelimit, '', spyCallback);

        // 3. Verify
        assertReturnsErrorForMissingParameter('admin');

        // 4. Cleanup/Teardown
        done();
    });

    it("Notification of invalid email error", function (done) {
        // 1. Setup - changing the default behaviour

        // 2. Exercise
        sms.CreateSquad(clubname, cityname, squadname, season, agelimit, '----', spyCallback);

        // 3. Verify
        assertReturnsErrorForInvalidEmail();

        // 4. Cleanup/Teardown
        done();
    });

    it('Returns error if the same squad is created within the same key (club, city, season), this prevents multiple squad names appearing in the same club and season', function (done) {
        // 1. Setup

        // 2. Exercise
        sms.CreateSquad(clubname, cityname, squadname, season, agelimit, adminemail, spyCallback);

        // 3. Verify
        assertReturnsErrorWhenSquadInSameClubSeasonAlreadyExists();

        // 4. Cleanup/Teardown
        done();
    });

    it('Returns error if checking for existance of the squad fails because of db failure', function (done) {
        // 1. Setup
        var message = "General Database Failure";
        stubGet.yields(new Error(message));

        // 2. Exercise
        sms.CreateSquad(clubname, cityname, squadname, season, agelimit, adminemail, spyCallback);

        // 3. Verify
        assertReturnsErrorOnGeneralDatabaseFailure(message);

        // 4. Cleanup/Teardown
        done();
    });

    it('Returns error if the new squad fails to be saved to the database', function (done) {
        // 1. Setup
        stubGet.yields(errorNotFound);
        var errormessage = "Database access failed";
        stubPut.yields(new Error(errormessage));

        // 2. Exercise
        sms.CreateSquad(clubname, cityname, squadname, season, agelimit, adminemail, spyCallback);

        // 3. Verify
        assertReturnsErrorWhenNewUserDoesNotGetSavedToTheDatabase(errormessage);

        done();
    });

    //3. Module Verify

    //4. Module Cleanup
    afterEach(function () {
        sandbox.restore();
    });

});