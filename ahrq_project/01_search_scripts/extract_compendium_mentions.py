#!/usr/bin/env python3
"""
Extract articles that definitely mention AHRQ Compendium
"""

import pandas as pd
import os

# Read the new discoveries
df = pd.read_csv('../04_results/deduplication/ahrq_new_unique_discoveries_20250625_210301.csv')

# Filter for articles from queries that specifically search for AHRQ Compendium
compendium_queries = [
    'TITLE-ABS-KEY("AHRQ Compendium")',
    'REF("AHRQ Compendium")',
    'TITLE-ABS-KEY(AHRQ AND compendium AND health)',
    'TITLE-ABS-KEY("Agency for Healthcare Research" W/15 compendium)'
]

# Filter articles
compendium_articles = df[df['query'].isin(compendium_queries)]

# Sort by relevance score
compendium_articles = compendium_articles.sort_values('relevance_score', ascending=False)

# Save results
output_path = '../04_results/ahrq_compendium_confirmed_new_20250625.csv'
compendium_articles.to_csv(output_path, index=False, encoding='utf-8-sig')

print(f"Found {len(compendium_articles)} articles mentioning AHRQ Compendium")
print(f"Saved to: {output_path}")

# Print summary
print("\nTop 10 AHRQ Compendium Articles:")
for idx, row in compendium_articles.head(10).iterrows():
    print(f"\n[{row['relevance_score']}] {row['title']}")
    print(f"   Year: {row['year']} | DOI: {row['doi']}")
    print(f"   Query: {row['query']}")