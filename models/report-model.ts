import { TestResult } from './test-model';

export interface ReportSummary {
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  tests: TestResult[];
}
