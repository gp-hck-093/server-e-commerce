const { Cart } = require("../models");

const authorization = async (req, res, next) => {
  try {
    const { id: cartId } = req.params;
    const { id: userId } = req.user;

    const cart = await Cart.findByPk(cartId);

    if (!cart) {
      throw { name: "NotFound", message: "Cart not found" };
    }

    if (cart.UserId !== userId) {
      throw { name: "Forbidden", message: "You are not authorized" };
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authorization;
