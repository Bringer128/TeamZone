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
var clubmanagementservice = require('../ClubManagementService');
var createError = require('errno').create;
var noop = require('node-noop').noop;

describe("Club Management Service Unit Tests", function () {
    // 1. Module Setup
    var levelimdb,
        cms,
        spyCallback,
        sandbox,
        $jsInject,
        clubname,
        fieldname,
        suburbname,
        cityname,
        adminemail,
        stubPut,
        stubGet,
        fakeClubsReadStream,
        errorNotFound;

    function injectDependenciesForUserManagementService() {
        //use in memory db, some calls are mocked anyway - but this makes it easier anyway
        levelimdb = levelcache();

        // levelcache does not have an up-to-date API with leveldb/levelup
        // add the appropriate method to our levelcache so sinon can work
        levelimdb.createReadStream = noop;

        $jsInject = new $$jsInject();
        $jsInject.register("ClubManagementService", ["clubs", clubmanagementservice]);
        $jsInject.register("clubs", [function () { return levelimdb; }]);

        //methods to tests are here with required dependencies passed through construction
        cms = $jsInject.get("ClubManagementService");
    }


    function FakeClubsReadStream() {
        this.error = null;
        this.clubs = [];

        var dataCallback = noop,
            errorCallback = noop,
            endCallback = noop;
        this.on = function (type, callback) {
            if (type === "data") {
                dataCallback = callback;
            }
            if (type === "error") {
                errorCallback = callback;
            }
            if (type === "end") {
                endCallback = callback;
            }

            return this;
        };

        this.sendData = function () {
            if (this.error) {
                errorCallback(this.error);
                endCallback();
                return;
            }

            this.clubs.forEach(function (club) { dataCallback(club); });
            endCallback();
        };
    }

    beforeEach(function () {
        //Setup that is used across all tests
        injectDependenciesForUserManagementService();

        clubname = 'Western Knights';
        fieldname = 'Nash Field';
        suburbname = 'Mosman Park';
        cityname = 'Perth';
        adminemail = 'joe.king@gmail.com';

        //sandbox to cleanup global spies
        sandbox = sinon.sandbox.create();
        spyCallback = sandbox.spy();

        stubPut = sandbox.stub(levelimdb, 'put');
        stubPut.yields();

        stubGet = sandbox.stub(levelimdb, 'get');
        stubGet.yields(null, { });

        var NotFoundError = createError('NotFoundError'),
            stubCreateReadStream = sandbox.stub(levelimdb, 'createReadStream');
        NotFoundError.prototype.notFound = true;
        errorNotFound = new NotFoundError();

        fakeClubsReadStream = new FakeClubsReadStream();
        stubCreateReadStream.returns(fakeClubsReadStream);
    });

    function assertCallBackToClientCalledOnce() {
        var callbackcount = spyCallback.callCount;
        assert.equal(callbackcount, 1, 'Callback should only be called once, but was called ' + callbackcount + ' times');
    }

    function callbackCalledWithError(optionalMessage) {
        assertCallBackToClientCalledOnce();
        var calledWithError = spyCallback.calledWith(sinon.match.instanceOf(Error)),
            messageMatches = !optionalMessage || spyCallback.calledWith(sinon.match.has("message", optionalMessage));
        return calledWithError && messageMatches;
    }

    function callbackCalledWithNoError() {
        assertCallBackToClientCalledOnce();
        return !spyCallback.calledWith(sinon.match.instanceOf(Error));
    }

    function assertReturnsErrorForInvalidEmail() {
        assert(callbackCalledWithError('The admin email is invalid'), 'Admin Email should have failed validation');
    }

    function assertReturnsErrorForMissingParameter(parametername) {
        assert(callbackCalledWithError('The argument ' + parametername + ' is a required argument'), 'Missing parameter ' + parametername);
    }

    function assertClubWasCreated() {
        assert(stubPut.calledWith(clubname + '~' + cityname, { field: fieldname, suburb: suburbname, admin: adminemail }), 'put not called with correct parameters');
        assert(callbackCalledWithNoError(), 'Callback not called after saving the team');
    }

    function assertReturnsErrorWhenClubInSameCityAlreadyExists() {
        assert(callbackCalledWithError('Club in the same city cannot be created more than once'), 'Error message not returned through callback');
    }

    function assertReturnsErrorOnGeneralDatabaseFailure(message) {
        assert(callbackCalledWithError(message), 'Error message not returned through callback');
    }

    function assertReturnsErrorWhenNewUserDoesNotGetSavedToTheDatabase(errormessage) {
        assert(callbackCalledWithError(errormessage), 'Failed to raise error message ' + errormessage);
    }

    // 2. Module exercise

    it('Can create a valid club', function (done) {
        // 1. Setup
        stubGet.yields(errorNotFound);

        // 2. Exercise
        cms.CreateClub(clubname, fieldname, suburbname, cityname, adminemail, spyCallback);

        // 3. Verify
        assertClubWasCreated();

        // 4. Cleanup/Teardown
        done();
    });

    it('Returns error clubname parameter is missing', function (done) {
        // 1. Setup

        // 2. Exercise
        cms.CreateClub(null, fieldname, suburbname, cityname, adminemail, spyCallback);

        // 3. Verify
        assertReturnsErrorForMissingParameter('clubname');

        // 4. Cleanup/Teardown
        done();
    });

    it('Returns error fieldname parameter is missing', function (done) {
        // 1. Setup

        // 2. Exercise
        cms.CreateClub(clubname, null, suburbname, cityname, adminemail, spyCallback);

        // 3. Verify
        assertReturnsErrorForMissingParameter('fieldname');

        // 4. Cleanup/Teardown
        done();
    });

    it('Returns error suburbname parameter is missing', function (done) {
        // 1. Setup

        // 2. Exercise
        cms.CreateClub(clubname, fieldname, '', cityname, adminemail, spyCallback);

        // 3. Verify
        assertReturnsErrorForMissingParameter('suburbname');

        // 4. Cleanup/Teardown
        done();
    });

    it('Returns error cityname parameter is missing', function (done) {
        // 1. Setup

        // 2. Exercise
        cms.CreateClub(clubname, fieldname, suburbname, '', adminemail, spyCallback);

        // 3. Verify
        assertReturnsErrorForMissingParameter('cityname');

        // 4. Cleanup/Teardown
        done();
    });

    it('Returns error adminemail parameter is missing', function (done) {
        // 1. Setup

        // 2. Exercise
        cms.CreateClub(clubname, fieldname, suburbname, cityname, null, spyCallback);

        // 3. Verify
        assertReturnsErrorForMissingParameter('adminemail');

        // 4. Cleanup/Teardown
        done();
    });

    it("Notification of invalid email error", function (done) {
        // 1. Setup - changing the default behaviour

        // 2. Exercise
        cms.CreateClub(clubname, fieldname, suburbname, cityname, '--', spyCallback);

        // 3. Verify
        assertReturnsErrorForInvalidEmail();

        // 4. Cleanup/Teardown
        done();
    });

    it('Returns error if the same club is created within the same city, this prevents multiple club names appearing in the same city but allows it for other cities', function (done) {
        // 1. Setup

        // 2. Exercise
        cms.CreateClub(clubname, fieldname, suburbname, cityname, adminemail, spyCallback);

        // 3. Verify
        assertReturnsErrorWhenClubInSameCityAlreadyExists();

        // 4. Cleanup/Teardown
        done();
    });

    it('Returns error if checking for existance of the club fails because of db failure', function (done) {
        // 1. Setup
        var message = "General Database Failure";
        stubGet.yields(new Error(message));

        // 2. Exercise
        cms.CreateClub(clubname, fieldname, suburbname, cityname, adminemail, spyCallback);

        // 3. Verify
        assertReturnsErrorOnGeneralDatabaseFailure(message);

        // 4. Cleanup/Teardown
        done();
    });

    it('Returns error if the new club fails to be saved to the database', function (done) {
        // 1. Setup
        stubGet.yields(errorNotFound);
        var errormessage = "Database access failed";
        stubPut.yields(new Error(errormessage));

        // 2. Exercise
        cms.CreateClub(clubname, fieldname, suburbname, cityname, adminemail, spyCallback);

        // 3. Verify
        assertReturnsErrorWhenNewUserDoesNotGetSavedToTheDatabase(errormessage);

        done();
    });

    it('Returns all clubs managed by a specified user', function (done) {
        // 1. Setup
        fakeClubsReadStream.clubs = [
            { key: 'Club1', value: { admin: adminemail }},
            { key: 'Club2', value: { admin: 'anotheremail@foo.com' }}
        ];

        // 2. Exercise
        cms.GetClubs(adminemail, spyCallback);
        fakeClubsReadStream.sendData();

        // 3. Verify
        assert(spyCallback.calledWith(null, ['Club1']), "Expected matching club name filtered by admin email");

        done();
    });

    it('If the user has no clubs returns a NotFoundError', function (done) {
        // 2. Exercise
        cms.GetClubs(adminemail, spyCallback);
        fakeClubsReadStream.sendData();

        // 3. Verify
        assert(spyCallback.calledWith({
            notFound: true,
            message: sinon.match.string
        }));

        // 4. Teardown
        done();
    });

    // 3. Module Verify

    // 4. Module Cleanup
    afterEach(function () {
        sandbox.restore();
    });

});