import assert from "node:assert/strict";
import { Exam } from "../models/Exam.js";

assert.equal(Exam.schema.path("examDate")?.instance, "Date");
assert.equal(Exam.schema.path("endDate")?.instance, "Date");

console.log("exam model date fields are defined");
