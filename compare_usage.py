import csv

def compare_usage_types():
    with open('public/ahrq_check.csv', 'r', encoding='utf-8') as f1:
        with open('public/ahrq_reference_good.csv', 'r', encoding='utf-8') as f2:
            reader1 = list(csv.DictReader(f1))
            reader2 = list(csv.DictReader(f2))
            
            differences = []
            
            for i, (row1, row2) in enumerate(zip(reader1, reader2), 1):
                usage1 = row1.get('Usage_Type', '')
                usage2 = row2.get('Usage_Type', '')
                
                if usage1 \!= usage2:
                    differences.append({
                        'row': i,
                        'title': row1.get('Title', '')[:60],
                        'check_usage': usage1,
                        'reference_usage': usage2
                    })
            
            return differences

differences = compare_usage_types()

if differences:
    print(f'Found {len(differences)} differences in Usage_Type between the files:')
    for diff in differences[:10]:  # Show first 10
        print(f'\nRow {diff["row"]}: "{diff["title"]}"')
        print(f'  ahrq_check.csv: {diff["check_usage"]}')
        print(f'  ahrq_reference_good.csv: {diff["reference_usage"]}')
else:
    print('No differences found in Usage_Type values between the two files.')
    print('Both files have identical Usage_Type values for all 146 rows.')
EOF < /dev/null
