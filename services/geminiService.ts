
import { GoogleGenAI } from "@google/genai";
import { Note, AIAction, Language } from "../types";

/**
 * Utility to delay execution for retry logic.
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extract keys from the environment variable. 
 * Expected format in Vercel/Env: "key1,key2,key3"
 */
const getAvailableKeys = () => {
  const rawKeys = process.env.API_KEY || "";
  return rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
};

let currentKeyIndex = 0;

/**
 * Returns a GoogleGenAI instance using the current active key from the rotation list.
 */
export const getAIClient = () => {
  const keys = getAvailableKeys();
  // If no keys are found, it will still try to use whatever is there, 
  // but usually Vercel handles the injection.
  const activeKey = keys[currentKeyIndex] || process.env.API_KEY;
  return new GoogleGenAI({ apiKey: activeKey });
};

/**
 * Rotates to the next available API key in the list.
 */
export const rotateKey = () => {
  const keys = getAvailableKeys();
  if (keys.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    console.warn(`Quota reached. Rotating to API Key #${currentKeyIndex + 1}`);
  }
  return keys[currentKeyIndex] || process.env.API_KEY;
};

const languageNames: Record<Language, string> = {
  en: "English",
  bn: "Bengali",
  ja: "Japanese",
  zh: "Chinese",
  ru: "Russian",
  fr: "French",
  ko: "Korean"
};

export const getLanguageFromTitle = (title: string): string => {
  const ext = title.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'py': return 'python';
    case 'js': return 'javascript';
    case 'jsx': return 'react jsx';
    case 'ts': return 'typescript';
    case 'tsx': return 'react typescript';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'cpp': return 'c++';
    case 'cs': return 'c#';
    case 'java': return 'java';
    case 'md': return 'markdown';
    case 'json': return 'json';
    default: return 'plaintext';
  }
};

/**
 * Performs AI tasks with automatic key rotation on quota errors.
 */
export const performAITask = async (action: AIAction, note: Note, userLang: Language = 'en') => {
  const keys = getAvailableKeys();
  const maxAttempts = Math.max(keys.length, 3);
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const ai = getAIClient();
      const isCodeAction = action === 'fix';
      const modelName = (action === 'think' || isCodeAction) ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
      const tools = action === 'search' ? [{ googleSearch: {} }] : undefined;
      
      const language = getLanguageFromTitle(note.title);
      
      const config: any = {
        temperature: (action === 'fix' || action === 'think') ? 0.1 : 0.7,
        tools: tools,
      };

      if (action === 'think' || isCodeAction) {
        config.thinkingConfig = { thinkingBudget: 32768 };
      }

      const langInstruction = `Respond in ${languageNames[userLang]} language.`;
      const emphasisRules = `CRITICAL: Do not use Markdown bolding (**text**) for emphasis. Use plain text only. ${langInstruction}`;

      let prompt = `Task: ${action}\n\nNote Title: ${note.title}\nNote Content: ${note.content}\n\n${emphasisRules}`;
      let systemInstruction = `You are a professional assistant. ${emphasisRules}`;

      if (action === 'fix') {
        systemInstruction = `You are a world-class software engineer. ${emphasisRules}
        Analyze the code for syntax errors and logic. Provide the corrected code in a single block, followed by a concise explanation in ${languageNames[userLang]}.`;
        prompt = `Debug and fix the following ${language} code:\n\n${note.content}`;
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          ...config,
          systemInstruction: systemInstruction
        }
      });

      return {
        text: response.text || "",
        grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      };
    } catch (error: any) {
      const errorMsg = error.message?.toLowerCase() || "";
      const isQuotaError = errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('limit');
      
      if (isQuotaError && attempts < maxAttempts - 1) {
        rotateKey();
        attempts++;
        await sleep(1000); // Small delay before retry
        continue;
      }
      
      console.error("Gemini API Error:", error);
      throw new Error(error.message || "Unable to complete request.");
    }
  }
  throw new Error("All API keys have reached their quota limits.");
};

export function decodeAudio(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function encodeAudio(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
