import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { kv } from '@vercel/kv';
import { auth } from '@/auth';
import { nanoid } from '@/lib/utils';

// Combined setup for OpenAI and Supabase
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const supabase = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_ANON_KEY ?? ''
);

export const runtime = 'edge';

export async function POST(req: Request) {
  const json = await req.json();
  const { messages } = json;
  const previewToken = req.headers.get('x-preview-token');
  const userId = (await auth())?.user.id;

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (previewToken) {
    openai.apiKey = previewToken;
  }

  const conversationId = json.id ?? nanoid();
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    messages,
    temperature: 0.7,
    stream: true,
  });

  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      const title = messages[0].content.substring(0, 100);
      const createdAt = Date.now();
      const path = `/chat/${conversationId}`;
      const fullMessages = [
        ...messages,
        { content: completion, role: 'assistant' },
      ];

      // Store in Vercel KV
      await kv.hmset(`chat:${conversationId}`, {
        id: conversationId,
        title,
        userId,
        createdAt,
        path,
        messages: fullMessages,
      });
      await kv.zadd(`user:chat:${userId}`, {
        score: createdAt,
        member: `chat:${conversationId}`,
      });

      // Also store in Supabase
      const { error } = await supabase.from('conversations').insert({
        id: conversationId,
        messages: JSON.stringify(fullMessages),
      });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
    },
  });

  return new StreamingTextResponse(stream);
}
