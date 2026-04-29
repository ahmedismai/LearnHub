import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, User, Bot, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import api from "@/api/axios";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content: "Hi! I'm LearnHub AI. I can help you understand concepts, debug code, or give study tips. (Note: I cannot solve exams or quizzes for you! 😊)",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.slice(-5); // Keep last 5 messages for context
      const response = await api.post("/Chatbot/message", { 
        message: input,
        history 
      });

      setMessages((prev) => [
        ...prev,
        { role: "bot", content: response.data.response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Sorry, I'm having trouble thinking right now. Try again later!" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full shadow-2xl bg-primary hover:scale-110 transition-transform duration-300 animate-bounce"
        >
          <MessageCircle className="w-7 h-7" />
        </Button>
      )}

      {isOpen && (
        <Card className="w-[380px] h-[550px] shadow-2xl border-primary/20 flex flex-col animate-in slide-in-from-bottom-5 duration-300 rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-primary p-4 flex flex-row items-center justify-between text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-xl">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">LearnHub AI</CardTitle>
                <p className="text-[10px] opacity-80 flex items-center gap-1">
                   <Sparkles className="w-2 h-2" /> Powered by Gemini
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 text-white rounded-full h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col bg-slate-50/50">
            <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-white border text-slate-700 rounded-tl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border p-3 rounded-2xl rounded-tl-none shadow-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 bg-white border-t flex gap-2 items-center">
              <Input
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                className="rounded-xl bg-slate-50 border-none focus-visible:ring-primary h-11"
              />
              <Button 
                onClick={handleSend} 
                disabled={isLoading}
                className="rounded-xl h-11 w-11 p-0 shadow-lg shadow-primary/20"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Chatbot;
