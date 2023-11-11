const authGuardMiddleware = async (req, res, next) => {
    next();
}

module.exports = authGuardMiddleware;