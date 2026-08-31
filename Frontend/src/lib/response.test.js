import assert from "node:assert/strict";
import { unwrapResponse } from "./response.js";

const exam = {
  title: "html",
  questions: [{ questionId: "q1", questionText: "Question" }],
};

assert.deepEqual(unwrapResponse({ data: exam }).questions, exam.questions);
assert.deepEqual(unwrapResponse({ data: { data: exam } }).questions, exam.questions);

console.log("response unwrap returns nested exam payload");
