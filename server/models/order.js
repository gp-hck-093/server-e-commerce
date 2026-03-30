"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Order.belongsTo(models.User, { foreignKey: "UserId" });
      Order.hasMany(models.OrderItem, { foreignKey: "OrderId" });
      Order.hasOne(models.Payment, { foreignKey: "OrderId" });
    }
  }
  Order.init(
    {
      totalPrice: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Total price is required" },
          isInt: { msg: "Total price must be a number" },
          min: {
            args: [1],
            msg: "Price must be greater than 0",
          },
        },
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
        validate: {
          notEmpty: { msg: "Status is required" },
          notNull: { msg: "Status is required" },
        },
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Payment method is required" },
          notNull: { msg: "Payment method is required" },
        },
      },
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "User is required" },
          isInt: { msg: "User must be valid" },
        },
      },
    },
    {
      sequelize,
      modelName: "Order",
    },
  );
  return Order;
};
