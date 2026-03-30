export const bodyCompositionEngine = {
  async uploadScan(userId: string, data: any) {
    return { scanId: 'stub-scan-id' };
  },
  async getLatestScan(userId: string) {
    return null;
  },
  async getScanHistory(userId: string, limit: number = 20) {
    return [];
  },
  async getTrends(userId: string, months: number = 6) {
    return [];
  },
  async getGoals(userId: string) {
    return [];
  },
};
