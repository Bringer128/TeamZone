'use strict';
var authenticationMiddleware = function (req, res, next) {
    console.log('Request to: ' + req.url + " handled by auth middleware");
    var authenticated = req.session.authenticated;
    if (authenticated) {
        return next();
    }
    res.redirect('/login?url=' + req.url);
};
module.exports = authenticationMiddleware;
//# sourceMappingURL=authenticationMiddleware.js.map