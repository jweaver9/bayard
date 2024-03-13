import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import NodeCache from 'node-cache';

// Supabase setup
const supabase = createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_ANON_KEY ?? '');
// OpenAI setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' });
// Set up a simple in-memory cache
const cache = new NodeCache({ stdTTL: 600 }); // Cache entries expire after 600 seconds

// Set the runtime to edge for lower latency
export const runtime = 'edge';

export async function POST(req: { json: () => PromiseLike<{ conversationId: any; messages: any; data: any; }> | { conversationId: any; messages: any; data: any; }; }) {
    try {
        const { conversationId, messages, data } = await req.json();
       
        // Attempt to retrieve response from cache
        const cacheKey = `conversation-${conversationId}`;
        const cachedResponse = cache.get(cacheKey);
        if (cachedResponse) {
            // If found in cache, return the cached response
            return new StreamingTextResponse(cachedResponse as ReadableStream<any>);
        }

        const imageContent = data && data.imageUrl ? [{ type: 'image_url', image_url: data.imageUrl }] : [];
        const modelToUse = imageContent.length > 0 ? 'gpt-4-vision-preview' : process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

        const response = await openai.chat.completions.create({
            model: modelToUse,
            stream: true,
            messages: [...messages, ...imageContent],
        });

        const stream = OpenAIStream(response);

        // Insert message into Supabase
        const { error } = await supabase.from('.messages.chatmessages')
            .insert({ 
                conversation_id: conversationId, 
                messages: JSON.stringify(messages), 
                image_url: data?.imageUrl 
            });

        if (error) {
            console.error('Supabase insertion error:', error);
            throw error;
        }

        // Cache the response stream for future requests
        cache.set(cacheKey, stream);

        // Respond with the stream
        return new StreamingTextResponse(stream);
    } catch (error) {
        console.error('API route error:', error);
        // Customize error response as needed
        const errorMessage = typeof error === 'object' && error !== null && 'instanceof' in error && error instanceof OpenAI.APIError
                             ? { status: error.status, message: error.message }
                             : { status: 500, message: 'Internal server error' };
        return NextResponse.json({ error: errorMessage.message }, { status: errorMessage.status });
    }
}