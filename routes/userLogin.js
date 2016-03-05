'use strict';
var Flash = require("./flash");
var UserLogin = (function () {
    function UserLogin(_ums) {
        var _this = this;
        this._ums = _ums;
        this.post = function (req, res) {
            var flash = new Flash();
            var username = req.body.username;
            var password = req.body.password;
            _this._ums.LoginUser(username, password, function (err, reslogin) {
                if (err) {
                    flash.type = 'alert-danger';
                    flash.messages = [{ msg: err.message }];
                    res.render('login', { flash: flash });
                }
                else if (reslogin.loggedIn) {
                    req.session.authenticated = true;
                    req.session.user = { email: username };
                    if (req.query && req.query.url) {
                        res.redirect(req.query.url);
                    }
                    else {
                        res.redirect('dashboard');
                    }
                }
                else {
                    flash.type = 'alert-info';
                    flash.messages = [{ msg: 'Login failed.  You may need to still verify your account or incorrect username/password was entered' }];
                    res.render('login', { flash: flash });
                }
            });
        };
        this.get = function (req, res) {
            res.render('login');
        };
    }
    return UserLogin;
})();
exports.UserLogin = UserLogin;
module.exports = UserLogin;
//# sourceMappingURL=userLogin.js.map