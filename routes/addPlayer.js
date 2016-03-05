'use strict';
var Flash = require("./flash");
var AddPlayer = (function () {
    function AddPlayer(_pms) {
        var _this = this;
        this._pms = _pms;
        this.post = function (req, res) {
            req.checkBody('clubname', 'Club is required').notEmpty();
            req.checkBody('cityname', 'City is required').notEmpty();
            req.checkBody('firstname', 'First Name is required').notEmpty();
            req.checkBody('lastname', 'Last Name is required').notEmpty();
            req.checkBody('dob', 'Date of Birth is required').notEmpty();
            req.checkBody('address', 'Address is required').notEmpty();
            req.checkBody('suburb', 'Suburb is required').notEmpty();
            req.checkBody('postcode', 'Postcode is required').notEmpty();
            req.checkBody('phone', 'Phone is required').notEmpty();
            req.checkBody('email', 'Email is required').notEmpty();
            req.checkBody('email', 'Email does not appear to be valid').isEmail();
            var flash = new Flash(), errors = req.validationErrors();
            if (errors && errors.length > 0) {
                var errorCount = errors.length;
                var msgs = [];
                for (var i = 0; i < errorCount; i++) {
                    msgs.push({ msg: errors[i].msg });
                }
                flash.type = 'alert-danger';
                flash.messages = msgs;
                res.render('addPlayer', { flash: flash });
            }
            else {
                _this._pms.AddPlayer(req.body.clubname, req.body.cityname, req.body.firstname, req.body.lastname, req.body.dob, req.body.address, req.body.suburb, req.body.postcode, req.body.phone, req.body.email, function (err) {
                    if (err) {
                        flash.type = 'alert-danger';
                        flash.messages = [{ msg: err.message }];
                        res.render('addPlayer', { flash: flash });
                    }
                    else {
                        flash.type = 'alert-success';
                        flash.messages = [{ msg: 'Player has been successfully added.' }];
                        res.render('addPlayer', { flash: flash });
                    }
                });
            }
        };
        this.get = function (req, res) {
            res.render('addPlayer', { title: 'Add Player' });
        };
    }
    return AddPlayer;
})();
exports.AddPlayer = AddPlayer;
module.exports = AddPlayer;
//# sourceMappingURL=addPlayer.js.map