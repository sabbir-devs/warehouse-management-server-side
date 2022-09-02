function verifyJWT(req, res, next) {
    const autHeader = req.headers.authorization;
    if (!autHeader) {
      return res.status(401).send({ message: "UnAuthorized access" });
    }
    const token = autHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      req.decoded = decoded;
      next();
    });
  }

module.exports = verifyJWT;