"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Brand extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Brand.hasMany(models.Product, { foreignKey: "BrandId" });
    }
  }
  Brand.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: "Brand already exists" },
        validate: {
          notEmpty: { msg: "Brand is required" },
          notNull: { msg: "Brand is required" },
        },
      },
    },
    {
      sequelize,
      modelName: "Brand",
    },
  );
  return Brand;
};
