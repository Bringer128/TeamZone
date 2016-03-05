'use strict';
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var servicebase = require('./ServiceBase');
var kf = require('./KeyFactory');
var errTo = require('errto');
var Service;
(function (Service) {
    var ClubManagementService = (function (_super) {
        __extends(ClubManagementService, _super);
        function ClubManagementService(_clubs) {
            var _this = this;
            _super.call(this);
            this._clubs = _clubs;
            this.CreateClub = function (clubname, fieldname, suburbname, cityname, adminemail, callback) {
                var clubs = _this._clubs;
                var key = kf.KeyFactory.clubKeyMaker(clubname, cityname);
                _super.prototype.validateParameters.call(_this, _this.validationParametersForCreatingClub(clubname, fieldname, suburbname, cityname, adminemail), errTo(callback, function () {
                    clubs.get(key, function (err) {
                        if (err && err.notFound) {
                            clubs.put(key, { field: fieldname, suburb: suburbname, admin: adminemail }, { sync: true }, errTo(callback, callback));
                        }
                        else if (err) {
                            callback(err);
                        }
                        else {
                            callback(new Error('Club in the same city cannot be created more than once'));
                        }
                    });
                }));
            };
            this.GetClubs = function (adminemail, callback) {
                var clubs = [];
                var err = null;
                _this._clubs.createReadStream().on('data', function (data) {
                    if (adminemail === data.value.admin) {
                        clubs.push(data.key);
                    }
                }).on('error', function (error) {
                    err = error;
                }).on('end', function () {
                    if (!err && clubs.length == 0) {
                        err = {
                            notFound: true,
                            message: 'No clubs found with admin: ' + adminemail
                        };
                    }
                    callback(err, clubs);
                });
            };
        }
        ClubManagementService.prototype.validationParametersForCreatingClub = function (clubname, fieldname, suburbname, cityname, adminemail) {
            return [
                { name: 'clubname', content: clubname, validations: [this.checkNotNullOrEmpty] },
                { name: 'fieldname', content: fieldname, validations: [this.checkNotNullOrEmpty] },
                { name: 'suburbname', content: suburbname, validations: [this.checkNotNullOrEmpty] },
                { name: 'cityname', content: cityname, validations: [this.checkNotNullOrEmpty] },
                { name: 'adminemail', content: adminemail, validations: [this.checkNotNullOrEmpty, { v: this.checkEmailAddress, m: 'The admin email is invalid' }] }
            ];
        };
        return ClubManagementService;
    })(servicebase.Service.ServiceBase);
    Service.ClubManagementService = ClubManagementService;
})(Service = exports.Service || (exports.Service = {}));
module.exports = Service.ClubManagementService;
//# sourceMappingURL=ClubManagementService.js.map