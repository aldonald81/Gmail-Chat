const isAuthenticated = (req, res, next) => {
  if (req.session.tokens && req.session.tokens.access_token) {
    // User is authenticated, proceed to the next middleware or route handler
    next();
  } else {
    // User is not authenticated, return a 401 Unauthorized error
    res.status(401).json({ error: "User is not authenticated" });
  }
};

module.exports = { isAuthenticated };
