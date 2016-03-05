'use strict';
var Flash = require("./flash");
var AddSquadPlayer = (function () {
    function AddSquadPlayer(_sms) {
        var _this = this;
        this._sms = _sms;
        this.post = function (req, res) {
            res.write('Do be done');
        };
        this.get = function (req, res) {
            var clubname = 'Western Knights';
            var cityname = 'Perth';
            var squadname = req.body.squadname;
            var season = req.body.season;
            var sms = _this._sms;
            var flash = new Flash();
            sms.GetPlayersForClubNotInSquad(clubname, cityname, squadname, season, function (err, clubplayers) {
                if (err) {
                    flash.type = 'alert-danger';
                    flash.messages = [{ msg: err.message }];
                    res.render('addSquadPlayer', { flash: flash });
                }
                else {
                    sms.GetPlayersForSquad(clubname, cityname, squadname, season, function (err, squadplayers) {
                        if (err) {
                            flash.type = 'alert-danger';
                            flash.messages = [{ msg: err.message }];
                            res.render('addSquadPlayer', { flash: flash });
                        }
                        else {
                            res.render('addSquadPlayer', {
                                clubplayers: clubplayers,
                                squadplayers: squadplayers
                            });
                        }
                    });
                }
            });
        };
    }
    return AddSquadPlayer;
})();
exports.AddSquadPlayer = AddSquadPlayer;
module.exports = AddSquadPlayer;
//# sourceMappingURL=addSquadPlayer.js.map