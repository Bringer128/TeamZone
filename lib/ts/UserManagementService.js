'use strict';
var assert = require('assert');
var Service;
(function (Service) {
    var UserManagementService = (function () {
        function UserManagementService(_users, _crypt, _tokenizer, _emailsender) {
            var _this = this;
            this._users = _users;
            this._crypt = _crypt;
            this._tokenizer = _tokenizer;
            this._emailsender = _emailsender;
            this.LoginUser = function (email, password, callback) {
                var crypt = _this._crypt;
                _this._users.get(email, function (err, value) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        if (!value.confirmed)
                            callback(new Error('User has yet to be confirmed'));
                        else {
                            crypt.compare(password, value.password, function (err, res) {
                                if (err)
                                    callback(err);
                                else if (res)
                                    callback(undefined, { firstname: value.firstname, surname: value.surname, email: email, loggedIn: true });
                                else
                                    callback(new Error('Incorrect Login Details Entered, please check your email and/or password'));
                            });
                        }
                    }
                });
            };
            this.RegisterUser = function (email, password, callback) {
                var crypt = _this._crypt;
                var tokenizer = _this._tokenizer;
                var users = _this._users;
                var emailsender = _this._emailsender;
                users.get(email, function (err, value) {
                    if (err && err.notFound) {
                        crypt.hash(password, 10, function (err, hash) {
                            if (err)
                                callback(err);
                            else {
                                var token;
                                try {
                                    tokenizer = require('token');
                                    token = tokenizer.generate(email);
                                }
                                catch (err) {
                                    callback(new Error('An error occured generating the unique user token for email address: ' + email + '. Error from tokenizer: ' + err.message));
                                    return;
                                }
                                users.put(email, { password: hash, email: email, token: token }, function (err) {
                                    if (err)
                                        callback(err);
                                    else {
                                        emailsender.send(email, token, function (err) {
                                            if (err) {
                                                users.del(email, { sync: true }, function (err) {
                                                    if (err)
                                                        callback(new Error('Failed to send the verification email and rolling back on the user failed as well.'));
                                                    else
                                                        callback(new Error('Failed to send the verification email'));
                                                });
                                            }
                                            else {
                                                callback();
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                    else if (err) {
                        callback(err);
                    }
                    else {
                        callback(new Error("User already exists"));
                    }
                });
            };
            this.ConfirmRegisterUser = function (email, token, callback) {
                var tokenizer = _this._tokenizer;
                var users = _this._users;
                users.get(email, function (err, value) {
                    if (err && err.notFound)
                        callback(new Error('The user ' + email + ' is not present in the database'));
                    else if (err)
                        callback(new Error('A failure occurred trying to retrieve details for ' + email));
                    else if (value.confirmed)
                        callback(new Error(email + ' is already registered. Please login to access to the site.'));
                    else {
                        var isValidToken = false;
                        try {
                            isValidToken = tokenizer.verify(email, token);
                        }
                        catch (err) {
                            callback(new Error('Confirmation token has failed validation. Appears an error occurred.'));
                            return;
                        }
                        if (isValidToken) {
                            if (value.token !== token)
                                callback(new Error('Confirmation token has failed validation. It has changed from the stored value.'));
                            else
                                users.put(email, { password: value.password, email: email, token: token, confirmed: true }, function (err) {
                                    if (err)
                                        callback(new Error('A failure occurred trying to save confirmation for ' + email));
                                    else
                                        callback();
                                });
                        }
                        else {
                            callback(new Error('Confirmation token has failed validation. It may have been modified.'));
                        }
                    }
                });
            };
        }
        return UserManagementService;
    })();
    Service.UserManagementService = UserManagementService;
})(Service = exports.Service || (exports.Service = {}));
module.exports = Service.UserManagementService;
//# sourceMappingURL=UserManagementService.js.map