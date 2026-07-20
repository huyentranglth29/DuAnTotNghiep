const NewsEvent = require("../models/NewsEvent");

const listPublished = async (req, res, next) => {
  try {
    const rows = await NewsEvent.find({
      status: "da_dang",
      publishDate: {$lte: new Date()},
    })
      .sort({isFeatured: -1, publishDate: -1})
      .limit(20)
      .lean();
    res.json({success: true, data: rows});
  } catch (error) {
    next(error);
  }
};

const getPublishedById = async (req, res, next) => {
  try {
    const row = await NewsEvent.findOne({_id: req.params.id, status: "da_dang"}).lean();
    if (!row) return res.status(404).json({success: false, message: "Không tìm thấy bài viết"});
    res.json({success: true, data: row});
  } catch (error) {
    next(error);
  }
};

module.exports = {listPublished, getPublishedById};
