import api from "./axios";

const chatbotService = {
  ask: async (question) => {
    const response = await api.post("/api/Chatbot/message", {
      message: question,
      history: [],
    });
    return response.data;
  },
};

export default chatbotService;
