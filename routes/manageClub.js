'use strict';
var ManageClub = (function () {
    function ManageClub(_cms) {
        this._cms = _cms;
        this.post = function (req, res) {
            res.write('Do be done');
        };
        this.get = function (req, res) {
            res.render('manageClub');
        };
    }
    return ManageClub;
})();
exports.ManageClub = ManageClub;
module.exports = ManageClub;
//# sourceMappingURL=manageClub.js.map