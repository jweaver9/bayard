'use client';

import React, { useState } from 'react';
import { TextField, Button, Box, Typography, CircularProgress, List, ListItem, ListItemText } from '@mui/material';
import { useChat } from 'ai/react';

// Define some prompt examples for users to get started or to use in the chat.
const promptExamples = [
  "Write a short story about a dragon.",
  "Explain quantum computing to a 10-year-old.",
  "What's the latest news on Mars exploration?",
  "Give me tips for beginner yoga poses."
];

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Directly submit the text input without image handling
    handleSubmit(e);
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '100vh', overflow: 'hidden' }}>
      <Typography variant="h4" sx={{ textAlign: 'center' }}>AI Chat</Typography>

      {/* Display messages */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List>
          {messages.map((m, index) => (
            <ListItem key={index} alignItems="flex-start">
              <ListItemText primary={m.role === 'user' ? 'You:' : 'AI:'} secondary={m.content} />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Allow users to pick a prompt example */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
        {promptExamples.map((example, i) => (
          <Button key={i} variant="outlined" onClick={() => handleInputChange({ target: { value: example } })}>
            Use Example
          </Button>
        ))}
      </Box>

      {/* Input form */}
      <Box component="form" onSubmit={handleFormSubmit} sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask me anything..."
          disabled={loading}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Send'}
        </Button>
      </Box>
    </Box>
  );
}