import { useEffect, useRef, useState } from 'react';
import PromptForm from './components/PromptForm.jsx';
import ListView from './components/ListView.jsx';
import { curateList, hydrateSharedList } from './curate/curateList.js';
import { decodeListFromHash, encodeListToHash, isListRoute } from './share/encode.js';

export default function App() {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Ignore the one hashchange we trigger ourselves after building a list.
  const selfSet = useRef(false);

  // Reconstruct a shared list when the app loads on (or navigates to) a /list URL.
  useEffect(() => {
    const loadFromHash = () => {
      if (selfSet.current) {
        selfSet.current = false;
        return;
      }
      if (isListRoute()) {
        const shared = decodeListFromHash();
        if (shared) setList(hydrateSharedList(shared));
        else setList(null);
      } else {
        setList(null);
      }
    };
    loadFromHash();
    window.addEventListener('hashchange', loadFromHash);
    return () => window.removeEventListener('hashchange', loadFromHash);
  }, []);

  const handleSubmit = async (prompt) => {
    setLoading(true);
    setError(null);
    try {
      const result = await curateList(prompt, { count: 10 });
      selfSet.current = true;
      window.location.hash = encodeListToHash(result);
      setList(result);
    } catch (err) {
      setError(err.message || 'Something went wrong building your list.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    selfSet.current = true;
    window.location.hash = '';
    setList(null);
    setError(null);
  };

  return (
    <div className="app">
      {list ? (
        <ListView list={list} onReset={handleReset} />
      ) : (
        <PromptForm onSubmit={handleSubmit} loading={loading} />
      )}
      {error && <p className="error-banner">{error}</p>}
      <footer className="app-footer">
        PRH Read Down · concept prototype · generative covers by p5.js
      </footer>
    </div>
  );
}
