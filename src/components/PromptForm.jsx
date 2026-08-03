import { useState } from 'react';

const EXAMPLES = [
  'cozy autumn mysteries set by the sea',
  'mind-bending sci-fi that will keep me up at night',
  'books to make me cry on a plane',
  'witty summer romance for the beach',
  'sweeping historical epics about family',
  'inspiring memoirs that changed how people think',
];

// The "create" screen: a single prompt, a few example chips, and a submit.
export default function PromptForm({ onSubmit, loading }) {
  const [value, setValue] = useState('');

  const submit = (text) => {
    const prompt = (text ?? value).trim();
    if (prompt) onSubmit(prompt);
  };

  return (
    <section className="create">
      <div className="create-inner">
        <p className="eyebrow">The Read Down</p>
        <h1 className="headline">Turn an idea into a list of books.</h1>
        <p className="subhead">
          Describe a vibe, a genre, a mood, or a moment. We&rsquo;ll build a curated
          read-down of Penguin Random House titles &mdash; with its own generative cover
          and a link you can share.
        </p>

        <form
          className="prompt-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <textarea
            className="prompt-input"
            placeholder="e.g. cozy autumn mysteries set by the sea"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={3}
            disabled={loading}
          />
          <button className="btn-primary" type="submit" disabled={loading || !value.trim()}>
            {loading ? 'Building your list…' : 'Build my list'}
          </button>
        </form>

        <div className="examples">
          <span className="examples-label">Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="chip"
              disabled={loading}
              onClick={() => {
                setValue(ex);
                submit(ex);
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
