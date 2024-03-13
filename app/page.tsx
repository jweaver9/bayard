import React from 'react';
import { useChat } from 'ai/react';
import { TextField, Button, Box, Typography, CircularProgress, List, ListItem, ListItemText, Paper } from '@mui/material';
import { styled } from '@mui/system';

const ChatContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.grey[100],
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  maxHeight: '100vh',
  overflow: 'auto',
}));

const ChatHeader = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.main,
}));

const ChatMessages = styled(Paper)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));

const UserMessage = styled(ListItemText)(({ theme }) => ({
  textAlign: 'right',
  '& .MuiListItemText-primary': {
    color: theme.palette.success.main,
  },
}));

const AIMessage = styled(ListItemText)(({ theme }) => ({
  textAlign: 'left',
  '& .MuiListItemText-primary': {
    color: theme.palette.info.main,
  },
}));

const ChatForm = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'center',
}));

const SendButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.secondary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.secondary.dark,
  },
}));

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const [completion, setCompletion] = React.useState<null | string>(null); // Declare the 'completion' state variable and the 'setCompletion' function

  const handleFormSubmit = async (e: React.FormEvent) => {
    const [messages, setMessages] = React.useState([]); // Declare the 'messages' state variable and the 'setMessages' function

    const error = null; // Declare the variable 'error'
    e.preventDefault();
    handleSubmit(e as React.FormEvent<HTMLFormElement>); // Specify the correct type for the event parameter

    if (!error) {
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ input }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prevMessages: never[]) => [...prevMessages, { role: 'system', content: input}, {role: 'user', content: input }, { role: 'assistant', content: data.message }] as never[]);
      }
    }
  };

  return (
    <ChatContainer>
      <ChatHeader variant="h4">AI Chat</ChatHeader>

      <ChatMessages elevation={3}>
        <List>
          {messages.map((m, index) => (
            <ListItem key={index}>
              {m.role === 'user' ? (
                <UserMessage primary="You:" secondary={m.content} />
              ) : (
                <AIMessage primary="AI:" secondary={m.content} />
              )}
            </ListItem>
          ))}
        </List>
      </ChatMessages>


      <ChatForm component="form" onSubmit={handleFormSubmit}>
        <TextField
          fullWidth
          variant="outlined"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask me anything..."
          disabled={completion !== null}
        />
        <SendButton type="submit" variant="contained" disabled={completion !== null}>
          {completion !== null ? <CircularProgress size={24} /> : 'Send'}
        </SendButton>
      </ChatForm>
    </ChatContainer>
  );
}
