'use strict';
var Flash = require("./flash");
var UserRegister = (function () {
    function UserRegister(_ums) {
        var _this = this;
        this._ums = _ums;
        this.post = function (req, res) {
            req.checkBody('password', 'Password is required').notEmpty();
            req.checkBody('password', 'Password length needs to be at least 8 characters').len(8);
            req.checkBody('email', 'Email is required').notEmpty();
            req.checkBody('email', 'Email does not appear to be valid').isEmail();
            var errors = req.validationErrors();
            var flash = new Flash();
            var ums = _this._ums;
            if (errors && errors.length > 0) {
                var errorCount = errors.length;
                var msgs = [];
                for (var i = 0; i < errorCount; i++) {
                    msgs.push({ msg: errors[i].msg });
                }
                flash.type = 'alert-danger';
                flash.messages = msgs;
                res.render('register', { flash: flash });
            }
            else {
                var username = req.body.email;
                var password = req.body.password;
                ums.RegisterUser(username, password, function (err, resregister) {
                    if (err) {
                        flash.type = 'alert-danger';
                        flash.messages = [{ msg: err.message }];
                        res.render('register', { flash: flash });
                    }
                    else {
                        flash.type = 'alert-success';
                        flash.messages = [{ msg: 'Please check your email to verify your registration. Then you will be ready to log in!' }];
                        res.render('login', { flash: flash });
                    }
                });
            }
        };
        this.get = function (req, res) {
            res.render('register');
        };
    }
    return UserRegister;
})();
exports.UserRegister = UserRegister;
module.exports = UserRegister;
//# sourceMappingURL=userRegister.js.map