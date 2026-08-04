const Payment = require("../models/Payment");
require("../models/User");
require("../models/QuickBooking");

const effectiveStatus = (payment) => {
  if (
    payment.status === "cho_thanh_toan" &&
    payment.expiresAt &&
    new Date(payment.expiresAt).getTime() <= Date.now()
  ) {
    return "het_han";
  }
  return payment.status;
};

const listPayments = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      Payment.find()
        .populate("user", "fullName email phone")
        .populate("booking", "code status checkedIn")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(),
    ]);

    const data = rows.map((payment) => ({
      ...payment,
      status: effectiveStatus(payment),
    }));

    return res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { listPayments };
