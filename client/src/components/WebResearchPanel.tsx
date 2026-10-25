import { BookOpen } from "lucide-react";
import type { WebResearchResponse } from "../lib/webResearchApi";

type Props = {
  result: WebResearchResponse;
  question: string;
  onFollowUp: (question: string) => void;
};

export function WebResearchPanel({ result, question, onFollowUp }: Props) {
  const boundedQuestion = question.slice(0, 700);
  return (
    <article className="web-research-result" data-cursor-spotlight aria-label="Text-only knowledge answer">
      <div className="research-result-head">
        <div>
          <span className="research-eyebrow"><BookOpen size={12} /> MODEL KNOWLEDGE · NO LIVE WEB</span>
          <h3>Knowledge answer</h3>
        </div>
        <span className="research-source-count">No live citations</span>
      </div>
      <p className="research-scope-note">
        This answer uses the model's existing knowledge, not a live web search. It may be outdated or incomplete, and no sources were verified. Check current information independently. Google's Free Tier may use prompts to improve products and allow human review; do not enter sensitive or personal information.
      </p>
      <div className="research-answer">{result.answer}</div>
      <div className="research-followups" aria-label="Explore this topic further">
        <span>Keep exploring</span>
        <button type="button" onClick={() => onFollowUp(`Explain the key ideas, assumptions, and open questions about: ${boundedQuestion}. Note anything you cannot verify.`)}>
          Go deeper <span aria-hidden="true">→</span>
        </button>
        <button type="button" onClick={() => onFollowUp(`Compare the main viewpoints about: ${boundedQuestion}. Clearly note uncertainty and any information that may need current verification.`)}>
          Compare viewpoints <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}
