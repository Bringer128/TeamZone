/// <reference path='../typings/tsd.d.ts' />
/// <reference path='../typings/express/express.d.ts' />
/// <reference path='../typings/express-session/express-session.d.ts' />
/// <reference path='../typings/express-validator/express-validator.d.ts' />
/// <reference path='../typings/express/express.ext.d.ts' />
/// <reference path='../typings/node/node.d.ts' />

/*jslint nomen: true */
'use strict';

import express = require("express");
import Flash = require("./flash");
import SquadManagement = require("../lib/ts/ISquadManagementService");
import ClubManagement = require("../lib/ts/IClubManagementService");
import webRequest = require("./IWebRequest");

/*
*  Handles web requests to manage creation of clubs
*  @class
**/
export class CreateSquad implements webRequest.IWebRequest {
  
    /**
    * Accepts the service component that will handle the creation of a new club in the database
    * @constructor
    * @param {ITeamManagementService} _tms - service to provide the ability to create a new club.
    **/  
    constructor(private _sms: SquadManagement.ISquadManagementService, private _cms: ClubManagement.IClubManagementService) { 
    }
    
    /**
    * Handles the incoming request by validating the incoming data and then asking the team management service to create the club
    * @constructor
    * @param {express.Request} req - incoming request object furnished by Express
    * @param {express.Response} req - incoming response object furnished by Express
    **/  
    post = (req: express.Request, res: express.Response) => {
    
        req.checkBody('clubname', 'Club name is required').notEmpty();
        req.checkBody('cityname', 'City is required').notEmpty();
        req.checkBody('season', 'Season is required').notEmpty();
        req.checkBody('squadname', 'Squad is required').notEmpty();
        req.checkBody('agelimit', 'Age limit is required').notEmpty();
        req.checkBody('adminemail', 'Administrator/Custodian Email is required').notEmpty();
        req.checkBody('adminemail', 'Administrator/Custodian Email does not appear to be valid').isEmail();
        
        var errors = req.validationErrors();
        var flash: Flash = new Flash();
        
        //work around for access to ums in nested callback code
        var sms = this._sms;
        
        if (errors && errors.length > 0) {
            var errorCount: number = errors.length;
            var msgs = [];
            for (var i: number = 0; i < errorCount; i++) {
                msgs.push({ msg: errors[i].msg});
            }
            flash.type = 'alert-danger';
            flash.messages = msgs;
            res.render('createSquad', { flash: flash });
        } else {
            var clubname = req.body.clubname;
            var cityname = req.body.cityname;
            var season = req.body.season;
            var squadname = req.body.squadname;
            var agelimit = req.body.agelimit;
            var adminemail = req.body.adminemail;
            sms.CreateSquad(clubname, cityname, squadname, season, agelimit, adminemail, function(err) {
                if (err) {
                    flash.type = 'alert-danger';
                    flash.messages = [{ msg: err.message }];
                    res.render('createSquad', { flash: flash });
                  } else {
                    flash.type = 'alert-success';
                    flash.messages = [{ msg: 'Squad has been successfully created.' }];
                    res.render('manageSquad', { flash: flash });
                }
            });
          }
    }
    
    /**
    * Renders the create club page when requested by a user
    * @constructor
    * @param {express.Request} req - incoming request object furnished by Express
    * @param {express.Response} req - incoming response object furnished by Express
    **/  
    get = (req: express.Request, res: express.Response) => {
        
        this._cms.GetClubs(req.session.user.email, function(err, clubs) {
            if(err && err.notFound) {
                res.render('notClubAdmin');
                return;
            }
            
            if(err) {
                var flash: Flash = new Flash();
                res.render('createSquad', { flash: flash });
                return;
            }
            
            res.render('createSquad', { clubs: clubs || []});  
        });
    }
}

module.exports = CreateSquad;