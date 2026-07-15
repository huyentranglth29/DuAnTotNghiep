const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const success = (res, message, data, pagination, statusCode = 200) => {
  const body = {
    success: true,
    message,
    data,
  };

  if (pagination) {
    body.pagination = pagination;
  }

  return res.status(statusCode).json(body);
};

const error = (res, statusCode, message, errors = null) =>
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });

const sanitize = (doc) => {
  if (!doc) return doc;

  if (Array.isArray(doc)) {
    return doc.map(sanitize);
  }

  if (doc instanceof Date) {
    return doc;
  }

  if (doc instanceof mongoose.Types.ObjectId || doc._bsontype === "ObjectId") {
    return doc;
  }

  if (typeof doc !== "object") {
    return doc;
  }

  const data = doc.toObject ? doc.toObject() : { ...doc };
  delete data.password;

  Object.keys(data).forEach((key) => {
    data[key] = sanitize(data[key]);
  });

  return data;
};

const getKeywordFields = (Model, configuredFields = []) => {
  if (configuredFields.length) {
    return configuredFields;
  }

  return Object.entries(Model.schema.paths)
    .filter(([, path]) => path.instance === "String")
    .map(([field]) => field);
};

const buildFilter = (Model, query, keywordFields) => {
  const { keyword, status } = query;
  const filter = {};

  if (status !== undefined && status !== "") {
    filter.status = status;
  }

  if (keyword) {
    const fields = getKeywordFields(Model, keywordFields);
    filter.$or = fields.map((field) => ({
      [field]: { $regex: keyword, $options: "i" },
    }));
  }

  return filter;
};

const normalizeSort = (sort) => {
  if (!sort) {
    return { createdAt: -1 };
  }

  if (sort.startsWith("-")) {
    return { [sort.slice(1)]: -1 };
  }

  return { [sort]: 1 };
};

const createAdminCrudController = (Model, options = {}) => {
  const populate = options.populate || "";
  const keywordFields = options.keywordFields || [];

  const applyPopulate = (query) => {
    if (!populate) return query;
    return query.populate(populate);
  };

  const getAll = async (req, res) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
      const skip = (page - 1) * limit;
      const filter = buildFilter(Model, req.query, keywordFields);
      const sort = normalizeSort(req.query.sort);

      const [items, total] = await Promise.all([
        applyPopulate(Model.find(filter)).sort(sort).skip(skip).limit(limit),
        Model.countDocuments(filter),
      ]);

      return success(res, "Lấy danh sách thành công", sanitize(items), {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      return error(res, 500, err.message);
    }
  };

  const getById = async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return error(res, 400, "ID không hợp lệ");
      }

      const item = await applyPopulate(Model.findById(req.params.id));
      if (!item) {
        return error(res, 404, `${Model.modelName} không tồn tại`);
      }

      return success(res, "Lấy chi tiết thành công", sanitize(item));
    } catch (err) {
      return error(res, 500, err.message);
    }
  };

  const create = async (req, res) => {
    try {
      const item = new Model(req.body);
      await item.save();
      const created = await applyPopulate(Model.findById(item._id));
      return success(res, "Tạo mới thành công", sanitize(created), null, 201);
    } catch (err) {
      if (err.name === "ValidationError" || err.code === 11000) {
        return error(res, 400, err.message, err.errors || err.keyValue);
      }
      return error(res, 500, err.message);
    }
  };

  const update = async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return error(res, 400, "ID không hợp lệ");
      }

      const item = await Model.findById(req.params.id);
      if (!item) {
        return error(res, 404, `${Model.modelName} không tồn tại`);
      }

      item.set(req.body);
      await item.save();
      const updated = await applyPopulate(Model.findById(item._id));

      return success(res, "Cập nhật thành công", sanitize(updated));
    } catch (err) {
      if (err.name === "ValidationError" || err.code === 11000) {
        return error(res, 400, err.message, err.errors || err.keyValue);
      }
      return error(res, 500, err.message);
    }
  };

  const remove = async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return error(res, 400, "ID không hợp lệ");
      }

      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) {
        return error(res, 404, `${Model.modelName} không tồn tại`);
      }

      return success(res, "Xóa thành công", sanitize(item));
    } catch (err) {
      return error(res, 500, err.message);
    }
  };

  return {
    getAll,
    getById,
    create,
    update,
    remove,
  };
};

module.exports = createAdminCrudController;
