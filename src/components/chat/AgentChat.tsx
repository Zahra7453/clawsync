import { useState, useRef, useEffect, useMemo } from 'react';
import { useAction } from 'convex/react';
import { useThreadMessages } from '@convex-dev/agent/react';
import { api } from '../../../convex/_generated/api';
import { MessageBubble } from './MessageBubble';
import './AgentChat.css';

interface ToolCall {
  name: string;
  args: string;
  result: string;
}

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  streaming?: boolean;
}

interface AgentChatProps {
  sessionId: string;
  threadId: string | null;
  onThreadChange: (threadId: string) => void;
  placeholder?: string;
  maxLength?: number;
  agentId?: string; // Multi-agent support: optional agent ID
}

export function AgentChat({
  sessionId,
  threadId,
  onThreadChange,
  placeholder = 'Ask me anything...',
  maxLength = 4000,
  agentId,
}: AgentChatProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sendMessage = useAction(api.chat.send);

  // Reactively subscribe to thread messages (streams as agent saves per step)
  const { results: threadMessages } = useThreadMessages(
    api.messages.list,
    threadId ? { threadId } : 'skip',
    { initialNumItems: 100, stream: true },
  );

  // Build a map of toolCallId -> result from tool-role messages
  const toolResultMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!threadMessages) return map;
    for (const msg of threadMessages) {
      if (msg.message?.role === 'tool' && Array.isArray(msg.message.content)) {
        for (const part of msg.message.content) {
          if (part.type === 'tool-result' && part.toolCallId) {
            const result = part.result
              ? typeof part.result === 'string'
                ? part.result.slice(0, 1000)
                : JSON.stringify(part.result, null, 2).slice(0, 1000)
              : '';
            map.set(part.toolCallId, result);
          }
        }
      }
    }
    return map;
  }, [threadMessages]);

  // Convert thread messages to display format
  const messages: DisplayMessage[] = useMemo(() => {
    const result: DisplayMessage[] = [];
    if (!threadMessages) {
      // Show optimistic user message when subscription hasn't activated yet
      if (pendingUserMessage) {
        result.push({
          id: 'pending-user',
          role: 'user',
          content: pendingUserMessage,
          timestamp: Date.now(),
        });
      }
      return result;
    }

    for (const msg of threadMessages) {
      const role = msg.message?.role;
      if (role !== 'user' && role !== 'assistant') continue;

      const text = msg.text ?? '';

      // Extract tool calls from assistant message content
      let toolCalls: ToolCall[] | undefined;
      if (role === 'assistant' && Array.isArray(msg.message?.content)) {
        const calls = (msg.message!.content as any[])
          .filter((part) => part.type === 'tool-call')
          .map((part) => ({
            name: part.toolName ?? 'unknown',
            args: JSON.stringify(part.args ?? {}, null, 2),
            result: toolResultMap.get(part.toolCallId) ?? '',
          }));
        if (calls.length > 0) toolCalls = calls;
      }

      // Skip empty assistant messages (intermediate steps with no text or tool calls)
      if (role === 'assistant' && !text.trim() && !toolCalls) continue;

      result.push({
        id: (msg as any).key ?? (msg as any)._id ?? `${msg.order}-${msg.stepOrder}`,
        role,
        content: text,
        timestamp: (msg as any)._creationTime ?? Date.now(),
        toolCalls,
        streaming: (msg as any).streaming,
      });
    }

    // Clear pending message once subscription has the user's message
    if (pendingUserMessage && result.some((m) => m.role === 'user' && m.content === pendingUserMessage)) {
      // Will clear on next render cycle
    } else if (pendingUserMessage) {
      // Subscription active but user message not yet saved — show optimistic
      result.push({
        id: 'pending-user',
        role: 'user',
        content: pendingUserMessage,
        timestamp: Date.now(),
      });
    }

    return result;
  }, [threadMessages, toolResultMap, pendingUserMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    if (trimmedInput.length > maxLength) {
      setError(`Message too long. Maximum ${maxLength} characters.`);
      return;
    }

    setError(null);
    setInput('');
    setIsLoading(true);
    setPendingUserMessage(trimmedInput);

    try {
      const result = await sendMessage({
        threadId: threadId ?? undefined,
        message: trimmedInput,
        sessionId,
        ...(agentId && { agentId: agentId as any }),
      });

      if (result.error) {
        setError(result.error);
      }

      // Set threadId so subscription activates (important for first message)
      if (result.threadId && result.threadId !== threadId) {
        onThreadChange(result.threadId);
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Send error:', err);
    } finally {
      setIsLoading(false);
      setPendingUserMessage(null);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleClearChat = () => {
    localStorage.removeItem('clawsync_thread_id');
    onThreadChange('');
  };

  // Show typing indicator if loading or any message is still streaming
  const hasStreamingMessage = messages.some((m) => m.streaming);
  const showTyping = isLoading || hasStreamingMessage;

  return (
    <div className="agent-chat">
      <div className="messages-container">
        {messages.length === 0 && !isLoading ? (
          <div className="empty-state">
            <p>Start a conversation with the agent.</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
              toolCalls={message.toolCalls}
            />
          ))
        )}

        {showTyping && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      <form className="input-form" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="chat-input"
          disabled={isLoading}
          maxLength={maxLength}
        />
        <button
          type="submit"
          className="send-button btn btn-primary"
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>

      {messages.length > 0 && (
        <button className="clear-button btn btn-ghost" onClick={handleClearChat}>
          Clear conversation
        </button>
      )}
    </div>
  );
}
