"use client";

import { useMemo, useState } from "react";
import type { CandidateLabel } from "../lib/passages";
import { passages } from "../lib/passages";
import { demoPlan, type ExplorerResponse } from "../lib/query-plan";

const starterQuestion = "Why did ancient writers think six was perfect?";

const initialData: ExplorerResponse = {
  question: starterQuestion,
  mode: "demo",
  model: "gpt-5.6-sol",
  responseId: null,
  notice: "A documented example is loaded. Run it to ask the librarian.",
  ...demoPlan(passages),
  passages,
};

const labels: Record<CandidateLabel, string> = {
  strong_match: "Number rant",
  contextual_match: "Needs context",
  incidental_quantity: "Mere quantity",
};

function shortLanguage(language: string) {
  return language === "Ancient Greek" ? "GRC" : "LAT";
}

export function ResearchWorkbench() {
  const [question, setQuestion] = useState(starterQuestion);
  const [data, setData] = useState<ExplorerResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<Record<string, CandidateLabel>>({});

  const judgments = useMemo(
    () => new Map(data.judgments.map((judgment) => [judgment.id, judgment])),
    [data.judgments],
  );

  async function runQuery(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setReviews({});
    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!response.ok) throw new Error("The librarian could not complete the request.");
      setData((await response.json()) as ExplorerResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Number Rants Explorer home">
          <span className="brand-mark">NR</span>
          <span>
            <strong>Number Rants</strong>
            <small>Explorer</small>
          </span>
        </a>
        <div className="header-meta">
          <span>OpenAI Build Week 2026</span>
          <a href="#method">Method</a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">A multilingual research instrument</p>
          <h1>Translate the question.<br />Not the library.</h1>
          <p className="dek">
            Ask in the language you know. Specialist librarians adapt your idea
            to the languages of the archive, then return the sources you should
            read—not an answer you have to trust.
          </p>
        </div>
        <aside className="hero-note">
          <span className="note-number">01</span>
          <p>
            This prototype traces one hard case: when a number stops counting
            things and starts meaning something.
          </p>
        </aside>
      </section>

      <section className="workbench" aria-labelledby="workbench-title">
        <div className="workbench-heading">
          <div>
            <p className="eyebrow">Head librarian</p>
            <h2 id="workbench-title">Begin with a research question</h2>
          </div>
          <span className={`mode-badge ${data.mode}`}>
            <span aria-hidden="true" />
            {data.mode === "live" ? "Live GPT-5.6" : "Documented demo"}
          </span>
        </div>

        <form className="query-form" onSubmit={runQuery}>
          <label htmlFor="research-question">Your question in English</label>
          <div className="query-row">
            <textarea
              id="research-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={3}
              maxLength={600}
            />
            <button type="submit" disabled={loading || !question.trim()}>
              {loading ? "Consulting shelves…" : "Build my reading list"}
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <div className="query-foot">
            <p>{data.notice}</p>
            <span>{question.length}/600</span>
          </div>
          {error ? <p className="error" role="alert">{error}</p> : null}
        </form>

        <ol className="process-rail" aria-label="Research workflow">
          <li className="complete"><span>1</span>Research question</li>
          <li className="complete"><span>2</span>Concept map</li>
          <li className="complete"><span>3</span>Language librarians</li>
          <li className="active"><span>4</span>Cited reading list</li>
        </ol>
      </section>

      <section className="plan-grid">
        <article className="concept-panel">
          <p className="eyebrow">What we mean</p>
          <h2>Query constellation</h2>
          <p className="panel-intro">{data.framing}</p>
          <div className="concept-list">
            {data.concepts.map((concept, index) => (
              <div className="concept" key={`${concept.term}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{concept.term}</strong>
                  <p>{concept.rationale}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="exclude-box">
            <strong>Keep out of the reading list</strong>
            <ul>
              {data.exclusions.map((exclusion) => <li key={exclusion}>{exclusion}</li>)}
            </ul>
          </div>
        </article>

        <div className="librarian-column">
          <div className="section-label">
            <p className="eyebrow">How each shelf hears it</p>
            <span>Concept-to-concept adaptation</span>
          </div>
          {data.librarians.map((librarian) => (
            <article className="librarian-card" key={librarian.language}>
              <div className="librarian-head">
                <span className="language-code">{shortLanguage(librarian.language)}</span>
                <div>
                  <h3>{librarian.language} librarian</h3>
                  <p>{librarian.shelf}</p>
                </div>
              </div>
              <div className="term-cloud">
                {librarian.terms.map((term) => <code key={term}>{term}</code>)}
              </div>
              <p className="librarian-note">{librarian.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="results-section" aria-labelledby="results-title">
        <div className="results-heading">
          <div>
            <p className="eyebrow">The shelf pull</p>
            <h2 id="results-title">Read these. Reject that.</h2>
          </div>
          <p>{data.passages.length} candidates · every quotation tied to a source</p>
        </div>

        <div className="results-list">
          {data.passages.map((passage, index) => {
            const judgment = judgments.get(passage.id);
            if (!judgment) return null;
            const activeLabel = reviews[passage.id] || judgment.label;
            return (
              <article className={`result-card ${activeLabel}`} key={passage.id}>
                <div className="result-index">{String(index + 1).padStart(2, "0")}</div>
                <div className="result-main">
                  <div className="result-meta">
                    <span className={`result-label ${activeLabel}`}>{labels[activeLabel]}</span>
                    <span>{passage.languageLabel}</span>
                    <span>{passage.dateLabel}</span>
                  </div>
                  <h3>{passage.author}, <em>{passage.work}</em> {passage.locus}</h3>
                  <blockquote lang={passage.language}>{passage.original}</blockquote>
                  <p className="translation">{passage.translation}</p>
                  <p className="translation-credit">{passage.translationCredit}</p>
                  <div className="why-row">
                    <div>
                      <span>Why it surfaced</span>
                      <p>{judgment.rationale}</p>
                    </div>
                    <div>
                      <span>Evidence span</span>
                      <code>{judgment.evidence}</code>
                    </div>
                  </div>
                  <div className="source-row">
                    <a href={passage.sourceUrl} target="_blank" rel="noreferrer">
                      Open source ↗
                    </a>
                    <span>{passage.sourceLabel}</span>
                    <span>{passage.rights}</span>
                  </div>
                </div>
                <aside className="review-panel">
                  <span>{Math.round(judgment.confidence * 100)}% model confidence</span>
                  <p>Your judgment</p>
                  <div className="review-buttons" aria-label={`Review ${passage.work}`}>
                    {(Object.keys(labels) as CandidateLabel[]).map((label) => (
                      <button
                        key={label}
                        type="button"
                        className={activeLabel === label ? "selected" : ""}
                        onClick={() => setReviews((current) => ({ ...current, [passage.id]: label }))}
                        aria-label={labels[label]}
                        title={labels[label]}
                      >
                        {label === "strong_match" ? "✓" : label === "contextual_match" ? "?" : "×"}
                      </button>
                    ))}
                  </div>
                </aside>
              </article>
            );
          })}
        </div>
      </section>

      <section className="method" id="method">
        <div>
          <p className="eyebrow">The method</p>
          <h2>The model proposes.<br />The archive proves.<br />The scholar decides.</h2>
        </div>
        <ol>
          <li><span>01</span><p><strong>Adapt the question</strong> across morphology, idiom, abbreviations, and historically specific concepts.</p></li>
          <li><span>02</span><p><strong>Search original-language text</strong> while keeping stable source IDs, exact locations, and rights attached.</p></li>
          <li><span>03</span><p><strong>Return a small reading list</strong> with visible reasons, evidence spans, and negative controls.</p></li>
          <li><span>04</span><p><strong>Leave interpretation to humans.</strong> Every model judgment remains inspectable and correctable.</p></li>
        </ol>
      </section>

      <footer>
        <div className="brand footer-brand">
          <span className="brand-mark">NR</span>
          <span><strong>Number Rants Explorer</strong><small>Built by Shay Cranmer + Avery</small></span>
        </div>
        <p>Code: MIT · Project documentation: CC BY 4.0 · Source rights travel with every record.</p>
        <a href="https://github.com/shaycranmer/number-rants-explorer" target="_blank" rel="noreferrer">View the method on GitHub ↗</a>
      </footer>
    </main>
  );
}
