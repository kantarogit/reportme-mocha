import { Priority } from '../utility/enums';

export interface TestResult {
  testTitle: string;
  suite: string;
  file: string;
  linesOfCode: number;
  successPercentage: number;
  status: string;
  duration: number;
  priority: Priority;
}
