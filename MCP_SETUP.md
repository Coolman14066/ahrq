# Playwright MCP Server Setup Guide

This guide explains how to use the Playwright Model Context Protocol (MCP) server that has been configured for the AHRQ Dashboard project.

## What is MCP?

Model Context Protocol (MCP) is a protocol that allows AI assistants (like Claude) to interact with external tools and services. The Playwright MCP server specifically enables browser automation capabilities, allowing AI to:

- Navigate web pages
- Extract data from websites
- Take screenshots
- Run automated tests
- Generate test code
- Execute JavaScript in browsers

## Installation Status

✅ **Already Installed!** The Playwright MCP server has been configured for this project:

- Configuration file: `.mcp.json`
- Package: `@executeautomation/playwright-mcp-server` (v1.0.6)
- Location: Added to `devDependencies` in `package.json`

## Configuration

The MCP configuration is stored in `.mcp.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}
```

## How to Use with Claude Desktop

1. **For Claude Desktop users**: The `.mcp.json` file will be automatically detected
2. **Restart Claude Desktop** after the configuration is added
3. The Playwright tools will be available in your Claude conversations

## Available Playwright Tools

When using Claude with the Playwright MCP server, you can request the following actions:

### Navigation & Interaction
- `playwright_navigate [url]` - Navigate to a URL
- `playwright_click [selector]` - Click an element
- `playwright_fill [selector] [text]` - Fill in a form field
- `playwright_press [key]` - Press a keyboard key
- `playwright_hover [selector]` - Hover over an element
- `playwright_select [selector] [value]` - Select dropdown option

### Waiting & Synchronization
- `playwright_wait_for_selector [selector]` - Wait for element to appear
- `playwright_wait_for_timeout [ms]` - Wait for specified time
- `playwright_wait_for_download` - Wait for download to complete

### Data Extraction
- `playwright_get_visible_html [selector]` - Get HTML content
- `playwright_evaluate [js_code]` - Execute JavaScript and return result
- `playwright_screenshot [filename]` - Take a screenshot

### Configuration
- `playwright_set_viewport [width] [height]` - Set browser viewport size

## Use Cases for AHRQ Dashboard

### 1. Automated Testing
Test the AHRQ Dashboard components:

```javascript
// Example: Test dashboard loading
playwright_navigate http://localhost:5173
playwright_wait_for_selector .dashboard-loaded
playwright_screenshot dashboard-test.png
```

### 2. Data Collection
Enhance existing data collection scripts:

```javascript
// Example: Scrape AHRQ compendium updates
playwright_navigate https://ahrq.gov/compendium
playwright_get_visible_html .compendium-list
playwright_evaluate () => document.querySelectorAll('.citation').length
```

### 3. Visual Regression Testing
Capture screenshots for visual comparisons:

```javascript
// Example: Capture all visualizations
playwright_navigate http://localhost:5173
playwright_wait_for_selector .recharts-wrapper
playwright_screenshot charts.png
playwright_wait_for_selector .network-graph
playwright_screenshot network.png
```

### 4. Performance Testing
Measure page load times and performance:

```javascript
// Example: Measure load performance
playwright_navigate http://localhost:5173
playwright_evaluate () => performance.timing.loadEventEnd - performance.timing.navigationStart
```

## Example Test Scripts

We've created example test scripts in the `playwright-tests/` directory:

1. **dashboard-test.example.js** - Test scenarios for the AHRQ Dashboard
2. **data-scraping.example.js** - Web scraping examples for research data
3. **integration-example.js** - Integration with existing AHRQ scripts

## Integration with Existing Scripts

The Playwright MCP server can enhance your existing Python data collection scripts:

```python
# Example: Enhance scopus_search_details.py
import subprocess
import json

def scrape_with_playwright(url):
    commands = [
        f'playwright_navigate {url}',
        'playwright_wait_for_selector .results',
        'playwright_get_visible_html .results'
    ]
    # Execute through MCP server
    result = subprocess.run(['npx', '@executeautomation/playwright-mcp-server'] + commands)
    return result.stdout
```

## Running Tests

To use Playwright MCP for testing:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. In Claude Desktop, request Playwright actions:
   ```
   "Please test the dashboard by navigating to http://localhost:5173 and taking screenshots of all major components"
   ```

3. Claude will execute the Playwright commands through the MCP server

## Best Practices

1. **Wait for Elements**: Always wait for elements before interacting:
   ```javascript
   playwright_wait_for_selector .element
   playwright_click .element
   ```

2. **Handle Dynamic Content**: Use appropriate waits for JavaScript-rendered content:
   ```javascript
   playwright_wait_for_selector .dynamic-content
   playwright_wait_for_timeout 1000  // Additional wait if needed
   ```

3. **Error Handling**: Request Claude to verify elements exist before interaction:
   ```javascript
   playwright_evaluate document.querySelector('.element') !== null
   ```

4. **Screenshots for Debugging**: Take screenshots at key points:
   ```javascript
   playwright_screenshot before-action.png
   playwright_click .button
   playwright_screenshot after-action.png
   ```

## Troubleshooting

### MCP Server Not Available
- Ensure Claude Desktop is restarted after configuration
- Check that `.mcp.json` is in the project root
- Verify the package is installed: `npm list @executeautomation/playwright-mcp-server`

### Commands Not Working
- Ensure your local development server is running for local URLs
- Check selectors are correct and elements exist
- Use `playwright_wait_for_selector` before interactions

### Performance Issues
- Limit the number of screenshots in automated workflows
- Use `playwright_set_viewport` to test specific screen sizes
- Close browser sessions when done with testing

## Advanced Usage

### Continuous Monitoring
Set up automated monitoring of AHRQ resources:

```javascript
// Daily check for compendium updates
playwright_navigate https://ahrq.gov/compendium
playwright_evaluate () => document.querySelector('.last-updated')?.textContent
// Compare with stored value to detect changes
```

### Automated Report Generation
Generate visual reports of dashboard state:

```javascript
// Capture all views
const views = ['overview', 'trends', 'network', 'gaps'];
for (const view of views) {
  playwright_navigate `http://localhost:5173#${view}`
  playwright_wait_for_selector `.${view}-loaded`
  playwright_screenshot `report-${view}.png`
}
```

## Security Considerations

- Never use Playwright MCP to enter sensitive credentials
- Be cautious when scraping external websites (respect robots.txt)
- Use environment variables for any authentication needs
- Limit access to production systems

## Next Steps

1. Explore the example test files in `playwright-tests/`
2. Try running Playwright commands through Claude Desktop
3. Integrate Playwright MCP with your existing data collection workflows
4. Create custom test scenarios for your specific needs

For more information about Playwright MCP Server, visit:
https://github.com/executeautomation/mcp-playwright