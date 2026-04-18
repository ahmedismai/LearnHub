import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import api from "@/api/axios";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", content: "Hi! I'm LearnHub Assistant. How can I help you today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await api.post("/Chatbot", { message: userMessage.content });
      setMessages((prev) => [...prev, { role: "bot", content: response.data.answer }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Sorry, I'm having trouble connecting right now. Please try again later." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full w-14 h-14 shadow-2xl gradient-primary border-none"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      ) : (
        <Card className="w-80 sm:w-96 shadow-2xl border-primary/20 animate-in slide-in-from-bottom-5 duration-300">
          <CardHeader className="gradient-primary text-primary-foreground p-4 rounded-t-lg flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <CardTitle className="text-lg">LearnHub AI</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-white/20 h-8 w-8"
            >
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent 
            className="p-4 h-[350px] overflow-y-auto space-y-4"
            ref={scrollRef}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted text-foreground rounded-tl-none"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 opacity-70">
                    {msg.role === "user" ? (
                      <>
                        <span className="text-[10px] font-bold uppercase">You</span>
                        <User className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <Bot className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase">Assistant</span>
                      </>
                    )}
                  </div>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-3 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex w-full gap-2"
            >
              <Input
                placeholder="Ask anything..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-muted/50"
              />
              <Button type="submit" size="icon" disabled={isLoading || !message.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default Chatbot;
