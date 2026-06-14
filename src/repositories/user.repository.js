import User from "../models/user.js";
import { Saved } from "../models/saved.js";

const fetchUserByFilter = async (options) => {
  const { userId, name, sortBy, limit = 10, page = 1, show = "" } = options;

  const filter = {};

  if (show === "admin") {
    filter.role = "admin";
  } else if (show === "user") {
    filter.role = "user";
  } else {
    filter.role = { $ne: "admin" };
  }

  if (name) {
    filter.name = { $regex: name, $options: "i" };
  }

  if (userId) {
    filter._id = userId;
  }

  // Build sortObj — NOT reassigning sortBy
  let sortObj = {};
  switch (sortBy) {
    case "answers":
      sortObj = { "stats.answers": -1 };
      break;
    case "questions":
      sortObj = { "stats.questions": -1 };
      break;
    case "reputation":
      sortObj = { reputation: -1 };
      break;
    case "newest":
      sortObj = { createdAt: -1 };
      break;
    case "name":
      sortObj = { name: 1 }; // alphabetical
      break;
    default:
      sortObj = { reputation: -1 }; // default: top reputation
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    User.countDocuments(filter),
  ]);

  return { users, total, page: Number(page), limit: Number(limit) };
};

const fetchSavedQuestion = async (userId) => {
  const getQuestion = await await Saved.find({ user: userId }).populate({
    path: "question",
    select: "title _id tags createdAt",
    populate: [
      {
        path: "tags",
      },
      {
        path: "user",
        select: "-password -email -role",
      },
    ],
  });

  return getQuestion;
};

export { fetchUserByFilter, fetchSavedQuestion };
