#!/usr/bin/env python3
"""
Fix search configuration to resolve 401 authorization error
"""

import json

# Read current config
with open('search_config.json', 'r') as f:
    config = json.load(f)

# Fix the view parameter
config['search_parameters']['view'] = 'STANDARD'

# Simplify sort
config['search_parameters']['sort_by'] = '-pubyear'

# Remove field parameter (not needed with STANDARD view)
if 'field' in config['search_parameters']:
    del config['search_parameters']['field']

# Save updated config
with open('search_config.json', 'w') as f:
    json.dump(config, f, indent=2)

print("✅ Fixed search configuration:")
print("  - Changed view from COMPLETE to STANDARD")
print("  - Simplified sort parameter")
print("  - Removed field parameter")
print("\nYou can now run ahrq_master_search.py without authorization errors!")