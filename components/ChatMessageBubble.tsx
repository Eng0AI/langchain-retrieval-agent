import { cn } from "@/utils/cn";
import type { Message } from "ai/react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { User, Bot } from "lucide-react";

export function ChatMessageBubble(props: {
  message: Message;
  aiEmoji?: string;
  sources?: any[];
}) {
  const isUser = props.message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 mb-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : props.aiEmoji || <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "flex flex-col max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2 text-sm",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          <p className="whitespace-pre-wrap m-0">{props.message.content}</p>
        </div>

        {props.sources && props.sources.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 max-w-full">
            <p className="font-medium mb-1">Sources:</p>
            {props.sources.map((source, i) => (
              <p key={i} className="text-xs opacity-80 truncate">
                {i + 1}. {source.pageContent?.slice(0, 100)}...
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
