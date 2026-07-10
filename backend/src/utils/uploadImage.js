const uploadImage = async (file) => {
  if (!file) {
    return null;
  }

  return file.path || file.filename || null;
};

module.exports = uploadImage;
