const { v4: uuidv4 } = require('uuid');

const requestIdMiddleware = (req, res, next) => {
    // Check if request already has an ID (e.g. from a proxy)
    const requestId = req.get('x-request-id') || uuidv4();

    // Attach to request object
    req.id = requestId;

    // Set response header
    res.setHeader('x-request-id', requestId);

    next();
};

module.exports = requestIdMiddleware;
