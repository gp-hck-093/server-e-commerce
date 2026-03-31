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

      const addQty = parseInt(qty) || 1;

      if (existingCart) {
        // Validation: current cart + new qty should not exceed stock
        if (existingCart.qty + addQty > product.qty) {
          throw { name: "BadRequest", message: `Stock not enough. Only ${product.qty} left.` };
        }
        
        // UPDATE qty
        existingCart.qty += addQty;
        await existingCart.save();

        return res.status(200).json({
          message: "Cart updated",
          data: existingCart,
        });
      }

      // Check if trying to add more than stock for new item
      if (addQty > product.qty) {
        throw { name: "BadRequest", message: `Stock not enough. Only ${product.qty} left.` };
      }

      // Create new cart
      const newCart = await Cart.create({
        UserId: userId,
        ProductId,
        qty: addQty,
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

      const cart = await Cart.findByPk(id, {
        include: [Product]
      });

      if (!cart) {
        throw { name: "NotFound", message: "Cart not found" };
      }

      if (qty > cart.Product.qty) {
        throw { name: "BadRequest", message: `Stock not enough. Only ${cart.Product.qty} left.` };
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
