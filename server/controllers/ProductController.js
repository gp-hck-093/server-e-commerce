const { Product, Category, Brand } = require("../models");
const { Op } = require("sequelize");

class ProductController {
  static async getAllProducts(req, res, next) {
    try {
      const { search, sort, limit = 10, page = 1, category, brand } = req.query;

      const limitNum = parseInt(limit);
      const pageNum = parseInt(page);

      // WHERE FILTER
      let where = {};

      if (category) {
        where.CategoryId = +category;
      }

      if (brand) {
        where.BrandId = +brand;
      }

      // SEARCH
      if (search) {
        where.name = {
          [Op.iLike]: `%${search}%`,
        };
      }

      // SORT
      const allowedSort = ["price", "name", "createdAt"];

      let order = [["id", "ASC"]]; // default

      if (sort) {
        const direction = sort.startsWith("-") ? "DESC" : "ASC";
        const field = sort.startsWith("-") ? sort.slice(1) : sort;

        if (allowedSort.includes(field)) {
          order = [[field, direction]];
        }
      }

      // QUERY OPTION
      const option = {
        where,
        limit: limitNum,
        offset: limitNum * (pageNum - 1),
        order,
        attributes: ["id", "name", "price", "qty", "imageUrl"],
        include: [
          {
            model: Category,
            attributes: ["id", "name"],
          },
          {
            model: Brand,
            attributes: ["id", "name"],
          },
        ],
      };

      // QUERY
      const { count, rows } = await Product.findAndCountAll(option);

      // RESPONSE
      const response = {
        page: pageNum,
        totalData: count,
        totalPage: Math.ceil(count / limitNum),
        dataPerPage: limitNum,
        data: rows,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req, res, next) {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id, {
        include: [
          {
            model: Category,
            attributes: ["id", "name"],
          },
          {
            model: Brand,
            attributes: ["id", "name"],
          },
        ],
      });

      if (!product) {
        throw { name: "NotFound", message: "Product not found" };
      }

      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;
