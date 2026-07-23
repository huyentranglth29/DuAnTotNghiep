const Ticket = require("../models/Ticket");
const createCrudController = require("./crudController");

const crud = createCrudController(Ticket, { populate: "booking showtime seat" });

const getAll = async (req, res, next) => {
  try {
    const keyword = String(req.query.keyword || "").trim();
    const status = String(req.query.status || "").trim();
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
    const sort = String(req.query.sort || "-createdAt");

    const filter = {};
    if (status) {
      filter.status = status;
    }

    if (keyword) {
      filter.code = { $regex: keyword, $options: "i" };
    }

    const items = await Ticket.find(filter)
      .populate("booking showtime seat")
      .sort(sort)
      .limit(limit);

    return res.json(items);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  ...crud,
  getAll,
};
