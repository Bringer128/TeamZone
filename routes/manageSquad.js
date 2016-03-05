'use strict';
var ManageSquad = (function () {
    function ManageSquad(_sms) {
        this._sms = _sms;
        this.post = function (req, res) {
        };
        this.get = function (req, res) {
            res.render('manageSquad');
        };
    }
    return ManageSquad;
})();
exports.ManageSquad = ManageSquad;
module.exports = ManageSquad;
//# sourceMappingURL=manageSquad.js.map