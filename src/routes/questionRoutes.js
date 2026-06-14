import express, { Router } from "express";
import { optionalAuth, protect } from "../middleware/authMiddleware.js";
import {
  createQuestion,
  deleteQuestion,
  fetchQuestoinDetail,
  questionVote,
  userQuestion,
  getQuestionList,
  createTag,
  getTagList,
  getStatsData,
  saveQuestion,
} from "../controllers/questionController.js";

const route = express.Router();
// PUBLIC ROUTES --------------------------------------------------------------------------------------

// GET
route.get("/api/get-questionList", optionalAuth,  getQuestionList);  // GET QUESTION LIST WITH DETAIL
route.get("/api/getTags/", getTagList);  // GET TAGs LIST
route.get("/api/getStats/", getStatsData);  // GET STATS DATA (QUESTION PAGE)

// POST


// PATCH

// OPTIONAL PROCTECTED ROUTES --------------------------------------------------------------------------------------
route.get("/api/:questionTitle", optionalAuth ,fetchQuestoinDetail); // GET QUESTION DETAILS


// PRIVATE ROUTES --------------------------------------------------------------------------------------
route.use(protect);

// GET
route.get("/user-questions/:userId", userQuestion);  // USER's QUESTIONS

// POST
route.post("/create-question", createQuestion); // CREATE QUESTION
route.post("/del-question", deleteQuestion); // DELETE QUESTION
route.post("/api/add-tags/", createTag); // CREATE QUESTION TAGs
route.post("/api/:questionId/save", saveQuestion);  // SAVE QUESTION


// PATCH
route.patch("/api/:questionID/vote", questionVote);  // QUESTION VOTING


export default route;
