# Context7 Usage Guidelines

## Token Range Guidelines

When using Context7 for documentation retrieval:
- Keep output tokens between 2,000 to 10,000 tokens
- Adjust token count based on the specific needs of the query
- Use judgment to determine optimal token count within this range

## Library ID Management

### Requirements
- Maintain a `library.md` file to track all searched Library IDs
- This file serves as a cache to avoid redundant searches

### Process
1. Before searching for a new library:
   - Check `library.md` first
   - Use existing Library ID if available
2. If Library ID not found:
   - Perform new search
   - Add new Library ID to `library.md`

### Best Practices
- Keep `library.md` organized and up-to-date
- Include timestamp of when Library IDs were last used/verified
- Remove outdated or unused Library IDs periodically

### Supabase Ubstructions
-  Use supabase mcp server when dealing with database.