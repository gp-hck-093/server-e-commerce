const { Cart, Product } = require("../models");

class CartController {
  static async getCart(req, res, next) {
    try {
      const { id: userId } = req.user;

      const carts = await Cart.findAll({
        where: { UserId: userId },
        include: [
          {
            model: Product,
            attributes: ["id", "name", "price", "imageUrl", "qty"],
          },
        ],
        order: [["id", "ASC"]],
      });

      res.status(200).json(carts);
    } catch (error) {
      next(error);
    }
  }

  static async addToCart(req, res, next) {
    try {
      const { id: userId } = req.user;
      const { ProductId, qty } = req.body;

      // Check product exists
      const product = await Product.findByPk(ProductId);

      if (!product) {
        throw { name: "NotFound", message: "Product not found" };
      }

      // Check existing cart
      const existingCart = await Cart.findOne({
        where: { UserId: userId, ProductId },
      });

      if (existingCart) {
        // UPDATE qty (no duplicate)
        existingCart.qty += qty || 1;
        await existingCart.save();

        return res.status(200).json({
          message: "Cart updated",
          data: existingCart,
        });
      }

      // Create new cart
      const newCart = await Cart.create({
        UserId: userId,
        ProductId,
        qty: qty || 1,
      });

      res.status(201).json({
        message: "Product added to cart",
        data: newCart,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCart(req, res, next) {
    try {
      const { id } = req.params;
      const { qty } = req.body;

      const cart = await Cart.findByPk(id);

      if (!cart) {
        throw { name: "NotFound", message: "Cart not found" };
      }

      cart.qty = qty;
      await cart.save();

      res.status(200).json({
        message: "Cart updated",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCart(req, res, next) {
    try {
      const { id } = req.params;

      const cart = await Cart.findByPk(id);

      if (!cart) {
        throw { name: "NotFound", message: "Cart not found" };
      }

      await cart.destroy();

      res.status(200).json({
        message: "Cart deleted",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CartController;
