# Setting up Context7 MCP Server

This guide provides step-by-step instructions for setting up the Context7 MCP server, which allows you to get up-to-date documentation for various libraries directly in your prompts.

## Prerequisites

- Node.js >= v18.0.0
- npm (comes with Node.js)

## Installation Steps

1. Create the MCP directory:
   ```bash
   # For Windows
   mkdir "%USERPROFILE%\Documents\Cline\MCP"
   
   # For macOS/Linux
   mkdir -p ~/Documents/Cline/MCP
   ```

2. Install Context7 MCP globally:
   ```bash
   npm install -g @upstash/context7-mcp
   ```

3. Locate your MCP settings file based on your environment:
   - For Cline:
     ```
     # Windows
     %APPDATA%\Code - Insiders\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
     
     # macOS
     ~/Library/Application Support/Code - Insiders/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
     
     # Linux
     ~/.config/Code - Insiders/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
     ```
   
   - For Claude Desktop:
     ```
     # Windows
     %APPDATA%\Claude\claude_desktop_config.json
     
     # macOS
     ~/Library/Application Support/Claude/claude_desktop_config.json
     
     # Linux
     ~/.config/Claude/claude_desktop_config.json
     ```

4. Find your global npm modules directory:
   ```bash
   npm root -g
   ```
   This will output your global npm modules path. Save this for the next step.

5. Add the following configuration to your settings file, replacing `<GLOBAL_NPM_PATH>` with the path from step 4:
   ```json
   {
     "mcpServers": {
       "context7": {
         "command": "node",
         "args": ["<GLOBAL_NPM_PATH>/@upstash/context7-mcp/dist/index.js"],
         "transportType": "stdio",
         "disabled": false,
         "autoApprove": []
       }
     }
   }
   ```
   Note: On Windows, make sure to use double backslashes in the path (e.g., `C:\\Users\\...`).

## Troubleshooting

If you encounter connection issues, try these alternatives:

1. Using npx (recommended for most users):
   ```json
   {
     "mcpServers": {
       "context7": {
         "command": "npx",
         "args": ["-y", "@upstash/context7-mcp"],
         "transportType": "stdio",
         "disabled": false,
         "autoApprove": []
       }
     }
   }
   ```

2. Using bunx (requires Bun to be installed):
   ```json
   {
     "mcpServers": {
       "context7": {
         "command": "bunx",
         "args": ["-y", "@upstash/context7-mcp"],
         "transportType": "stdio",
         "disabled": false,
         "autoApprove": []
       }
     }
   }
   ```

3. Using Deno (requires Deno to be installed):
   ```json
   {
     "mcpServers": {
       "context7": {
         "command": "deno",
         "args": ["run", "--allow-net", "npm:@upstash/context7-mcp"],
         "transportType": "stdio",
         "disabled": false,
         "autoApprove": []
       }
     }
   }
   ```

## Verifying Installation

You can verify the installation by using the MCP Inspector:
```bash
npx -y @modelcontextprotocol/inspector npx @upstash/context7-mcp@latest
```

This will start a web interface at http://127.0.0.1:6274 where you can test the server's functionality.

## Available Tools

The Context7 MCP server provides two main tools:

1. resolve-library-id
   - Purpose: Resolves a general package name into a Context7-compatible library ID
   - Required parameter: libraryName (string)

2. get-library-docs
   - Purpose: Fetches documentation for a library using its Context7-compatible library ID
   - Required parameter: context7CompatibleLibraryID (string)
   - Optional parameters:
     - topic (string): Focus the docs on a specific topic (e.g., "routing", "hooks")
     - tokens (number, default 5000): Max number of tokens to return

## Usage

Once installed, you can use Context7 by adding "use context7" to your prompts. For example:
```
Create a basic Next.js project with app router. use context7
```

The system will automatically fetch up-to-date documentation and code examples for the libraries mentioned in your prompt.

## Testing Your Installation

After setting up, you can test if the server is working correctly:

1. First, try resolving a library ID:
   ```
   Ask the AI: "What's the Context7-compatible library ID for React? use context7"
   ```

2. Then, try fetching documentation:
   ```
   Ask the AI: "Show me React hooks documentation. use context7"
   ```

If both commands work, your Context7 MCP server is properly configured and ready to use.
