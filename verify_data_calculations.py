#!/usr/bin/env python3
"""
Script to verify the data calculations for the AHRQ dashboard
"""

import pandas as pd
import json
from datetime import datetime

# Read the CSV file
csv_file = 'public/ahrq_check.csv'
df = pd.read_csv(csv_file)

print(f"=== AHRQ Data Analysis ===")
print(f"Total rows in CSV: {len(df)}")
print(f"Data columns: {', '.join(df.columns)}")
print()

# 1. Check total publication count (excluding header)
total_publications = len(df)
print(f"1. Total Publications: {total_publications}")
print()

# 2. Check year distribution and filtering from 2021 onwards
print("2. Year Distribution:")
year_counts = df['Publication_Year'].value_counts().sort_index()
print(year_counts)

# Filter for 2021 onwards
df_2021_onwards = df[df['Publication_Year'] >= 2021]
print(f"\nPublications from 2021 onwards: {len(df_2021_onwards)}")
print()

# 3. Check high-impact studies calculation
print("3. High-Impact Studies Analysis:")

# Count by criteria
govt_pubs = len(df[df['Publication_Type'] == 'GOVERNMENT'])
primary_analysis = len(df[df['Usage_Type'] == 'PRIMARY_ANALYSIS'])

# Check policy implications keywords
policy_keywords = ['informed', 'supports', 'led to', 'resulted in', 'influenced']
policy_impact_mask = df['Policy_Implications'].str.lower().str.contains('|'.join(policy_keywords), na=False)
policy_impact_count = policy_impact_mask.sum()

# High impact = GOVERNMENT OR PRIMARY_ANALYSIS OR (has policy impact keywords)
high_impact_mask = (
    (df['Publication_Type'] == 'GOVERNMENT') |
    (df['Usage_Type'] == 'PRIMARY_ANALYSIS') |
    policy_impact_mask
)
high_impact_total = high_impact_mask.sum()

print(f"  - Government publications: {govt_pubs}")
print(f"  - Primary Analysis publications: {primary_analysis}")
print(f"  - Publications with policy impact keywords: {policy_impact_count}")
print(f"  - Total High-Impact Studies: {high_impact_total}")
print()

# 4. Publication types distribution
print("4. Publication Types:")
pub_types = df['Publication_Type'].value_counts()
for pub_type, count in pub_types.items():
    print(f"  - {pub_type}: {count}")
print()

# 5. Research domains distribution
print("5. Research Domains:")
domains = df['Research_Domain'].value_counts()
for domain, count in domains.head(10).items():  # Show top 10
    print(f"  - {domain}: {count}")
print(f"  ... and {len(domains) - 10} more domains")
print()

# 6. Usage types distribution
print("6. Usage Types:")
usage_types = df['Usage_Type'].value_counts()
for usage_type, count in usage_types.items():
    print(f"  - {usage_type}: {count}")
print()

# 7. Geographic analysis
print("7. Geographic Focus:")
geo_focus = df['Geographic_Focus'].value_counts()
for geo, count in geo_focus.head(10).items():  # Show top 10
    print(f"  - {geo}: {count}")
print()

# 8. Verify specific calculations for the dashboard
print("8. Dashboard Metrics Verification:")
unique_domains = df['Research_Domain'].nunique()
recent_pubs = len(df[df['Publication_Year'] >= 2023])

print(f"  - Unique Research Domains: {unique_domains}")
print(f"  - Recent Publications (2023+): {recent_pubs}")
print(f"  - Publications 2021-2022: {len(df[(df['Publication_Year'] >= 2021) & (df['Publication_Year'] <= 2022)])}")
print(f"  - Publications 2023-2024: {len(df[(df['Publication_Year'] >= 2023) & (df['Publication_Year'] <= 2024)])}")
print()

# 9. Sample data check
print("9. Sample Data Check (first 3 rows):")
sample_cols = ['Publication_Type', 'Usage_Type', 'Publication_Year', 'Research_Domain']
print(df[sample_cols].head(3))
print()

# 10. Data quality check
print("10. Data Quality Check:")
print(f"  - Missing values in Usage_Type: {df['Usage_Type'].isna().sum()}")
print(f"  - Missing values in Publication_Year: {df['Publication_Year'].isna().sum()}")
print(f"  - Missing values in Research_Domain: {df['Research_Domain'].isna().sum()}")
print(f"  - Missing values in Policy_Implications: {df['Policy_Implications'].isna().sum()}")

# Save summary to file
summary = {
    'total_publications': int(total_publications),
    'publications_2021_onwards': int(len(df_2021_onwards)),
    'high_impact_studies': int(high_impact_total),
    'unique_domains': int(unique_domains),
    'recent_publications_2023_plus': int(recent_pubs),
    'publication_types': pub_types.to_dict(),
    'usage_types': usage_types.to_dict(),
    'year_distribution': year_counts.to_dict()
}

with open('data_verification_summary.json', 'w') as f:
    json.dump(summary, f, indent=2)

print("\nSummary saved to data_verification_summary.json")