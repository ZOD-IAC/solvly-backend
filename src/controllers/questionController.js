import User from '../models/user.js';
import { Question, Vote } from '../models/question.js';
import Tags from '../models/tags.js';
import Answer from '../models/answer.js';
import { VoteOption } from '../utils/Constants.js';
import {
  getQuestionRelatedToFilter,
  getTagsRelatedToFilter,
} from '../services/question.services.js';
import { Saved } from '../models/saved.js';

export const createQuestion = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const { _id: userId } = req.user;

    await Question.create({
      title,
      body: content,
      tags,
      user: userId,
    });

    await Tags.bulkWrite(
      tags.map((tag) => ({
        updateOne: {
          filter: { _id: tag },
          update: { $inc: { usageCount: 1 } },
        },
      })),
    );

    await User.findByIdAndUpdate(userId, { $inc: { 'stats.questions': 1 } });

    res.status(200).json({
      message: 'Question added successfully',
      ok: true,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Something went wrong',
      ok: false,
    });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.body;
    const { _id: userId } = req.user;

    const question = await Question.findOneAndDelete({
      _id: questionId,
      user: userId,
    });

    if (!question) {
      res.status(404).json({
        message: 'Question not found or unauthorized action',
        ok: false,
      });
    }

    await User.findOneAndUpdate(
      { _id: userId },
      {
        $inc: { 'stats.question': -1 },
      },
    );

    res.status(201).json({
      message: 'Question deleted successfully',
      ok: true,
    });
  } catch (error) {
    res.status(400).json({
      message: 'Something went wrong while deleting the question',
      ok: false,
    });
  }
};

export const userQuestion = async (req, res) => {
  try {
    const userId = req.params.userId;
    const question = await Question.find({
      user: userId,
    });

    if (!question) {
      res.status(404).json({
        message: 'Question not found',
        ok: false,
      });
    }

    res.status(201).json({
      message: 'Question fetched successfully',
      question,
      ok: true,
    });
  } catch (error) {
    console.warns('error :', error);
    res.status(400).json({
      message: "Something went wrong while fetching user's question",
      ok: false,
    });
  }
};

export const saveQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const { _id } = req.user;

    const question = await Question.exists({ _id: questionId });

    if (!question) {
      return res.status(404).json({
        isSaved: false,
        message: 'Question Not found with this id',
        ok: true,
      });
    }

    const checkExisted = await Saved.exists({
      user: _id,
      question: questionId,
    });

    if (!checkExisted) {
      await Saved.create({ user: _id, question: questionId });
      return res.status(200).json({
        isSaved: true,
        message: 'Question Saved successfully',
        ok: true,
      });
    }

    await Saved.deleteOne({ user: _id, question: questionId });
    return res.status(200).json({
      isSaved: false,
      message: 'Question removed from Saved',
      ok: true,
    });
  } catch (error) {
    console.warn(error, ': error');
    return res.status(500).json({
      isSaved: false,
      message: 'Question cannot be save !',
      ok: false,
    });
  }
};

export const fetchQuestoinDetail = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { user } = req;
    let isSaved = false;

    const questionData = await Question.findOneAndUpdate(
      { _id: questionId },
      {
        $inc: { views: 1 },
      },
      { new: true },
    )
      .populate({ path: 'answers' })
      .populate('user', 'name avatar reputation');

    if (!questionData) {
      return res.status(400).json({
        message: 'Question not found !',
        ok: false,
      });
    }

    if (user) {
      const saved = await Saved.exists({
        user: user?.id,
        question: questionId,
      });
      isSaved = saved ? true : false;
    }
    const question = questionData.toObject();
    question['isSaved'] = isSaved;

    const tags = await Tags.find({ _id: { $in: questionData.tags } });
    if (!tags) tags = [];

    res.status(200).json({
      data: { question, tags },
      ok: true,
      message: 'question fetched successfully',
    });
  } catch (error) {
    console.warn(error, ': error');
    return res.status(400).json({
      message: 'Question not found !',
      ok: false,
    });
  }
};

export const getQuestionList = async (req, res) => {
  try {
    const query = req.query;
    const userId = req.user?.id ?? null; // null if guest
    const questions = await getQuestionRelatedToFilter(query);

    // If logged in, find which questions this user has saved
    let savedSet = new Set();
    if (userId) {
      const saved = await Saved.find({
        user: userId,
        question: { $in: questions.map((q) => q._id) },
      }).select('question');

      savedSet = new Set(saved.map((s) => s.question.toString()));
    }

    const questionsWithSaved = questions.map((q) => ({
      ...q,
      isSaved: savedSet.has(q._id.toString()), // false for guests always
    }));

    return res.status(200).json({
      ok: true,
      message: `${questions.length} questions fetched!`,
      questions: questionsWithSaved,
    });
  } catch (error) {
    console.warn(error, ': error');
    return res.status(400).json({
      message: 'server error : failed to fetch!',
      ok: false,
    });
  }
};

export const getTagList = async (req, res) => {
  try {
    const query = req.query;

    const tags = await getTagsRelatedToFilter(query);
    return res.status(200).json({
      ok: true,
      message: `${tags.length} questions fetched!`,
      data: tags,
    });
  } catch (error) {
    console.log(error, 'Something went wrong!');
    return res.status(400).json({
      message: 'tags not found !',
      ok: false,
    });
  }
};

export const getStatsData = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [questionsToday, answersToday, activeUsersToday, trendingTags] =
      await Promise.all([
        // Questions created today
        Question.countDocuments({ createdAt: { $gte: startOfDay } }),

        // Answers created today
        Answer.countDocuments({ createdAt: { $gte: startOfDay } }),

        // Users who asked or answered today (unique)
        User.countDocuments({ lastActive: { $gte: startOfDay } }),

        // Trending tags — most used in questions created today
        Question.aggregate([
          { $match: { createdAt: { $gte: startOfDay } } },
          { $unwind: '$tags' },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: 'tags', // your Tag collection name
              localField: '_id',
              foreignField: '_id',
              as: 'tag',
            },
          },
          { $unwind: '$tag' },
          {
            $project: {
              _id: 0,
              name: '$tag.name',
              count: 1,
            },
          },
        ]),
      ]);

    res.json({
      ok: true,
      stats: {
        questionsToday,
        answersToday,
        activeUsersToday,
      },
      trendingTags,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Something went wrong!' });
  }
};

export const createTag = async (req, res) => {
  try {
    const { tag } = req.body;
    const tagName = tag.toLowerCase();
    let existingTag = await Tags.findOne({ tagName });

    if (existingTag) {
      return res.json({
        newtag: existingTag,
        ok: true,
      });
    }

    const newtag = await Tags.create({
      tagName: tagName,
      slug: tagName.replace(' ', '-'),
    });

    res.status(200).json({
      newtag,
      ok: true,
      message: 'Tags fetched successfully',
    });
  } catch (error) {
    console.log(error, 'Something went wrong!');
    return res.status(400).json({
      message: 'Server error : unable to create tag !',
      ok: false,
    });
  }
};

export const questionVote = async (req, res) => {
  try {
    const { voteType } = req.query;
    const { questionID } = req.params;

    if (!voteType || !VoteOption[voteType]) {
      res.status(400).json({
        ok: false,
        message: 'Valid voteType is required. 1 = upvote, 2 = downvote',
      });
    }

    const question = await Question.findById(questionID);
    if (!question) {
      return res.status(404).json({
        ok: false,
        message: 'Question Not Found!',
      });
    }

    if (question.user.toString() === req.user._id.toString()) {
      return res.status(403).json({
        ok: false,
        message: 'Cannot Vote your Own Question.',
      });
    }

    const existingVoted = await Vote.findOne({
      targetId: questionID,
      userId: req.user._id,
    });

    if (existingVoted) {
      if (existingVoted['voteType'] === VoteOption[voteType]) {
        await Vote.deleteOne({ _id: existingVoted._id });
        question[VoteOption[voteType]] -= 1;
      } else {
        await Vote.findOneAndUpdate(
          { _id: existingVoted._id },
          { voteType: VoteOption[voteType] },
        );
        question[existingVoted.voteType] -= 1;
        question[VoteOption[voteType]] += 1;
      }
    } else {
      await Vote.create({
        userId: req.user._id,
        targetId: question._id,
        targetType: 'Question',
        voteType: VoteOption[voteType],
      });

      question[VoteOption[voteType]] += 1;
    }

    await question.save();

    return res.status(200).json({
      ok: true,
      message: `you ${VoteOption[voteType]} this Question`,
      data: {
        upvote: question.upvote,
        downvote: question.downvote,
        voted: question.upvote + question.downvote,
      },
    });
  } catch (error) {
    console.warn(error, ': error');
    return res.status(400).json({
      message: 'Server error !',
      ok: false,
    });
  }
};
