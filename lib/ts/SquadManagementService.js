'use strict';
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var servicebase = require('./ServiceBase');
var kf = require('./KeyFactory');
var _ = require('underscore');
var errTo = require('errto');
var createError = require('errno').create;
var AgeLimitError = createError('AgeLimitError');
var Service;
(function (Service) {
    var SquadManagementService = (function (_super) {
        __extends(SquadManagementService, _super);
        function SquadManagementService(_squads, _players, _squadplayers) {
            var _this = this;
            _super.call(this);
            this._squads = _squads;
            this._players = _players;
            this._squadplayers = _squadplayers;
            this.CreateSquad = function (clubname, cityname, squadname, season, agelimit, admin, callback) {
                var key = kf.KeyFactory.squadKeyMaker(clubname, cityname, squadname, season);
                var squads = _this._squads;
                _super.prototype.validateParameters.call(_this, _this.validationParametersForCreatingSquad(clubname, cityname, squadname, season, agelimit, admin), errTo(callback, function () {
                    squads.get(key, function (err) {
                        if (err && err.notFound) {
                            squads.put(key, { agelimit: agelimit, admin: admin }, { sync: true }, errTo(callback, callback));
                        }
                        else if (err) {
                            callback(err);
                        }
                        else {
                            callback(new Error('Squad in the same club and season cannot be created more than once'));
                        }
                    });
                }));
            };
            this.AddPlayerToSquad = function (clubname, cityname, squadname, season, playeremail, callback, targetyear) {
                var squadplayers = _this._squadplayers;
                var squadkey = kf.KeyFactory.squadKeyMaker(clubname, cityname, squadname, season);
                _this.validatePlayerForSquadParameters(clubname, cityname, squadname, season, playeremail, targetyear, squadkey, errTo(callback, function () {
                    var key = squadkey + '~' + playeremail;
                    squadplayers.get(key, function (err) {
                        if (err && err.notFound) {
                            squadplayers.put(key, { playeremail: playeremail }, { sync: true }, errTo(callback, callback));
                        }
                        else if (err)
                            callback(err);
                        else
                            callback(new Error('Cannot add the same player twice to a squad'));
                    });
                }));
            };
            this.GetPlayersForClubNotInSquad = function (clubname, cityname, squadname, season, callback) {
                var playersdb = _this._players;
                var clubKey = kf.KeyFactory.clubKeyMaker(clubname, cityname);
                _this.GetPlayersForSquad(clubname, cityname, squadname, season, function (err, squadplayers) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        var players = [];
                        playersdb.createReadStream({ gte: clubKey }).on('data', function (player) {
                            if (!_.find(squadplayers, function (s) {
                                return s.email === player.email;
                            })) {
                                players.push(player);
                            }
                        }).on('end', function () {
                            callback(null, players);
                        }).on('error', function (err) {
                            callback(err);
                        });
                    }
                });
            };
            this.GetPlayersForSquad = function (clubname, cityname, squadname, season, callback) {
                var players = [];
                _this._squadplayers.createReadStream(kf.KeyFactory.squadKeyMaker(clubname, cityname, squadname, season)).on('data', function (player) {
                    players.push(player);
                }).on('end', function () {
                    callback(null, players);
                }).on('error', function (err) {
                    callback(err);
                });
            };
        }
        SquadManagementService.prototype.validationParametersForCreatingSquad = function (clubname, cityname, squadname, season, agelimit, admin) {
            return [
                { name: 'clubname', content: clubname, validations: [this.checkNotNullOrEmpty] },
                { name: 'squadname', content: squadname, validations: [this.checkNotNullOrEmpty] },
                { name: 'cityname', content: cityname, validations: [this.checkNotNullOrEmpty] },
                { name: 'season', content: season, validations: [this.checkNotNullOrEmpty] },
                { name: 'agelimit', content: agelimit, validations: [this.checkNotNullOrEmpty] },
                { name: 'admin', content: admin, validations: [this.checkNotNullOrEmpty, { v: this.checkEmailAddress, m: 'The admin email is invalid' }] }
            ];
        };
        SquadManagementService.prototype.validatePlayerForSquadParameters = function (clubname, cityname, squadname, season, playeremail, targetyear, squadkey, callback) {
            var thismodule = this;
            thismodule.checkNotNullOrEmpty(clubname, 'clubname', errTo(callback, function () {
                thismodule.checkNotNullOrEmpty(cityname, 'cityname', errTo(callback, function () {
                    thismodule.checkNotNullOrEmpty(squadname, 'squadname', errTo(callback, function () {
                        thismodule.checkNotNullOrEmpty(season, 'season', errTo(callback, function () {
                            thismodule.checkNotNullOrEmpty(playeremail, 'playeremail', errTo(callback, function () {
                                thismodule.checkEmailAddress(playeremail, 'playeremail', errTo(callback, function () {
                                    thismodule.checkPlayerAge(thismodule, squadkey, playeremail, clubname, cityname, squadname, season, targetyear, errTo(callback, callback));
                                }), 'The player email is invalid');
                            }));
                        }));
                    }));
                }));
            }));
        };
        SquadManagementService.prototype.checkPlayerAge = function (thismodule, squadkey, playeremail, clubname, cityname, squadname, season, targetyear, callback) {
            var playerAgeChecker = thismodule.comparePlayerAgeWithRulesForPlayerAgesAndSquads;
            var overAgeChecker = thismodule.isPlayerRightAgeForOverAgeSquad;
            var underAgeChecker = thismodule.isPlayerRightAgeForUnderAgeSquad;
            thismodule._players.get(clubname + '~' + cityname + '~' + playeremail, errTo(callback, function (playervalue) {
                thismodule._squads.get(squadkey, errTo(callback, function (squadvalue) {
                    playerAgeChecker(targetyear, playervalue.dob, squadvalue.agelimit, overAgeChecker, underAgeChecker, callback);
                }));
            }));
        };
        SquadManagementService.prototype.comparePlayerAgeWithRulesForPlayerAgesAndSquads = function (targetyear, playersdob, squadagelimit, isPlayerRightAgeForOverAgeSquad, isPlayerRightAgeForUnderAgeSquad, callback) {
            if (!targetyear)
                targetyear = new Date(Date.now()).getFullYear();
            var playerdob = new Date(playersdob);
            var playerage = targetyear - playerdob.getFullYear();
            isPlayerRightAgeForOverAgeSquad(squadagelimit, playerage, errTo(callback, function () {
                isPlayerRightAgeForUnderAgeSquad(squadagelimit, playerage, errTo(callback, callback));
            }));
        };
        SquadManagementService.prototype.isPlayerRightAgeForOverAgeSquad = function (squadagelimit, playerage, callback) {
            var prefix = 'over';
            var ageLimitYears;
            if (squadagelimit.substring(0, prefix.length) === prefix) {
                ageLimitYears = Number(squadagelimit.substring(prefix.length).trim());
                if (playerage < ageLimitYears) {
                    return callback(new AgeLimitError('Player does not qualify for the squad due to being underaged'));
                }
            }
            callback();
        };
        SquadManagementService.prototype.isPlayerRightAgeForUnderAgeSquad = function (squadagelimit, playerage, callback) {
            var prefix = 'under';
            var ageLimitYears;
            if (squadagelimit.substring(0, prefix.length) === prefix) {
                ageLimitYears = Number(squadagelimit.substring(prefix.length).trim());
                if (playerage > ageLimitYears) {
                    return callback(new AgeLimitError('Player does not qualify for the squad due to being over age'));
                }
            }
            callback();
        };
        return SquadManagementService;
    })(servicebase.Service.ServiceBase);
    Service.SquadManagementService = SquadManagementService;
})(Service = exports.Service || (exports.Service = {}));
module.exports = Service.SquadManagementService;
//# sourceMappingURL=SquadManagementService.js.map