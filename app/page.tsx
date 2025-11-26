import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";

export default function RetrievalAgentPage() {
  const InfoCard = (
    <GuideInfoBox>
      <ul className="space-y-2 text-left">
        <li className="flex items-start gap-2">
          <span className="text-lg">🤖</span>
          <span>
            AI agent with document retrieval tool for answering questions.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-lg">🔍</span>
          <span>
            Uses RAG (Retrieval Augmented Generation) to find relevant passages.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-lg">🛠️</span>
          <span>
            Toggle &quot;Show intermediate steps&quot; to see the agent&apos;s reasoning.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-lg">💡</span>
          <span>
            Try: <code className="bg-muted px-1 rounded">What are some ways of doing retrieval in LangChain?</code>
          </span>
        </li>
      </ul>
    </GuideInfoBox>
  );

  return (
    <main className="h-screen">
      <ChatWindow
        endpoint="api/chat"
        emptyStateComponent={InfoCard}
        showIngestForm={true}
        showIntermediateStepsToggle={true}
        placeholder="Ask a question about your document..."
        emoji="🤖"
      />
    </main>
  );
}
