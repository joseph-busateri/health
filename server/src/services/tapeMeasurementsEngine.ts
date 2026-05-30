export const tapeMeasurementsEngine = {
  async logMeasurement(userId: string, data: any) {
    return { measurementId: 'stub-measurement-id' };
  },
  async getMeasurementHistory(userId: string, limit: number = 20) {
    return [];
  },
  async getTrends(userId: string, bodyPart: string, months: number = 6) {
    return [];
  },
};
