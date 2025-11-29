export const modelOptions = [
  {
    value: 'models/gemini-2.0-flash-preview',
    label: 'Gemini 2.0 Flash Preview',
  },
  { value: 'models/openai-o1-mini', label: 'OpenAI O1 Mini' },
  { value: 'models/openai-o3-mini', label: 'OpenAI O3 Mini' },
];

export const APP_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://project-kitto.vercel.app'
    : 'http://localhost:3000';
