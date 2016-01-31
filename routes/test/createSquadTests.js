/*jslint node: true */
/*jslint newcap: true */
/*global before, beforeEach, afterEach, after, describe, it */
/*jslint nomen: true */
"use strict";

var createsquad = require('../createSquad');
var sinon = require('sinon');
var squadmanagementservice = require('../../lib/ts/SquadManagementService');
var sinonChai = require("sinon-chai");
var chai = require("chai");
chai.should();
chai.use(sinonChai);
require('mocha-sinon');
var expressValidator = require('express-validator')();

describe("Testing of expressjs route for create a squad", function () {
    //1. Module Setup
    var cs,
        sandbox,
        stubCreateClub,
        cms,
        incomingExpressRequest,
        outgoingExpressResponse,
        outgoingExpressResponseSpy;

    beforeEach(function () {

        cms = new squadmanagementservice(null);
        incomingExpressRequest = {
            body: { clubname: 'Western Knights', cityname: 'Perth', squadname: '1st team', season: '2015', adminemail: 'mel.taylor-gainsford@wk.com.au', agelimit: 'unrestricted' },
            session: { authenticated: true, user: { } }
        };
        expressValidator(incomingExpressRequest, {}, function () {
            console.log('Unit Test Stub - Validation performed');
        });

        //sandbox to cleanup global spies
        sandbox = sinon.sandbox.create();
        stubCreateClub = sandbox.stub(cms, 'CreateSquad');
        stubCreateClub.yields(null);
        outgoingExpressResponse = {
            redirect: function (view) { /* just a stub to be overridden by sinon */ console.log('This code for should not be executed in a unit test %s', view); },
            render: function (view) { /* just a stub to be overridden by sinon */ console.log('This code for should not be executed in a unit test %s', view); }
        };
        outgoingExpressResponseSpy = sandbox.spy(outgoingExpressResponse, 'render');

        //this will be setup to be injected soon enough
        cs = new createsquad(cms);
    });

    function assertSquadCreatedAndViewUpdated(redirectView, spy, alertType, messages) {
        spy.should.have.been.calledWith(redirectView, sinon.match({ flash: {
            type: alertType,
            messages: messages
        }}));
    }

    function enactRequestBodyValidationTest(incomingExpressRequest, expectedMessage, done) {
        //2. exercise
        cs.post(incomingExpressRequest, outgoingExpressResponse);

        //3. verify
        assertSquadCreatedAndViewUpdated('createSquad', outgoingExpressResponseSpy, 'alert-danger', expectedMessage);

        //4. teardown
        done();
    }

    //2. Module Exercise

    it("Create a valid squad", function (done) {
        //1. setup

        //2. exercise
        cs.post(incomingExpressRequest, outgoingExpressResponse);

        //3. verify
        assertSquadCreatedAndViewUpdated('manageSquad', outgoingExpressResponseSpy,
            'alert-success',
            [{ msg: 'Squad has been successfully created.' }]);

        //4. teardown
        done();
    });

    it("Notifies via response when an error during call to createSquad in service", function (done) {
        //setup - changing the default behaviour
        var expectedErrorMessage = 'Create Squad Service Failure',
            expectedError = new Error(expectedErrorMessage);
        stubCreateClub.yields(expectedError);

        //exercise
        cs.post(incomingExpressRequest, outgoingExpressResponse);

        //verify
        assertSquadCreatedAndViewUpdated('createSquad', outgoingExpressResponseSpy, 'alert-danger', [{ msg: expectedErrorMessage }]);

        //teardown
        done();
    });

    it("Notification of missing club name error", function (done) {
        //1. setup - changing the default behaviour
        incomingExpressRequest.body.clubname = '';
        //2, Exercise
        enactRequestBodyValidationTest(incomingExpressRequest, [{ msg: 'Club name is required' }], done);
    });

    it("Notification of missing city name error", function (done) {
        //1. setup - changing the default behaviour
        incomingExpressRequest.body.cityname = '';
        //2. Exercise
        enactRequestBodyValidationTest(incomingExpressRequest, [{ msg: 'City is required' }], done);
    });

    it("Notification of missing season error", function (done) {
        //setup - changing the default behaviour
        incomingExpressRequest.body.season = '';
        enactRequestBodyValidationTest(incomingExpressRequest, [{ msg: 'Season is required' }], done);
    });

    it("Notification of missing age limit error", function (done) {
        //1. setup - changing the default behaviour
        incomingExpressRequest.body.agelimit = '';
        //2. exercise
        enactRequestBodyValidationTest(incomingExpressRequest, [{ msg: 'Age limit is required' }], done);
    });

    it("Notification of missing admin email error", function (done) {
        //1. setup - changing the default behaviour
        incomingExpressRequest.body.adminemail = '';
        //2. exercise
        enactRequestBodyValidationTest(incomingExpressRequest, [{ msg: 'Administrator/Custodian Email is required' }, {msg: 'Administrator/Custodian Email does not appear to be valid'}], done);
    });

    it("Notification of invalid admin email error", function (done) {
        //1. setup - changing the default behaviour
        incomingExpressRequest.body.adminemail = '---';
        //2. exercise
        enactRequestBodyValidationTest(incomingExpressRequest, [{ msg: 'Administrator/Custodian Email does not appear to be valid' }], done);
    });

    //3. Module Verify

    //4. Module Cleanup    
    afterEach(function () {
        sandbox.restore();
    });

});