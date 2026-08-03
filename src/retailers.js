// Buy links, by ISBN. The PRH book page (via site search, which redirects to the
// book) is the "Add to Cart" target; the retailer chips link out by ISBN. The set
// mirrors the retailer row on a real PRH Read Down book card.

export function prhBookUrl(isbn) {
  return `https://www.penguinrandomhouse.com/search/site?q=${isbn}`;
}

export function retailerLinks(isbn) {
  return [
    { name: 'Amazon', url: `https://www.amazon.com/s?k=${isbn}` },
    { name: 'Barnes & Noble', url: `https://www.barnesandnoble.com/w/?ean=${isbn}` },
    { name: 'Books A Million', url: `https://www.booksamillion.com/p/${isbn}` },
    { name: 'Bookshop.org', url: `https://bookshop.org/book/${isbn}` },
    { name: 'Hudson Booksellers', url: `https://www.hudsonbooksellers.com/search?q=${isbn}` },
    { name: 'Target', url: `https://www.target.com/s?searchTerm=${isbn}` },
    { name: 'Walmart', url: `https://www.walmart.com/search?q=${isbn}` },
  ];
}
