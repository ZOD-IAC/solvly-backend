import { Question } from '../models/question.js';
import Tags from '../models/tags.js';

const findByUser = async (userId, options) => {
  const { page = 1, limit = 10 } = options;
  return await Question.find({ user: userId })
    .populate('tags')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

const findByFilter = async (options) => {
  const { tags, title, sort, limit = 15, user, noAnswers, page = 1 } = options;
  const filter = {};

  // Title search
  if (title) {
    filter.title = { $regex: title, $options: 'i' };
  }

  // Filter by user
  if (user) {
    filter.user = user;
  }

  // Tag filtering
  if (tags && tags.length) {
    filter.tags = { $all: tags };
  }

  // No answers yet
  if (noAnswers === 'true') {
    filter.answerCount = { $eq: 0 };
    // OR if you store answers as array:
    // filter.answers = { $size: 0 };
  }

  // Sort logic
  let sortObj = {};
  switch (sort) {
    case 'newest':
      sortObj = { createdAt: -1 };
      break;
    case 'active':
      sortObj = { updatedAt: -1 };
      break;
    case 'votes':
      sortObj = { voteCount: -1 };
      break;
    case 'views':
      sortObj = { views: -1 };
      break;
    case 'unanswered':
      filter.answersCount = { $eq: 0 };
      sortObj = { createdAt: -1 };
      break;
    default:
      sortObj = { createdAt: -1 };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [questions, total] = await Promise.all([
    Question.find(filter)
      .populate(['tags', 'user'])
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Question.countDocuments(filter),
  ]);

  return { questions, total, page: Number(page), limit: Number(limit) };
};

const findTagsbyFilter = async (options) => {
  const { limit, name, tagId, sort = 'popular' } = options;

  let filter = {};

  if (name) {
    filter.tagName = { $regex: name, $options: 'i' };
  }

  if (tagId) {
    filter._id = tagId;
  }

  let sortObj = {};
  switch (sort) {
    case 'newest':
      sortObj = { createdAt: 1 };
      break;
    case 'popular':
      sortObj = { usageCount: -1 };
      break;
    case 'oldest':
      sortObj = { createdAt: -1 };
      break;
    default:
      sortObj = { createdAt: 1 };
      break;
  }

  return await Tags.find(filter).sort(sortObj).limit(limit).lean();
};

export { findByUser, findTagsbyFilter, findByFilter };
