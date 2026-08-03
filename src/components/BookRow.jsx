import { useState } from 'react';
import { coverUrls } from '../covers.js';
import { prhBookUrl, retailerLinks } from '../retailers.js';

// One book card, modeled on the real PRH Read Down entry:
//   top region  — title / author / description (left) + cover + Add to Bookshelf (right)
//   divider
//   bottom region — format · price + Add to Cart (left) + retailer chips (right)
export default function BookRow({ book }) {
  const urls = coverUrls(book.isbn);
  const [urlIndex, setUrlIndex] = useState(0);
  const [saved, setSaved] = useState(false);

  const handleError = () => {
    if (urlIndex < urls.length - 1) setUrlIndex(urlIndex + 1);
  };

  const bookUrl = prhBookUrl(book.isbn);
  const retailers = retailerLinks(book.isbn);

  return (
    <li className="prh-card">
      <div className="prh-card-top">
        <div className="prh-card-main">
          <h3 className="prh-title">
            <a href={bookUrl} target="_blank" rel="noopener noreferrer">{book.title}</a>
          </h3>
          <p className="prh-author">
            by{' '}
            <a className="author-link" href={bookUrl} target="_blank" rel="noopener noreferrer">
              {book.author}
            </a>
          </p>
          {book.why && <p className="prh-why">{book.why}</p>}
          <p className="prh-desc">{book.blurb}</p>
        </div>

        <div className="prh-card-aside">
          <a className="prh-card-cover" href={bookUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${book.title}`}>
            <img src={urls[urlIndex]} alt={`Cover of ${book.title} by ${book.author}`} onError={handleError} />
          </a>
          <button
            type="button"
            className={`bookshelf-btn${saved ? ' is-saved' : ''}`}
            onClick={() => setSaved((s) => !s)}
          >
            <img
              className="bookshelf-icon"
              src="/images/save-20x22.svg"
              width="20"
              height="22"
              alt=""
              aria-hidden="true"
            />
            {saved ? 'On Your Bookshelf' : 'Add to Bookshelf'}
          </button>
        </div>
      </div>

      <hr className="prh-card-rule" />

      <div className="prh-card-bottom">
        <div className="prh-buy-left">
          <p className="prh-format">
            <span className="fmt">Paperback</span> <span className="price">$18.00</span>
          </p>
          <a className="btn-cart" href={bookUrl} target="_blank" rel="noopener noreferrer">
            Add to Cart
          </a>
        </div>

        <div className="prh-buy-right">
          <p className="retailers-label">Buy from Other Retailers:</p>
          <ul className="retailer-grid">
            {retailers.map((r) => (
              <li key={r.name}>
                <a className="retailer-btn" href={r.url} target="_blank" rel="noopener noreferrer">
                  {r.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}
