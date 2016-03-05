/// <reference path='../../typings/tsd.d.ts' />
/// <reference path='../../typings/underscore/underscore.d.ts' />
/*jslint node: true */
/*jslint newcap: true */
/*jslint nomen: true */
'use strict';

import cms = require('./IClubManagementService');
import servicebase = require('./ServiceBase');
import kf = require('./KeyFactory');
import assert = require('assert');
import _ = require('underscore');
var errTo = require('errto');

export module Service {

	/*
	*  Implementation for Services for Club Management like like creating clubs and amending club information
	*  @class
	**/
	export class ClubManagementService 
		extends servicebase.Service.ServiceBase
		implements cms.IClubManagementService {

		/**
		* Accepts the components that support team management like the data store.  
		* @constructor
		* @param {clubdb} _clubs - The storage of clubs.
		**/
		constructor(private _clubs: any) {
			super();
		}

		/**
		* Will allow creation of the club.  Supplied parameters are mandatory.  
		* @param {string} clubname - the name of the club to be created.
		* @param {string} fieldname - the home field of the club.
		* @param {string} suburbname - the suburb of the home field and/or club.
		* @param {string} cityname - the name of the city the club plays in.
		* @param {string} adminemail - the email address of the main administrator of the club.  Usually the person creating the club.
		* @param {callback} callback - tell the caller if club created or there was a failure
		**/
		CreateClub = (clubname: string, fieldname: string, suburbname: string, cityname: string, adminemail: string, callback: any) => {
			var clubs = this._clubs;
			var key = kf.KeyFactory.clubKeyMaker(clubname, cityname);
			super.validateParameters(this.validationParametersForCreatingClub(clubname, fieldname, suburbname, cityname, adminemail), errTo(callback, function() {
		    	clubs.get(key, function(err) {
		    		if(err && err.notFound) {
						clubs.put(key, { field: fieldname, suburb: suburbname, admin: adminemail }, { sync: true }, errTo(callback, callback));
		    		} else if (err) {
		    			callback(err);
				    } else {
				    	callback(new Error('Club in the same city cannot be created more than once'));
				    }
				});
			}));
		}
		
		GetClubs = (adminemail: string, callback: any) => {
			var clubs = [];
			var err = null;
			this._clubs.createReadStream()
				.on('data', data => {
					if(adminemail === data.value.admin) {
						clubs.push(data.key);
					}
				})
				.on('error', error => {
					err = error;
				})
				.on('end', () => {
					if(!err && clubs.length == 0) {
						err = {
							notFound: true,
							message: 'No clubs found with admin: ' + adminemail
						};
					}
					callback(err, clubs);
				});
		}

		/**
		* Supplies an array parameter values and their names and links to the validations required for these parameters
		* @param {string} clubname - the name of the club to be created.
		* @param {string} fieldname - the home field of the club.
		* @param {string} suburbname - the suburb of the home field and/or club.
		* @param {string} cityname - the name of the city the club plays in.
		* @param {string} adminemail - the email address of the main administrator of the club.  Usually the person creating the club.
		**/
		validationParametersForCreatingClub(clubname: string, fieldname: string, suburbname: string, cityname: string, adminemail: string) : any {
			return [ 
				{ name: 'clubname', content: clubname, validations: [ this.checkNotNullOrEmpty ] }, { name: 'fieldname', content: fieldname, validations: [ this.checkNotNullOrEmpty ] }, 
			  	{ name: 'suburbname', content: suburbname, validations: [ this.checkNotNullOrEmpty ] }, { name: 'cityname', content: cityname, validations: [ this.checkNotNullOrEmpty ] }, 
			  	{ name: 'adminemail', content: adminemail, validations: [ this.checkNotNullOrEmpty, { v: this.checkEmailAddress, m: 'The admin email is invalid' } ] }
			];
		}
		
	}
}
module.exports = Service.ClubManagementService;