const Notification = require("../models/Notification");

async function createNotification({ title, content, type = "chung", user = null, entityId, action, image }) {
  return Notification.create({
    title,
    content,
    type,
    user,
    entityId,
    action,
    image,
    target: "all",
    sentAt: new Date(),
  });
}

module.exports = { createNotification };
