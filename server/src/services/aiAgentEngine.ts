export const aiAgentEngine = {
  async chat(userId: string, message: string) {
    return { response: 'AI agent is not yet implemented', suggestions: [] };
  },
  async getRecommendations(userId: string) {
    return [];
  },
  async analyzeHealth(userId: string) {
    return { analysis: 'Health analysis not yet available' };
  },
  async getChatHistory(userId: string, limit: number = 20) {
    return [];
  },
};
