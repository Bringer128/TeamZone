'use strict';
var Flash = require("./flash");
var CreateSquad = (function () {
    function CreateSquad(_sms, _cms) {
        var _this = this;
        this._sms = _sms;
        this._cms = _cms;
        this.post = function (req, res) {
            req.checkBody('clubname', 'Club name is required').notEmpty();
            req.checkBody('cityname', 'City is required').notEmpty();
            req.checkBody('season', 'Season is required').notEmpty();
            req.checkBody('squadname', 'Squad is required').notEmpty();
            req.checkBody('agelimit', 'Age limit is required').notEmpty();
            req.checkBody('adminemail', 'Administrator/Custodian Email is required').notEmpty();
            req.checkBody('adminemail', 'Administrator/Custodian Email does not appear to be valid').isEmail();
            var errors = req.validationErrors();
            var flash = new Flash();
            var sms = _this._sms;
            if (errors && errors.length > 0) {
                var errorCount = errors.length;
                var msgs = [];
                for (var i = 0; i < errorCount; i++) {
                    msgs.push({ msg: errors[i].msg });
                }
                flash.type = 'alert-danger';
                flash.messages = msgs;
                res.render('createSquad', { flash: flash });
            }
            else {
                var clubname = req.body.clubname;
                var cityname = req.body.cityname;
                var season = req.body.season;
                var squadname = req.body.squadname;
                var agelimit = req.body.agelimit;
                var adminemail = req.body.adminemail;
                sms.CreateSquad(clubname, cityname, squadname, season, agelimit, adminemail, function (err) {
                    if (err) {
                        flash.type = 'alert-danger';
                        flash.messages = [{ msg: err.message }];
                        res.render('createSquad', { flash: flash });
                    }
                    else {
                        flash.type = 'alert-success';
                        flash.messages = [{ msg: 'Squad has been successfully created.' }];
                        res.render('manageSquad', { flash: flash });
                    }
                });
            }
        };
        this.get = function (req, res) {
            _this._cms.GetClubs(req.session.user.email, function (err, clubs) {
                if (err && err.notFound) {
                    res.render('notClubAdmin');
                    return;
                }
                if (err) {
                    var flash = new Flash();
                    res.render('createSquad', { flash: flash });
                    return;
                }
                res.render('createSquad', { clubs: clubs || [] });
            });
        };
    }
    return CreateSquad;
})();
exports.CreateSquad = CreateSquad;
module.exports = CreateSquad;
//# sourceMappingURL=createSquad.js.map