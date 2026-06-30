export type FormType = 'Normal' | 'Quiz';
export type AudienceType = 'Students' | 'Teachers' | 'Both';
export type QuestionType = 'ShortText' | 'LongText' | 'MultipleChoice' | 'Checkbox' | 'Dropdown';

export interface FormDto {
  id: string;
  title: string;
  description?: string;
  formType: FormType;
  audience: AudienceType;
  accessToken: string;
  timerMinutes?: number;
  isActive: boolean;
  allowMultipleResponses: boolean;
  startsAt?: string;
  endsAt?: string;
  createdByManagerId?: string;
  createdByTeacherId?: string;
  halaqaId?: string;
  courseId?: string;
  primaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  questions: FormQuestionDto[];
}

export interface FormQuestionDto {
  id: string;
  formId: string;
  text: string;
  description?: string;
  questionType: QuestionType;
  order: number;
  isRequired: boolean;
  points?: number;
  columnSpan: number;
  labelColor?: string;
  fontSize?: number;
  fontFamily?: string;
  options: FormQuestionOptionDto[];
}

export interface FormQuestionOptionDto {
  id: string;
  questionId: string;
  text: string;
  order: number;
  isCorrect: boolean;
}

export interface CreateFormDto {
  title: string;
  description?: string | null;
  formType: FormType;
  audience: AudienceType;
  timerMinutes?: number | null;
  isActive: boolean;
  allowMultipleResponses: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  createdByManagerId?: string | null;
  createdByTeacherId?: string | null;
  halaqaId?: string | null;
  courseId?: string | null;
  primaryColor?: string | null;
  backgroundColor?: string | null;
  fontFamily?: string | null;
}

export interface UpdateFormDto {
  title: string;
  description?: string | null;
  formType: FormType;
  audience: AudienceType;
  timerMinutes?: number | null;
  isActive: boolean;
  allowMultipleResponses: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  halaqaId?: string | null;
  courseId?: string | null;
  primaryColor?: string | null;
  backgroundColor?: string | null;
  fontFamily?: string | null;
}

export interface CreateFormQuestionOptionDto {
  text: string;
  order: number;
  isCorrect: boolean;
}

export interface CreateFormQuestionDto {
  formId: string;
  text: string;
  description?: string;
  questionType: QuestionType;
  order: number;
  isRequired: boolean;
  points?: number;
  columnSpan: number;
  labelColor?: string;
  fontSize?: number;
  fontFamily?: string;
  options: CreateFormQuestionOptionDto[];
}

export interface UpdateFormQuestionDto {
  text: string;
  description?: string;
  questionType: QuestionType;
  order: number;
  isRequired: boolean;
  points?: number;
  columnSpan: number;
  labelColor?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface UpdateFormQuestionOptionDto {
  text: string;
  order: number;
  isCorrect: boolean;
}

export interface SubmitFormResponseDto {
  formId: string;
  respondedByStudentId?: string;
  respondedByTeacherId?: string;
  timeSpentSeconds?: number;
  answers: SubmitFormAnswerDto[];
}

export interface SubmitFormAnswerDto {
  questionId: string;
  textAnswer?: string;
  selectedOptionIds: string[];
}

export interface FormResponseDto {
  id: string;
  formId: string;
  respondedByStudentId?: string;
  respondedByTeacherId?: string;
  timeSpentSeconds?: number;
  score?: number;
  submittedAt: string;
  answers: FormAnswerDto[];
}

export interface FormAnswerDto {
  id: string;
  questionId: string;
  questionText: string;
  textAnswer?: string;
  selectedOptions: FormQuestionOptionDto[];
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
