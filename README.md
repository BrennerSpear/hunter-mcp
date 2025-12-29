# Hunter.io MCP Server

MCP server for Hunter.io email finder and verifier.

## Setup

1. Get your API key from [Hunter.io](https://hunter.io/api-keys)

2. Create the secrets file:
```bash
mkdir -p ~/.claude/secrets/hunter
echo "HUNTER_API_KEY=your_api_key_here" > ~/.claude/secrets/hunter/.env
```

3. Install dependencies:
```bash
pnpm install
```

4. Add to your Claude config (`~/.claude.json`):
```json
{
  "mcpServers": {
    "hunter": {
      "command": "npx",
      "args": ["tsx", "/Users/brenner/repos/hunter-mcp/src/index.ts"]
    }
  }
}
```

## Tools

### find_email_by_name
Find the most likely email address for a person at a company.

**Parameters:**
- `domain` - Company domain (e.g., "stripe.com")
- `first_name` - Person's first name
- `last_name` - Person's last name

**Returns:** `{ email, score, status }`

### verify_email
Verify if an email address is valid and deliverable.

**Parameters:**
- `email` - Email address to verify

**Returns:** `{ email, status, score }`

Status values: `valid`, `invalid`, `accept_all`, `webmail`, `disposable`, `unknown`
