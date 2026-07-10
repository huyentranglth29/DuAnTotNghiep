const createCrudController = (Model, options = {}) => {
  const populate = options.populate || "";

  const applyPopulate = (query) => {
    if (!populate) {
      return query;
    }

    return query.populate(populate);
  };

  const getAll = async (req, res, next) => {
    try {
      const items = await applyPopulate(Model.find(req.query)).sort({ createdAt: -1 });
      res.json(items);
    } catch (error) {
      next(error);
    }
  };

  const getById = async (req, res, next) => {
    try {
      const item = await applyPopulate(Model.findById(req.params.id));

      if (!item) {
        return res.status(404).json({ message: `${Model.modelName} not found` });
      }

      res.json(item);
    } catch (error) {
      next(error);
    }
  };

  const create = async (req, res, next) => {
    try {
      const item = await Model.create(req.body);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  };

  const update = async (req, res, next) => {
    try {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
        returnDocument: "after",
        runValidators: true,
      });

      if (!item) {
        return res.status(404).json({ message: `${Model.modelName} not found` });
      }

      res.json(item);
    } catch (error) {
      next(error);
    }
  };

  const remove = async (req, res, next) => {
    try {
      const item = await Model.findByIdAndDelete(req.params.id);

      if (!item) {
        return res.status(404).json({ message: `${Model.modelName} not found` });
      }

      res.json({ message: `${Model.modelName} deleted successfully` });
    } catch (error) {
      next(error);
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

module.exports = createCrudController;
