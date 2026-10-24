import type { ReactNode } from "react";
import { ExternalLink, Search } from "lucide-react";
import type { WebResearchResponse } from "../lib/webResearchApi";

type Props = {
  result: WebResearchResponse;
  question: string;
  onFollowUp: (question: string) => void;
};

function renderAnswerWithCitations(result: WebResearchResponse): ReactNode[] {
  const answer = result.answer;
  const grouped = new Map<number, Set<number>>();
  for (const citation of result.citations ?? []) {
    if (!Number.isInteger(citation.endIndex) || citation.endIndex < 0 || citation.endIndex > answer.length) {
      continue;
    }
    const indices = grouped.get(citation.endIndex) ?? new Set<number>();
    citation.sourceIndices.forEach(index => indices.add(index));
    grouped.set(citation.endIndex, indices);
  }

  const nodes: ReactNode[] = [];
  let cursor = 0;
  const ends = [...grouped.keys()].sort((left, right) => left - right);
  for (const endIndex of ends) {
    if (endIndex <= cursor) continue;
    nodes.push(answer.slice(cursor, endIndex));
    for (const sourceIndex of grouped.get(endIndex) ?? []) {
      const source = result.sources[sourceIndex];
      if (!source) continue;
      nodes.push(
        <a
          className="grounded-citation"
          href={source.url}
          key={`citation-${endIndex}-${sourceIndex}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open source: ${source.title}`}
        >
          [{sourceIndex + 1}]
        </a>
      );
    }
    cursor = endIndex;
  }
  if (cursor < answer.length) nodes.push(answer.slice(cursor));
  return nodes;
}

export function WebResearchPanel({ result, question, onFollowUp }: Props) {
  const boundedQuestion = question.slice(0, 700);
  return (
    <article className="web-research-result" data-cursor-spotlight aria-label="Google Search research result">
      <div className="research-result-head">
        <div>
          <span className="research-eyebrow"><Search size={12} /> GOOGLE SEARCH · LIVE WEB RESEARCH</span>
          <h3>Grounded answer</h3>
        </div>
        <span className="research-source-count">{result.sources.length} cited sources</span>
      </div>
      <p className="research-scope-note">
        Searched public web sources for this question. Coverage depends on Google's index and the sources available at query time; this is not an unlimited or complete copy of the internet.
      </p>
      <p className="research-answer">{renderAnswerWithCitations(result)}</p>
      <div className="google-search-suggestions" aria-label="Google Search suggestions">
        <iframe
          title="Google Search suggestions for this answer"
          srcDoc={result.searchSuggestionsHtml}
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          loading="lazy"
        />
      </div>
      <div className="research-sources">
        <span className="research-sources-label">Sources returned for this question</span>
        <ol>
          {result.sources.map((source, index) => (
            <li key={`${source.url}-${index}`}>
              <a href={source.url} target="_blank" rel="noreferrer">
                <span className="source-number">{index + 1}</span>
                <span className="source-title">{source.title}</span>
                <ExternalLink size={12} />
              </a>
            </li>
          ))}
        </ol>
      </div>
      <div className="research-followups" aria-label="Explore this topic further">
        <span>Keep exploring</span>
        <button type="button" onClick={() => onFollowUp(`Go deeper on: ${boundedQuestion}. Explain the strongest evidence, open questions, and what changed recently.`)}>
          Go deeper <span aria-hidden="true">→</span>
        </button>
        <button type="button" onClick={() => onFollowUp(`Find a different perspective on: ${boundedQuestion}. Compare credible viewpoints and cite the evidence for each.`)}>
          Find another perspective <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}
