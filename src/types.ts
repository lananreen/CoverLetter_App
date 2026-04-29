export type Theme = 'dark' | 'natural';

export interface UserInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  skills: string;
  experience: string;
  education: string;
}

export interface JobInfo {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  industry: string;
  companyCulture: string;
  tone: 'professional' | 'enthusiastic' | 'creative' | 'minimalist';
}

export interface CoverLetterDraft {
  id: string;
  title: string;
  content: string;
  suggestions: string[];
  userInfo: UserInfo;
  jobInfo: JobInfo;
  createdAt: number;
  templateId: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  structure: string;
}
