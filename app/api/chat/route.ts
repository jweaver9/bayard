// Required imports
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { nanoid } from 'nanoid';
import NodeCache from 'node-cache';
import type { NextApiRequest, NextApiResponse } from 'next';
import { timeStamp } from 'console';

// Supabase setup
const supabase = createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_ANON_KEY ?? '');

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? '',
});

// Simple in-memory cache setup
const cache = new NodeCache({ stdTTL: 600 }); // Cache entries expire after 600 seconds

export const config = {
  runtime: 'experimental-edge',
};

// Type for the request body
type RequestBody = {
  conversationId: string;
  messages: {role: 'user' | 'assistant' | 'system'; content: string; }[];
};

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { conversationId, messages }: RequestBody = req.body;

    // Request a chat completion from OpenAI
    const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-3.5-turbo',
        stream: true,
        messages,
    });

    // Convert the response into a ReadableStream
    const stream = OpenAIStream(response);

    // Insert message into Supabase
    const cacheKey = 'cacheKey'; // Declare the cacheKey variable
    const { error } = await supabase
        .from('messages.chatmessages')
        .insert({
            conversation_id: conversationId,
            role: messages[messages.length - 1].role, // Access the role property of the last message in the array
            content: messages[messages.length - 1].content,
            timeStamp: new Date().toISOString(),
        });

    if (error) {
        console.error('Supabase insertion error:', error);
        throw error;
    }

    // Cache the generated stream for future requests
    cache.set(cacheKey, stream);

    // Respond with the streaming text response
    return new StreamingTextResponse(stream);
} catch (error) {
    console.error('API route error:', error);
    // Customize the error response based on the caught error
    const isAPIError = error instanceof OpenAI.APIError;
    const status = isAPIError ? error.status : 500;
    const message = isAPIError ? error.message : 'Internal server error';

    return res.status(status || 500).json({ error: message });
    }
}