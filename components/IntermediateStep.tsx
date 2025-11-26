import { useState } from "react";
import type { Message } from "ai/react";
import { cn } from "@/utils/cn";
import { ChevronDown, ChevronUp, Wrench } from "lucide-react";
import { Badge } from "./ui/badge";

export function IntermediateStep(props: { message: Message }) {
  const parsedInput = JSON.parse(props.message.content);
  const action = parsedInput.action;
  const observation = parsedInput.observation;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex gap-3 mb-4">
      <div className="h-8 w-8 shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
        <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      </div>

      <div className="flex-1 max-w-[80%]">
        <button
          type="button"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <Badge variant="outline" className="font-mono text-xs">
            {action.name}
          </Badge>
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        <div
          className={cn(
            "overflow-hidden transition-all duration-200 ease-in-out",
            expanded ? "max-h-[400px] mt-2" : "max-h-0"
          )}
        >
          <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-2">
            <div>
              <span className="text-muted-foreground">Input: </span>
              <code className="text-foreground">
                {JSON.stringify(action.args, null, 2)}
              </code>
            </div>
            <div>
              <span className="text-muted-foreground">Output: </span>
              <code className="text-foreground block max-h-[200px] overflow-auto">
                {observation}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
