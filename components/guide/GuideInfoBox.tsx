import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

export function GuideInfoBox(props: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              LangChain.js
            </Badge>
            <span className="text-2xl">+</span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              Next.js
            </Badge>
          </div>
          <CardTitle className="text-xl">AI Agent Demo</CardTitle>
          <CardDescription>
            Powered by LangGraph and Vercel AI SDK
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {props.children}
        </CardContent>
      </Card>
    </div>
  );
}
