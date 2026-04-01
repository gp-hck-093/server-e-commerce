const { verifyToken } = require("../helpers/jwt");
const { User } = require("../models");

const authentication = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      throw { name: "Unauthorized", message: "Invalid token" };
    }

    const [tokenType, tokenValue] = authorization.split(" ");

    if (tokenType !== "Bearer" || !tokenValue) {
      throw { name: "Unauthorized", message: "Invalid token" };
    }

    const payload = verifyToken(tokenValue);

    const user = await User.findByPk(payload.id);

    if (!user) {
      throw { name: "Unauthorized", message: "Invalid token" };
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};
module.exports = authentication;
