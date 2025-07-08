// Test script to verify author parsing
import { AuthorService } from './src/services/authorService.js';

// Test cases from the CSV
const testCases = [
  "Rhudy, Lara M.; Peltier, M. Rachel; Marsh, Wendy; Watt, Marissa H.",
  "Siegel, Rebecca L.; Giaquinto, Angela N.; Jemal, Ahmedin",
  "Scott, John W., Davis, Kimberly A.; Salim, Ali; Joudi, Rayan S.; Ali, Zain; Ashley, Steven W.; Panda, Nikhil; Farhat, Mark; Sokas, Claire M.; Jarman, Molly P., Brown, Carlos V. R.; Havens, Joaquim M.; Meier, Kristan; Moore, Marta",
  "Aragon F.; Walia D.; Cao D.; Chen MK.",
  "Office of Rural Health Policy, Health Resources and Services Administration (HRSA), United States Department of Health and Human Services (HHS)",
  "Ahrq",
  "National Center for Health Statistics"
];

console.log("Testing Author Parsing Service\n");

testCases.forEach((testCase, index) => {
  console.log(`\nTest Case ${index + 1}:`);
  console.log(`Raw: "${testCase}"`);
  
  const result = AuthorService.parseAuthors(testCase);
  console.log(`Parsed Authors (${result.authors.length}):`);
  result.authors.forEach((author, i) => {
    console.log(`  ${i + 1}. ${author.fullName} ${author.isInstitution ? '[Institution]' : `(${author.firstName} ${author.lastName})`}`);
  });
  console.log(`Formatted: "${result.formattedString}"`);
  console.log(`Compact (max 2): "${AuthorService.formatAuthorList(result.authors, { maxAuthors: 2 })}"`);
  console.log(`Last names only: "${AuthorService.formatAuthorList(result.authors, { useLastNameOnly: true })}"`);
});