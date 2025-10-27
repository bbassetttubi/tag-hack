export interface StorySegment {
  id: string;
  prompt: string;
  creatorName: string;
  durationSeconds: number;
  status: "queued" | "in_progress" | "completed" | "failed";
  videoUrl?: string;
  thumbnailUrl?: string;
  remixSourceSegmentId?: string;
  createdAt?: string | { seconds: number; nanoseconds: number };
  updatedAt?: string | { seconds: number; nanoseconds: number };
}

export interface Story {
  id: string;
  title: string;
  createdBy: string;
  totalDurationSeconds: number;
  participants: string[];
  status: "open" | "complete" | "failed";
  nextContributor?: string;
  taggedBy?: string;
  createdAt?: string | { seconds: number; nanoseconds: number };
  updatedAt?: string | { seconds: number; nanoseconds: number };
}

export interface StoryWithSegments {
  story: Story;
  segments: StorySegment[];
}

export interface CreateStoryPayload {
  title: string;
  prompt: string;
  creatorName: string;
  durationSeconds: "4" | "6" | "8";
  model?: string;
}

export interface AppendSegmentPayload {
  prompt: string;
  creatorName: string;
  durationSeconds: "4" | "6" | "8";
  model?: string;
  useInputReference?: boolean;
}

export interface RemixSegmentPayload {
  sourceSegmentId: string;
  prompt: string;
  creatorName: string;
}

export interface TagUserPayload {
  nextContributor: string;
  taggedBy: string;
}

export interface CanContinueResponse {
  canContinue: boolean;
  reason?: string;
}

