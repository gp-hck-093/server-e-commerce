const { Order, OrderItem, Cart, Product, Payment } = require("../models");

const snap = require("../helpers/midtrans");
const crypto = require("crypto");

class OrderController {
  static async checkout(req, res, next) {
    try {
      const { id: userId, email } = req.user;
      const { paymentMethod } = req.body;

      // Get cart
      const carts = await Cart.findAll({
        where: { UserId: userId },
        include: [Product],
      });

      if (!carts.length) {
        throw { name: "BadRequest", message: "Cart is empty" };
      }

      // Calculate total
      let totalPrice = 0;

      const items = carts.map((cart) => {
        const subtotal = cart.qty * cart.Product.price;
        totalPrice += subtotal;

        return {
          ProductId: cart.ProductId,
          qty: cart.qty,
          price: cart.Product.price,
          subtotal,
        };
      });

      // Create Order
      const order = await Order.create({
        UserId: userId,
        totalPrice,
        status: "pending",
        paymentMethod,
      });

      // Create OrderItems
      await OrderItem.bulkCreate(
        items.map((item) => ({
          ...item,
          OrderId: order.id,
        })),
      );

      // Create Payment
      await Payment.create({
        OrderId: order.id,
        method: paymentMethod,
        status: "pending",
        amount: totalPrice,
      });

      // MIDTRANS TRANSACTION
      const parameter = {
        transaction_details: {
          order_id: String(order.id), // IMPORTANT: must be string
          gross_amount: totalPrice,
        },
        customer_details: {
          email,
        },
      };

      const transaction = await snap.createTransaction(parameter);

      // Clear cart
      await Cart.destroy({ where: { UserId: userId } });

      res.status(201).json({
        message: "Checkout success",
        orderId: order.id,
        snapToken: transaction.token,
        redirect_url: transaction.redirect_url,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrders(req, res, next) {
    try {
      const { id: userId } = req.user;

      const orders = await Order.findAll({
        where: { UserId: userId },
        include: [Payment],
        order: [["createdAt", "DESC"]],
      });

      res.status(200).json(orders);
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;

      const order = await Order.findByPk(id, {
        include: [
          {
            model: OrderItem,
            include: [Product],
          },
          Payment,
        ],
      });

      if (!order) {
        throw { name: "NotFound", message: "Order not found" };
      }

      if (order.UserId !== userId) {
        throw { name: "Forbidden" };
      }

      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }

  static async midtransWebhook(req, res, next) {
    try {
      const notification = req.body;

      const {
        order_id,
        status_code,
        gross_amount,
        signature_key,
        transaction_status,
        fraud_status,
      } = notification;

      // VALIDATE SIGNATURE
      const serverKey = process.env.MIDTRANS_SERVER_KEY;

      const hash = crypto
        .createHash("sha512")
        .update(order_id + status_code + gross_amount + serverKey)
        .digest("hex");

      if (hash !== signature_key) {
        throw { name: "Unauthorized", message: "Invalid signature" };
      }

      const order = await Order.findByPk(order_id);

      if (!order) {
        return res.status(200).json({ message: "Order not found" });
      }

      let paymentStatus = "pending";
      let orderStatus = "pending";

      // SUCCESS
      if (
        transaction_status === "capture" ||
        transaction_status === "settlement"
      ) {
        if (transaction_status === "capture" && fraud_status !== "accept") {
          return res.status(200).json({ message: "Fraud detected" });
        }

        paymentStatus = "success";
        orderStatus = "paid";
      }

      // FAILED
      if (transaction_status === "expire" || transaction_status === "cancel") {
        paymentStatus = "failed";
        orderStatus = "failed";
      }

      await Payment.update(
        { status: paymentStatus },
        { where: { OrderId: order.id } },
      );

      await Order.update({ status: orderStatus }, { where: { id: order.id } });

      res.status(200).json({ message: "Webhook processed" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderController;
