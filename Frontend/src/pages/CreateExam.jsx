import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import api from "@/api/axios";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, Loader2, BookOpen, Clock, Target, Sparkles, BrainCircuit } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Form Schema
const formSchema = z.object({
  courseId: z.string().min(1, "Please select a course"),
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  duration: z.string().min(1, "Duration is required"),
  status: z.enum(["Draft", "Published"]),
  totalMarks: z.preprocess(
    (val) => Number(val),
    z.number().positive("Total marks must be positive")
  ),
  questions: z.array(
    z.object({
      text: z.string().min(1, "Question text is required"),
      type: z.enum(["Multiple Choice"]),
      options: z.array(z.string().min(1, "Option cannot be empty")).min(2, "At least 2 options required"),
      correctAnswer: z.string().min(1, "Correct answer is required"),
    })
  ).min(1, "At least one question is required"),
});

const CreateExam = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiCount, setAiCount] = useState(5);
  const [courses, setCourses] = useState([]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseId: "",
      title: "",
      description: "",
      duration: "30",
      status: "Draft",
      totalMarks: 100,
      questions: [
        {
          text: "",
          type: "Multiple Choice",
          options: ["", ""],
          correctAnswer: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  // Fetch instructor's courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get("/Course/mine");
        setCourses(response.data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load courses",
          variant: "destructive",
        });
      }
    };

    if (user?.role === "Instructor") {
      fetchCourses();
    }
  }, [user, toast]);

  const generateWithAI = async () => {
    const courseId = form.getValues("courseId");
    if (!courseId) {
      return toast({
        title: "Course Required",
        description: "Please select a course first so AI can analyze its content.",
        variant: "destructive",
      });
    }

    setIsGenerating(true);
    try {
      const response = await api.post("/AI-Assessment/generate", {
        courseId,
        type: "Exam",
        count: aiCount,
      });

      const { assessment } = response.data;
      
      const newQuestions = assessment.questions.map(q => ({
        text: q.text,
        type: "Multiple Choice",
        options: q.options,
        correctAnswer: q.correctAnswer
      }));

      form.setValue("questions", newQuestions);
      if (!form.getValues("title")) {
        form.setValue("title", assessment.title);
      }
      if (!form.getValues("description")) {
        form.setValue("description", "AI-Generated comprehensive assessment based on course materials.");
      }
      
      toast({
        title: "AI Generation Successful!",
        description: `Generated ${aiCount} smart questions based on your course content.`,
      });
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast({
        variant: "destructive",
        title: "AI Generation Failed",
        description: "Could not generate questions. Make sure your course has description/lessons.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addQuestion = () => {
    append({
      text: "",
      type: "Multiple Choice",
      options: ["", ""],
      correctAnswer: "",
    });
  };

  const addOption = (questionIndex) => {
    const currentOptions = form.getValues(`questions.${questionIndex}.options`);
    form.setValue(`questions.${questionIndex}.options`, [...currentOptions, ""]);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const currentOptions = form.getValues(`questions.${questionIndex}.options`);
    if (currentOptions.length > 2) {
      const newOptions = currentOptions.filter((_, i) => i !== optionIndex);
      form.setValue(`questions.${questionIndex}.options`, newOptions);

      const correctAnswer = form.getValues(`questions.${questionIndex}.correctAnswer`);
      if (correctAnswer === currentOptions[optionIndex]) {
        form.setValue(`questions.${questionIndex}.correctAnswer`, "");
      }
    }
  };

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      await api.post("/Exam", values);
      toast({
        title: "Success!",
        description: "Exam created successfully",
      });
      navigate("/dashboard/exams");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to create exam",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== "Instructor") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Access denied. Instructor only.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Final Exam</h1>
            <p className="text-muted-foreground">
              Create comprehensive assessments for your course
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Input 
            type="number" 
            min="1" 
            max="20" 
            value={aiCount} 
            onChange={(e) => setAiCount(parseInt(e.target.value) || 1)}
            className="w-20 h-12 text-center font-bold border-primary/30"
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={generateWithAI}
            disabled={isGenerating}
            className="border-primary/50 text-primary hover:bg-primary/5 h-12 px-6"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            AI Smart Generate
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course._id} value={course._id}>
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Duration (minutes)
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
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
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                   <BrainCircuit className="w-5 h-5 text-primary" />
                   Questions
                </CardTitle>
                <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question Manually
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, questionIndex) => (
                <Card key={field.id} className="border-l-4 border-l-primary/20 bg-muted/5 shadow-sm">
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
                    <FormField
                      control={form.control}
                      name={`questions.${questionIndex}.text`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Text</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Enter your question..." className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                        {form.watch(`questions.${questionIndex}.options`).map((_, optionIndex) => (
                          <div key={optionIndex} className="flex gap-2">
                            <FormField
                              control={form.control}
                              name={`questions.${questionIndex}.options.${optionIndex}`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input {...field} placeholder={`Option ${optionIndex + 1}`} className="bg-background" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            {form.watch(`questions.${questionIndex}.options`).length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(questionIndex, optionIndex)}
                                className="text-destructive px-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name={`questions.${questionIndex}.correctAnswer`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary font-bold">Correct Answer</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="border-primary/30">
                                <SelectValue placeholder="Select correct answer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {form.watch(`questions.${questionIndex}.options`).map((option, idx) => (
                                option && (
                                  <SelectItem key={idx} value={option}>
                                    {option}
                                  </SelectItem>
                                )
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              ))}

              {fields.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-2xl">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground font-medium">Use AI to generate questions or add them manually.</p>
                </div>
              )}
            </CardContent>
          </Card>

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
                  Creating Exam...
                </>
              ) : (
                "Save & Publish Exam"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreateExam;
