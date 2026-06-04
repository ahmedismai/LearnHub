import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import api from "@/api/axios";
import examService from "@/api/exam";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  Loader2,
  BookOpen,
  Clock,
  Target,
  Sparkles,
  BrainCircuit,
  Edit3,
  HelpCircle,
} from "lucide-react";

const getLocalDateTimeInputValue = (date = new Date()) => {
  const source = date || new Date();
  const year = source.getFullYear();
  const month = String(source.getMonth() + 1).padStart(2, "0");
  const day = String(source.getDate()).padStart(2, "0");
  const hours = String(source.getHours()).padStart(2, "0");
  const minutes = String(source.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const dateTimeInputValueToApiValue = (value) => {
  const selectedValue = value || getLocalDateTimeInputValue();
  return selectedValue.length === 16 ? `${selectedValue}:00` : selectedValue;
};

const apiDateValueToInputValue = (value, fallbackDate = new Date()) => {
  if (!value) return getLocalDateTimeInputValue(fallbackDate);
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? getLocalDateTimeInputValue(fallbackDate)
    : getLocalDateTimeInputValue(date);
};

// Form Schema
const formSchema = z.object({
  courseId: z.string().min(1, "Please select a course"),
  title: z.string().min(2, "Title must be at least 2 characters"),

  description: z.string().optional(),

  durationInMinutes: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "Duration is required"),
  ),

  examDate: z.string().min(1, "Exam date is required"),
  endDate: z.string().min(1, "End date is required"),

  totalMarks: z.preprocess(
    (val) => Number(val),
    z.number().positive("Total marks must be positive"),
  ),

  // ❌ هيتجاهل في edit mode
  questions: z
    .array(
      z.object({
        questionId: z.number().optional(),
        questionText: z.string().min(1, "Required"),
        questionType: z.enum(["MCQ", "TrueFalse"]),
        marks: z.preprocess((val) => Number(val), z.number().min(1)),
        order: z.number(),
        options: z
          .array(
            z.object({
              answerOptionId: z.number().optional(),
              optionText: z.string().min(1, "Required"),
              isCorrect: z.boolean(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});

const CreateExam = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEditMode);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    topic: "",
    count: 5,
    difficulty: "medium",
    questionTypes: ["MCQ"],
  });
  const [courses, setCourses] = useState([]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseId: "",
      title: "",
      description: "",
      durationInMinutes: 30,
      examDate: getLocalDateTimeInputValue(),
      endDate: getLocalDateTimeInputValue(
        new Date(Date.now() + 30 * 60 * 1000),
      ),
      totalMarks: 100,
      questions: [
        {
          questionText: "",
          questionType: "MCQ",
          marks: 10,
          order: 1,
          options: [
            { optionText: "", isCorrect: false },
            { optionText: "", isCorrect: false },
          ],
        },
      ],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  // Fetch instructor's courses or all courses for Admin
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const endpoint =
          user?.role === "Administrator" ? "/api/Course/list" : "/api/Course/MyCourses";
        const response = await api.get(endpoint);
        setCourses(response.data.data || response.data || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load courses",
          variant: "destructive",
        });
      }
    };

    if (user?.role === "Instructor" || user?.role === "Administrator") {
      fetchCourses();
    }
  }, [user, toast]);

  // Fetch existing exam data for edit mode
  useEffect(() => {
    const fetchExamDetails = async () => {
      if (!isEditMode) return;
      try {
        const response = await examService.getDetails(id);

        console.log("FULL RESPONSE:", response);

        const exam = response?.data || response;

        form.reset({
          courseId: String(exam.courseId || ""),
          title: exam.title || "",
          description: exam.description || "",
          durationInMinutes: exam.durationInMinutes || exam.duration || 30,
          examDate: apiDateValueToInputValue(exam.examDate),
          endDate: apiDateValueToInputValue(
            exam.endDate || Date.now() + 7 * 24 * 60 * 60 * 1000,
            new Date(Date.now() + 30 * 60 * 1000),
          ),
          totalMarks: exam.totalMarks || 100,
          questions: exam.questions.map((q) => ({
            questionId: q.questionId,
            questionText: q.questionText || "",
            questionType: q.questionType || "MCQ",
            marks: q.marks ?? 10,
            order: q.order ?? 1,
            options: (q.options || []).map((o) => ({
              answerOptionId: o.answerOptionId,
              optionText: o.optionText || "",
              isCorrect: !!o.isCorrect,
            })),
          })),
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load exam details",
        });
        navigate("/dashboard/exams");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchExamDetails();
  }, [id, isEditMode, form, navigate, toast]);

  const generateWithAI = async () => {
    const courseId = form.getValues("courseId");
    if (!courseId) {
      return toast({
        title: "Course Required",
        description:
          "Please select a course first so AI can analyze its content.",
        variant: "destructive",
      });
    }

    setIsGenerating(true);
    setIsAiDialogOpen(false);
    try {
      const selectedExamDate =
        form.getValues("examDate") || getLocalDateTimeInputValue();
      form.setValue("examDate", selectedExamDate);

      const response = await examService.generateAIExam(
        courseId,
        dateTimeInputValueToApiValue(selectedExamDate),
        form.getValues("durationInMinutes"),
        {
          topic: aiConfig.topic || form.getValues("title") || "Ai exam",
          numberOfQuestions: aiConfig.count,
          questionTypes: aiConfig.questionTypes,
          difficulty: aiConfig.difficulty,
        },
      );

      const assessment = response?.data?.assessment || response?.assessment;
      const questions = assessment?.questions || [];
      if (!questions.length) throw new Error("No questions returned");

      replace(
        questions.map((question, index) => ({
          questionText: question.text || question.questionText || "",
          questionType: "MCQ",
          marks: 10,
          order: index + 1,
          options: (question.options || []).map((option) => ({
            optionText: typeof option === "string" ? option : option.optionText,
            isCorrect:
              (typeof option === "string" ? option : option.optionText) ===
              question.correctAnswer,
          })),
        })),
      );

      toast({
        title: "Success",
        description: `Generated ${questions.length} questions successfully`,
      });

      if (!form.getValues("title") && assessment?.title) {
        form.setValue("title", assessment.title);
      }

      toast({
        title: "AI Generation Successful!",
        description: `Generated ${questions.length} smart questions based on your course content.`,
      });
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "AI generation failed. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addQuestion = () => {
    append({
      questionId: 0,
      questionText: "",
      questionType: "MCQ",
      marks: 10,
      order: fields.length + 1,
      options: [
        { answerOptionId: 0, optionText: "", isCorrect: false },
        { answerOptionId: 0, optionText: "", isCorrect: false },
      ],
    });
  };

  const addOption = (questionIndex) => {
    const currentOptions = form.getValues(`questions.${questionIndex}.options`);
    form.setValue(`questions.${questionIndex}.options`, [
      ...currentOptions,
      { answerOptionId: 0, optionText: "", isCorrect: false },
    ]);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const currentOptions = form.getValues(`questions.${questionIndex}.options`);
    if (currentOptions.length > 2) {
      const newOptions = currentOptions.filter((_, i) => i !== optionIndex);
      form.setValue(`questions.${questionIndex}.options`, newOptions);
    }
  };

  const onSubmit = async (values) => {
    setIsSubmitting(true);

    try {
      const payload = {
        title: values.title?.trim() || "Ai exam",
        courseId: values.courseId,
        duration: Number(values.durationInMinutes),
        totalMarks: Number(values.totalMarks),
        status: "Published",

        ...(!isEditMode && {
          description: values.description || "Course assessment",
          questions: values.questions.map((q) => ({
            text: q.questionText,
            type: "Multiple Choice",
            options: q.options.map((o) => o.optionText),
            correctAnswer:
              q.options.find((o) => o.isCorrect)?.optionText ||
              q.options[0]?.optionText ||
              "",
          })),
        }),
      };

      if (isEditMode) {
        await examService.update(id, payload);
        toast({ title: "Success", description: "Exam updated successfully" });
      } else {
        await examService.create(payload);
        toast({ title: "Success", description: "Exam created successfully" });
      }

      navigate("/dashboard/exams");
    } catch (error) {
      console.error("Submission Error Details:", error.response?.data || error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to save exam. Check console.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== "Instructor" && user?.role !== "Administrator") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Access denied. Instructor or Admin only.
        </p>
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
          Loading exam details...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in pb-12">
      <div className="page__head">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isEditMode ? (
              <Edit3 className="h-6 w-6" />
            ) : (
              <BookOpen className="h-6 w-6" />
            )}
          </div>
          <div>
            <h1 className="page__title">
              {isEditMode ? "Edit Final Exam" : "Create Final Exam"}
            </h1>
            <p className="page__subtitle">
              {isEditMode
                ? "Modify your existing assessment"
                : "Create comprehensive assessments for your course"}
            </p>
          </div>
        </div>

        {!isEditMode && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAiDialogOpen(true)}
              disabled={isGenerating}
              className="h-12 px-6"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              AI Smart Generate
            </Button>
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="surface-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Exam Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={String(field.value)}
                        disabled={isEditMode}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem
                              key={course.courseId}
                              value={String(course.courseId)}
                            >
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Title</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>{" "}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!isEditMode && (
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>

                      <FormControl>
                        <Textarea
                          className="min-h-[100px]"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="examDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date & Time</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date & Time</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="durationInMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Duration (minutes)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalMarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Marks</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {!isEditMode && (
            <Card className="surface-glass">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-primary" />
                    Questions
                  </CardTitle>

                  <Button
                    type="button"
                    onClick={addQuestion}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question Manually
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {fields.map((field, questionIndex) => (
                  <Card
                    key={field.id}
                    className="border-l-4 border-l-primary/20 bg-background/75 shadow-sm"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">
                          Question {questionIndex + 1}
                        </CardTitle>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(questionIndex)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Question Type */}
                      <FormField
                        control={form.control}
                        name={`questions.${questionIndex}.questionType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Type</FormLabel>

                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>

                              <SelectContent>
                                <SelectItem value="MCQ">MCQ</SelectItem>

                                <SelectItem value="TrueFalse">
                                  True / False
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Question Text */}
                      <FormField
                        control={form.control}
                        name={`questions.${questionIndex}.questionText`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Text</FormLabel>

                            <FormControl>
                              <Textarea
                                {...field}
                                value={field.value ?? ""}
                                placeholder="Enter your question..."
                                className="bg-background"
                              />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Marks */}
                      <FormField
                        control={form.control}
                        name={`questions.${questionIndex}.marks`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Marks for this question</FormLabel>

                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Order */}
                      <FormField
                        control={form.control}
                        name={`questions.${questionIndex}.order`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order</FormLabel>

                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Options */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <FormLabel>Answer Options</FormLabel>

                          <Button
                            type="button"
                            onClick={() => addOption(questionIndex)}
                            variant="ghost"
                            size="sm"
                            className="text-primary"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Option
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {form
                            .watch(`questions.${questionIndex}.options`)
                            .map((_, optionIndex) => (
                              <div
                                key={optionIndex}
                                className="flex gap-2 items-center"
                              >
                                <FormField
                                  control={form.control}
                                  name={`questions.${questionIndex}.options.${optionIndex}.isCorrect`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <input
                                          type="checkbox"
                                          checked={!!field.value}
                                          onChange={field.onChange}
                                          className="w-4 h-4 text-primary"
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`questions.${questionIndex}.options.${optionIndex}.optionText`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input
                                          {...field}
                                          value={field.value ?? ""}
                                          placeholder={`Option ${optionIndex + 1}`}
                                          className="bg-background"
                                        />
                                      </FormControl>

                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                {form.watch(
                                  `questions.${questionIndex}.options`,
                                ).length > 2 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      removeOption(questionIndex, optionIndex)
                                    }
                                    className="text-destructive px-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {fields.length === 0 && (
                  <div className="empty-state">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />

                    <p className="text-muted-foreground font-medium">
                      Use AI to generate questions or add them manually.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/exams")}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 text-lg font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {isEditMode ? "Updating Exam..." : "Creating Exam..."}
                </>
              ) : isEditMode ? (
                "Update & Save Changes"
              ) : (
                "Save & Publish Exam"
              )}
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Exam Configuration
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="topic">Topic / Focus Area</Label>
              <Input
                id="topic"
                placeholder="e.g. React Hooks, Organic Chemistry..."
                value={aiConfig.topic}
                onChange={(e) =>
                  setAiConfig({ ...aiConfig, topic: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="count">Number of Questions</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="20"
                value={aiConfig.count}
                onChange={(e) =>
                  setAiConfig({
                    ...aiConfig,
                    count: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={aiConfig.difficulty}
                onValueChange={(val) =>
                  setAiConfig({ ...aiConfig, difficulty: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Question Types</Label>
              <div className="flex gap-4 items-center mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiConfig.questionTypes.includes("MCQ")}
                    onChange={(e) => {
                      const types = e.target.checked
                        ? [...aiConfig.questionTypes, "MCQ"]
                        : aiConfig.questionTypes.filter((t) => t !== "MCQ");
                      setAiConfig({ ...aiConfig, questionTypes: types });
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">MCQ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiConfig.questionTypes.includes("TrueFalse")}
                    onChange={(e) => {
                      const types = e.target.checked
                        ? [...aiConfig.questionTypes, "TrueFalse"]
                        : aiConfig.questionTypes.filter(
                            (t) => t !== "TrueFalse",
                          );
                      setAiConfig({ ...aiConfig, questionTypes: types });
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">True / False</span>
                </label>
              </div>
              {aiConfig.questionTypes.length === 0 && (
                <p className="text-[10px] text-destructive font-bold">
                  * Please select at least one type
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAiDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={generateWithAI}
              disabled={isGenerating || aiConfig.questionTypes.length === 0}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                "Start AI Generation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateExam;
