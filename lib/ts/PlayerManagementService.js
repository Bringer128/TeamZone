'use strict';
var moment = require('moment');
var Service;
(function (Service) {
    var PlayerManagementService = (function () {
        function PlayerManagementService(_players) {
            var _this = this;
            this._players = _players;
            this.AddPlayer = function (clubname, cityname, firstname, lastname, dob, address, suburb, postcode, phone, email, callback) {
                if (_this.isValidDate(dob, callback)) {
                    var key = _this.keyMaker(clubname, cityname, email);
                    var players = _this._players;
                    players.get(key, function (err, value) {
                        if (err && !err.notFound) {
                            callback(err, null);
                        }
                        else {
                            if (value) {
                                callback(new Error('Cannot add this player, the player already exists'));
                            }
                            else {
                                players.put(key, { firstname: firstname, lastname: lastname, dob: dob, address: address, suburb: suburb, postcode: postcode, phone: phone, email: email }, { sync: true }, function (err) {
                                    if (err) {
                                        callback(err);
                                    }
                                    else {
                                        callback();
                                    }
                                });
                            }
                        }
                    });
                }
            };
            this.GetPlayer = function (clubname, cityname, email, callback) {
                _this._players.get(_this.keyMaker(clubname, cityname, email), function (err, value) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        var playerObject = {
                            clubname: clubname,
                            cityname: cityname,
                            firstname: value.firstname,
                            lastname: value.lastname,
                            dob: value.dob,
                            address: value.address,
                            suburb: value.suburb,
                            postcode: value.postcode,
                            phone: value.phone,
                            email: value.email
                        };
                        callback(undefined, playerObject);
                    }
                });
            };
        }
        PlayerManagementService.prototype.keyMaker = function (clubname, cityname, email) {
            return "".concat(clubname, "~", cityname, "~", email);
        };
        PlayerManagementService.prototype.isValidDate = function (d, callback) {
            var validDateFormats = ['DD MMM YYYY', 'D MMM YYYY', 'DD-MM-YYYY', 'D/MM/YYYY', 'D/M/YYYY', 'DD-MMM-YYYY', 'YYYY-MM-DD'], i = 0, len = validDateFormats.length, isValid = false;
            for (; i < len;) {
                if ((moment(d, validDateFormats[i], true)).isValid()) {
                    isValid = true;
                    i = len;
                }
                i++;
            }
            if (!isValid) {
                callback(new Error('The date is in an incorrect format'));
            }
            return isValid;
        };
        return PlayerManagementService;
    })();
    Service.PlayerManagementService = PlayerManagementService;
})(Service = exports.Service || (exports.Service = {}));
module.exports = Service.PlayerManagementService;
//# sourceMappingURL=PlayerManagementService.js.map