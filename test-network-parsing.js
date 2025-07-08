// Test the author parsing with actual CSV data samples
const testAuthors = [
  "Becker C.; [+ others]",
  "[Vishaal Pegany, Deputy Director; CJ Howard, Assistant Deputy Director; Andrew Feher, Research and Analysis Group Manager; David Seltz, Executive Director, Massachusetts Health Policy Commission; Sarah Bartelmann, Cost Growth Target & Health Care Market Oversight Program Manager, Oregon Health Authority; Michael Valle, Deputy Director and Chief Information Officer; Dionne Evans-Dean, Chief Data Officer; Chris Krawczyk, Chief Analytics Officer; Margareta Brandt, Assistant Deputy Director]",
  "[Medicare Payment Advisory Commission]",
  "Zachary Levinson, Jamie Godwin, Scott Hulver, and Tricia Neuman"
];

// Simulate the parseAuthors function
function parseAuthors(authorString) {
  if (!authorString || authorString.trim() === '') return [];
  
  let cleanedString = authorString
    .replace(/\[\s*\+\s*others?\s*\]/gi, '')
    .replace(/\[\s*et\s*al\.?\s*\]/gi, '')
    .trim();
  
  const bracketMatch = cleanedString.match(/^\[(.*)\]$/);
  if (bracketMatch) {
    cleanedString = bracketMatch[1];
  }
  
  let authors = cleanedString
    .split(/[;]/)
    .map(author => author.trim())
    .filter(author => author.length > 0);
  
  if (authors.length === 1 && authors[0].includes(',')) {
    if (!authors[0].match(/^[^,]+,\s*[^,]+$/)) {
      authors = authors[0].split(',').map(a => a.trim());
    }
  }
  
  authors = authors
    .map(author => {
      author = author.replace(/\[.*?\]/g, '').trim();
      return author
        .replace(/\s+(Jr\.?|Sr\.?|III?|PhD|MD|MPH)$/i, '')
        .replace(/^\s*Dr\.?\s+/i, '')
        .replace(/,\s*(Deputy\s+)?Director.*$/i, '')
        .replace(/,\s*Assistant.*$/i, '')
        .replace(/,\s*Chief.*$/i, '')
        .replace(/,\s*Manager.*$/i, '')
        .trim();
    })
    .filter(author => {
      if (author.length <= 2) return false;
      if (/^(Director|Manager|Chief|Assistant|Deputy)$/i.test(author)) return false;
      return true;
    });
    
  return [...new Set(authors)];
}

console.log("Testing author parsing:\n");
testAuthors.forEach((authorString, i) => {
  console.log(`Test ${i + 1}: "${authorString}"`);
  console.log("Parsed:", parseAuthors(authorString));
  console.log("");
});