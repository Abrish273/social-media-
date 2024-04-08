const createTokenUser = (user) => {
  return {
    // fullname: user.fullname,
    userId: user._id,
    role: user.role,
    // api_permission: user.api_permission,
  };
};

module.exports = createTokenUser;
