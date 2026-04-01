const { Order, OrderItem, Cart, Product, Payment, sequelize } = require("../models");

const snap = require("../helpers/midtrans");
const crypto = require("crypto");

class OrderController {
  static async checkout(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { id: userId, email } = req.user;
      const { paymentMethod } = req.body;

      // Get cart
      const carts = await Cart.findAll({
        where: { UserId: userId },
        include: [Product],
        transaction: t
      });

      if (!carts.length) {
        throw { name: "BadRequest", message: "Cart is empty" };
      }

      // 1. FINAL STOCK VALIDATION & TOTAL CALCULATION
      let totalPrice = 0;
      for (const cart of carts) {
        if (cart.qty > cart.Product.qty) {
          throw { 
            name: "BadRequest", 
            message: `Maaf, stok ${cart.Product.name} tidak mencukupi (Tersisa: ${cart.Product.qty})` 
          };
        }
        totalPrice += cart.qty * cart.Product.price;
      }

      // 2. CREATE ORDER
      const order = await Order.create({
        UserId: userId,
        totalPrice,
        status: "pending",
        paymentMethod,
      }, { transaction: t });

      // 3. CREATE ORDER ITEMS & DECREMENT STOCK
      const orderItems = [];
      for (const cart of carts) {
        orderItems.push({
          OrderId: order.id,
          ProductId: cart.ProductId,
          qty: cart.qty,
          price: cart.Product.price,
          subtotal: cart.qty * cart.Product.price,
        });

        // DECREMENT PRODUCT QTY
        await Product.decrement("qty", {
          by: cart.qty,
          where: { id: cart.ProductId },
          transaction: t
        });
      }

      await OrderItem.bulkCreate(orderItems, { transaction: t });

      // 4. CREATE PAYMENT
      await Payment.create({
        OrderId: order.id,
        method: paymentMethod,
        status: "pending",
        amount: totalPrice,
      }, { transaction: t });

      // CLEAR CART
      await Cart.destroy({ where: { UserId: userId }, transaction: t });

      // MIDTRANS TRANSACTION
      const midtransId = `ORD-${order.id}-${Date.now()}`;
      const parameter = {
        transaction_details: {
          order_id: midtransId,
          gross_amount: totalPrice,
        },
        customer_details: {
          email,
        },
      };

      const transaction = await snap.createTransaction(parameter);

      // COMMIT TRANSACTION
      await t.commit();

      res.status(201).json({
        message: "Checkout success",
        orderId: order.id,
        snapToken: transaction.token,
        redirect_url: transaction.redirect_url,
      });
    } catch (error) {
      // ROLLBACK TRANSACTION ON ERROR
      await t.rollback();
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
      console.log("[Midtrans Webhook] Incoming Notification:", JSON.stringify(notification, null, 2));

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
        console.error("[Midtrans Webhook] Invalid Signature! Expected:", signature_key, "Calculated:", hash);
        throw { name: "Unauthorized", message: "Invalid signature" };
      }

      console.log("[Midtrans Webhook] Signature verified for order:", order_id);

      // MIDTRANS WEBHOOK: Handle prefixed IDs
      const dbOrderId = order_id.includes("-") ? order_id.split("-")[1] : order_id;
      const order = await Order.findByPk(dbOrderId);

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

      console.log(`[Midtrans Webhook] Order ${order.id} status updated to:`, orderStatus);

      res.status(200).json({ message: "Webhook processed" });
    } catch (error) {
      next(error);
    }
  }

  static async payOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;

      const order = await Order.findByPk(id);

      if (!order) {
        throw { name: "NotFound", message: "Order not found" };
      }

      // 🔐 ownership check
      if (order.UserId !== userId) {
        throw { name: "Forbidden", message: "Not authorized" };
      }

      if (order.status !== "pending") {
        throw { name: "BadRequest", message: "Order already processed" };
      }

      const midtransId = `ORD-${order.id}-${Date.now()}`;
      const parameter = {
        transaction_details: {
          order_id: midtransId,
          gross_amount: order.totalPrice,
        },
      };

      const transaction = await snap.createTransaction(parameter);

      res.status(200).json({
        snapToken: transaction.token,
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelOrder(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { id: userId } = req.user;

      const order = await Order.findByPk(id, {
        include: [OrderItem],
        transaction: t
      });

      if (!order) {
        throw { name: "NotFound", message: "Order not found" };
      }

      if (order.UserId !== userId) {
        throw { name: "Forbidden", message: "Not authorized" };
      }

      if (order.status !== "pending") {
        throw { name: "BadRequest", message: "Only pending orders can be cancelled" };
      }

      // 1. Update Order Status
      await order.update({ status: "failed" }, { transaction: t });

      // 2. Update Payment Status (if exists)
      await Payment.update(
        { status: "failed" },
        { where: { OrderId: order.id }, transaction: t }
      );

      // 3. RESTOCK: Return items to product qty
      for (const item of order.OrderItems) {
        await Product.increment("qty", {
          by: item.qty,
          where: { id: item.ProductId },
          transaction: t
        });
      }

      await t.commit();
      res.status(200).json({ message: `Order #${id} cancelled and stock restored` });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }
}

module.exports = OrderController;
