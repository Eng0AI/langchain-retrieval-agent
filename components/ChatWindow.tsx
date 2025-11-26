"use client";

import { type Message } from "ai";
import { useChat } from "ai/react";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { toast } from "sonner";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import { ChatMessageBubble } from "@/components/ChatMessageBubble";
import { IntermediateStep } from "./IntermediateStep";
import { Button } from "./ui/button";
import { ArrowDown, Send, Loader2, Paperclip } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { cn } from "@/utils/cn";
import { UploadDocumentsForm } from "./UploadDocumentsForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

function ChatMessages(props: {
  messages: Message[];
  sourcesForMessages: Record<string, any>;
  aiEmoji?: string;
}) {
  return (
    <div className="flex flex-col max-w-2xl mx-auto w-full px-4">
      {props.messages.map((m, i) => {
        if (m.role === "system") {
          return <IntermediateStep key={m.id} message={m} />;
        }

        const sourceKey = (props.messages.length - 1 - i).toString();
        return (
          <ChatMessageBubble
            key={m.id}
            message={m}
            aiEmoji={props.aiEmoji}
            sources={props.sourcesForMessages[sourceKey]}
          />
        );
      })}
    </div>
  );
}

export function ChatInput(props: {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onStop?: () => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading?: boolean;
  placeholder?: string;
  children?: ReactNode;
}) {
  const disabled = props.loading && props.onStop == null;

  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (props.loading) {
          props.onStop?.();
        } else {
          props.onSubmit(e);
        }
      }}
      className="w-full max-w-2xl mx-auto px-4"
    >
      <div className="flex flex-col gap-3 p-4 bg-background border rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <input
            value={props.value}
            placeholder={props.placeholder}
            onChange={props.onChange}
            className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            size="sm"
            disabled={disabled || !props.value.trim()}
            className="shrink-0"
          >
            {props.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {props.children && (
          <div className="flex items-center gap-4 pt-2 border-t">
            {props.children}
          </div>
        )}
      </div>
    </form>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("shadow-md", props.className)}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="h-4 w-4 mr-1" />
      Scroll to bottom
    </Button>
  );
}

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
}) {
  const context = useStickToBottomContext();

  return (
    <div
      ref={context.scrollRef}
      className="flex flex-col h-full w-full overflow-auto"
    >
      <div ref={context.contentRef} className="flex-1 py-6">
        {props.content}
      </div>
      {props.footer}
    </div>
  );
}

export function ChatLayout(props: { content: ReactNode; footer: ReactNode }) {
  return (
    <StickToBottom className="h-full">
      <StickyToBottomContent
        content={props.content}
        footer={
          <div className="sticky bottom-0 pb-4 bg-gradient-to-t from-background via-background to-transparent pt-6">
            <ScrollToBottom className="absolute -top-2 left-1/2 -translate-x-1/2" />
            {props.footer}
          </div>
        }
      />
    </StickToBottom>
  );
}

export function ChatWindow(props: {
  endpoint: string;
  emptyStateComponent: ReactNode;
  placeholder?: string;
  emoji?: string;
  showIngestForm?: boolean;
  showIntermediateStepsToggle?: boolean;
}) {
  const [showIntermediateSteps, setShowIntermediateSteps] = useState(
    !!props.showIntermediateStepsToggle
  );
  const [intermediateStepsLoading, setIntermediateStepsLoading] = useState(false);
  const [sourcesForMessages, setSourcesForMessages] = useState<Record<string, any>>({});

  const chat = useChat({
    api: props.endpoint,
    onResponse(response) {
      const sourcesHeader = response.headers.get("x-sources");
      const sources = sourcesHeader
        ? JSON.parse(Buffer.from(sourcesHeader, "base64").toString("utf8"))
        : [];

      const messageIndexHeader = response.headers.get("x-message-index");
      if (sources.length && messageIndexHeader !== null) {
        setSourcesForMessages({
          ...sourcesForMessages,
          [messageIndexHeader]: sources,
        });
      }
    },
    streamMode: "text",
    onError: (e) =>
      toast.error("Error", {
        description: e.message,
      }),
  });

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (chat.isLoading || intermediateStepsLoading) return;

    if (!showIntermediateSteps) {
      chat.handleSubmit(e);
      return;
    }

    setIntermediateStepsLoading(true);
    chat.setInput("");

    const messagesWithUserReply = chat.messages.concat({
      id: chat.messages.length.toString(),
      content: chat.input,
      role: "user",
    });
    chat.setMessages(messagesWithUserReply);

    const response = await fetch(props.endpoint, {
      method: "POST",
      body: JSON.stringify({
        messages: messagesWithUserReply,
        show_intermediate_steps: true,
      }),
    });
    const json = await response.json();
    setIntermediateStepsLoading(false);

    if (!response.ok) {
      toast.error("Error", { description: json.error });
      return;
    }

    const responseMessages: Message[] = json.messages;
    const toolCallMessages = responseMessages.filter(
      (responseMessage: Message) => {
        return (
          (responseMessage.role === "assistant" &&
            !!responseMessage.tool_calls?.length) ||
          responseMessage.role === "tool"
        );
      }
    );

    const intermediateStepMessages = [];
    for (let i = 0; i < toolCallMessages.length; i += 2) {
      const aiMessage = toolCallMessages[i];
      const toolMessage = toolCallMessages[i + 1];
      intermediateStepMessages.push({
        id: (messagesWithUserReply.length + i / 2).toString(),
        role: "system" as const,
        content: JSON.stringify({
          action: aiMessage.tool_calls?.[0],
          observation: toolMessage.content,
        }),
      });
    }

    const newMessages = messagesWithUserReply;
    for (const message of intermediateStepMessages) {
      newMessages.push(message);
      chat.setMessages([...newMessages]);
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 1000)
      );
    }

    chat.setMessages([
      ...newMessages,
      {
        id: newMessages.length.toString(),
        content: responseMessages[responseMessages.length - 1].content,
        role: "assistant",
      },
    ]);
  }

  return (
    <ChatLayout
      content={
        chat.messages.length === 0 ? (
          props.emptyStateComponent
        ) : (
          <ChatMessages
            aiEmoji={props.emoji}
            messages={chat.messages}
            sourcesForMessages={sourcesForMessages}
          />
        )
      }
      footer={
        <ChatInput
          value={chat.input}
          onChange={chat.handleInputChange}
          onSubmit={sendMessage}
          loading={chat.isLoading || intermediateStepsLoading}
          placeholder={props.placeholder ?? "Type a message..."}
        >
          {props.showIngestForm && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  disabled={chat.messages.length !== 0}
                >
                  <Paperclip className="h-4 w-4 mr-1" />
                  Upload document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                    Paste or edit the document text below. It will be embedded and stored for retrieval.
                  </DialogDescription>
                </DialogHeader>
                <UploadDocumentsForm />
              </DialogContent>
            </Dialog>
          )}

          {props.showIntermediateStepsToggle && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <Checkbox
                id="show_intermediate_steps"
                checked={showIntermediateSteps}
                disabled={chat.isLoading || intermediateStepsLoading}
                onCheckedChange={(e) => setShowIntermediateSteps(!!e)}
              />
              Show intermediate steps
            </label>
          )}
        </ChatInput>
      }
    />
  );
}
