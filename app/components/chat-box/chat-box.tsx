import { Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { IoSend } from 'react-icons/io5';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatBoxProps {
  onSubmit: (message: string) => Promise<void>;
  disabled?: boolean;
  connected?: boolean; // Add connected prop
}

export function ChatBox({ onSubmit, disabled, connected }: ChatBoxProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDisabled = disabled || !connected || isLoading;

  const handleSubmit = async () => {
    if (input.trim() && !isDisabled) {
      setIsLoading(true);
      try {
        await onSubmit(input.trim());
        setInput('');
        // Refocus the input after sending
        inputRef.current?.focus();
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        autoFocus
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={
          connected ? 'Type your message…' : 'Connect to start chatting…'
        }
        className="bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border/60 text-foreground placeholder:text-muted-foreground"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        disabled={isDisabled}
      />
      <Button
        variant="secondary"
        className="shadow-sm border border-border/60"
        disabled={isDisabled || !input.trim()}
        onClick={handleSubmit}
        aria-label="Send message"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <IoSend size={20} />
        )}
      </Button>
    </div>
  );
}
