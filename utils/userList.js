export const withoutDeleted = (user) => {
  const obj = user.toObject();
  obj.list = obj.list.filter((item) => item.waifu_id);
  return obj;
};
