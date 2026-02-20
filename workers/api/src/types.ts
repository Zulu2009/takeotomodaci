export type R2ObjectBody = {
  text(): Promise<string>;
};

export type R2BucketLike = {
  get(key: string): Promise<R2ObjectBody | null>;
};

export type Env = {
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  R2_PUBLIC_BASE_URL?: string;
  CONTENT_BUCKET?: R2BucketLike;
};

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ChatRequest = {
  messages: ChatMessage[];
  lessonId?: string;
};
