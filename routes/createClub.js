'use strict';
var Flash = require("./flash");
var CreateClub = (function () {
    function CreateClub(_cms) {
        var _this = this;
        this._cms = _cms;
        this.post = function (req, res) {
            req.checkBody('clubname', 'Club name is required').notEmpty();
            req.checkBody('cityname', 'City is required').notEmpty();
            req.checkBody('suburbname', 'Suburb is required').notEmpty();
            req.checkBody('fieldname', 'Field is required').notEmpty();
            req.checkBody('adminemail', 'Administrator Email is required').notEmpty();
            req.checkBody('adminemail', 'Administrator Email does not appear to be valid').isEmail();
            var errors = req.validationErrors();
            var flash = new Flash();
            var cms = _this._cms;
            if (errors && errors.length > 0) {
                var errorCount = errors.length;
                var msgs = [];
                for (var i = 0; i < errorCount; i++) {
                    msgs.push({ msg: errors[i].msg });
                }
                flash.type = 'alert-danger';
                flash.messages = msgs;
                res.render('createClub', { flash: flash });
            }
            else {
                var clubname = req.body.clubname;
                var cityname = req.body.cityname;
                var suburbname = req.body.suburbname;
                var fieldname = req.body.fieldname;
                var adminemail = req.body.adminemail;
                cms.CreateClub(clubname, fieldname, suburbname, cityname, adminemail, function (err) {
                    if (err) {
                        flash.type = 'alert-danger';
                        flash.messages = [{ msg: err.message }];
                        res.render('createClub', { flash: flash });
                    }
                    else {
                        flash.type = 'alert-success';
                        flash.messages = [{ msg: 'Club has been successfully created.  You can now manage the club to add teams, squads and players and all the other functions needed to run the club.' }];
                        res.render('manageClub', { flash: flash });
                    }
                });
            }
        };
        this.get = function (req, res) {
            res.render('createClub');
        };
    }
    return CreateClub;
})();
exports.CreateClub = CreateClub;
module.exports = CreateClub;
//# sourceMappingURL=createClub.js.map