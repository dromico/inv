# Context7 Library ID Cache

This file serves as a cache to track Context7-compatible library IDs that have been searched for and used in this project. Maintaining this cache helps avoid redundant searches and ensures consistent library ID usage across the project.

## Usage Guidelines

1. **Before searching for a new library:**
   - Check this file first
   - Use existing Library ID if available
2. **If Library ID not found:**
   - Perform new search using the `resolve-library-id` tool
   - Add new Library ID to this file
3. **Keep this file organized and up-to-date:**
   - Update timestamps when library IDs are used
   - Remove outdated or unused library IDs periodically

## Library ID Registry

| Library Name | Context7 Library ID | Last Used | Description |
|-------------|-------------------|-----------|-------------|
| React | facebook/react | 2025-04-28 | Core React library |
| Next.js | vercel/nextjs | 2025-04-28 | React framework for production |
| TypeScript | microsoft/typescript | 2025-04-28 | JavaScript with syntax for types |
| Tailwind CSS | tailwindlabs/tailwindcss | 2025-04-28 | Utility-first CSS framework |
| Supabase | /supabase/supabase | 2025-04-28 | The open source Firebase alternative |
| supabase-community/supabase-mcp | /supabase-community/supabase-mcp | 2025-05-02 | Supabase MCP Server |

## Notes

- The "Last Used" column should be updated whenever a library ID is used with the `get-library-docs` tool
- When adding new entries, follow the existing format for consistency
- Library IDs are obtained using the `resolve-library-id` tool from the Context7 MCP server