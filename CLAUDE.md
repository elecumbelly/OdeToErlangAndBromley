# CLAUDE.md - AI Assistant Guide for OdeToErlang

**Last Updated:** 2025-11-23
**Repository:** elecumbelly/OdeToErlang
**License:** MIT
**Copyright:** 2025 SteS

---

## Repository Overview

### Purpose
OdeToErlang is a project exploring Erlang programming concepts, functional programming principles, and distributed systems architecture. The name suggests this may be a learning resource, tribute, or implementation inspired by Erlang's philosophy.

### Current State
- **Status:** Initial setup phase
- **Files:** LICENSE (MIT)
- **Branch Strategy:** Feature branches prefixed with `claude/`
- **Primary Language:** TBD (Likely Erlang/Elixir or related functional languages)

---

## Codebase Structure

### Current Layout
```
OdeToErlang/
├── LICENSE          # MIT License, Copyright 2025 SteS
└── CLAUDE.md        # This file (AI assistant guide)
```

### Expected Future Structure
```
OdeToErlang/
├── src/             # Source code
├── test/            # Test suites
├── docs/            # Documentation
├── examples/        # Example code and tutorials
├── scripts/         # Build and utility scripts
├── .github/         # GitHub workflows and configurations
├── LICENSE          # MIT License
├── README.md        # User-facing documentation
└── CLAUDE.md        # AI assistant guide (this file)
```

---

## Development Workflows

### Git Workflow

#### Branch Strategy
- **Development Branches:** Always use branches prefixed with `claude/` followed by session identifier
- **Example:** `claude/claude-md-mib2hvmqk83zob5b-016WfDnWa5ovXUrvj58YZfrs`
- **Main Branch:** Currently unnamed (will be established with first major commit)

#### Commit Guidelines
1. **Write clear, descriptive commit messages** in imperative mood
   - Good: "Add factorial implementation in Erlang"
   - Bad: "Added stuff" or "fixes"

2. **Structure commits logically:**
   - One logical change per commit
   - Group related changes together
   - Don't mix refactoring with feature additions

3. **Commit message format:**
   ```
   Brief summary (50 chars or less)

   More detailed explanation if needed. Wrap at 72 characters.
   Explain the what and why, not the how.

   - Bullet points are acceptable
   - Reference issues: #123
   ```

#### Push Guidelines
- **Always use:** `git push -u origin <branch-name>`
- **Branch naming:** Must start with `claude/` and end with matching session ID
- **Network failures:** Retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s)
- **Never force push** to main/master without explicit permission

### Pull Request Workflow

#### Before Creating a PR
1. Ensure all commits are on the correct `claude/` branch
2. Run all tests and verify they pass
3. Review all changes yourself first
4. Ensure code follows project conventions

#### PR Structure
```markdown
## Summary
- Bullet point summary of changes
- Focus on the "why" not just the "what"

## Changes
- Specific files/modules modified
- New functionality added
- Breaking changes (if any)

## Test Plan
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Code reviewed

## Related Issues
Closes #123
```

---

## Key Conventions for AI Assistants

### Code Analysis Protocol

#### Before Making Changes
1. **Always read files first** - Never propose changes to unread code
2. **Understand context** - Review related files and dependencies
3. **Check for patterns** - Identify existing code conventions and follow them
4. **Search before creating** - Look for existing similar functionality

#### When Exploring the Codebase
1. **Use Task tool with subagent_type=Explore** for broad questions:
   - "How does error handling work?"
   - "What is the module structure?"
   - "Where are API endpoints defined?"

2. **Use specific tools for targeted searches:**
   - `Glob` for finding files by pattern
   - `Grep` for finding specific code patterns
   - `Read` for examining file contents

### Development Principles

#### Simplicity First
- **Avoid over-engineering** - Only add what's needed for the current task
- **No premature abstractions** - Three similar lines is better than a premature abstraction
- **YAGNI (You Aren't Gonna Need It)** - Don't design for hypothetical futures
- **No extra features** - A bug fix doesn't need surrounding code cleanup

#### Code Quality
- **No security vulnerabilities:**
  - Command injection
  - XSS attacks
  - SQL injection
  - OWASP Top 10 vulnerabilities

- **Error handling:**
  - Only validate at system boundaries (user input, external APIs)
  - Trust internal code and framework guarantees
  - Don't add error handling for scenarios that can't happen

- **Clean deletions:**
  - Remove unused code completely
  - No backwards-compatibility hacks without justification
  - No `_unused_vars`, `// removed` comments, or dead code

#### Documentation Standards
- **Comments:** Only where logic isn't self-evident
- **Don't add comments to unchanged code**
- **Don't add docstrings unless:**
  - You created the function
  - It's a public API
  - The behavior is non-obvious

### Task Management

#### Using TodoWrite
1. **Use for tasks with 3+ steps** or non-trivial complexity
2. **Don't use for:**
   - Single straightforward tasks
   - Trivial operations
   - Purely conversational requests

3. **Task states:**
   - `pending`: Not started
   - `in_progress`: Currently working (only ONE at a time)
   - `completed`: Finished successfully

4. **Task format:**
   ```javascript
   {
     content: "Run the build",        // Imperative form
     activeForm: "Running the build", // Present continuous
     status: "in_progress"
   }
   ```

5. **Mark completed immediately** - Don't batch completions
6. **Only mark complete when fully done** - If blocked, keep as in_progress

---

## Language-Specific Conventions

### Erlang (Expected Primary Language)

#### File Organization
- **Module files:** One module per file
- **File naming:** `module_name.erl`
- **Test files:** `module_name_tests.erl`

#### Code Style (To be established)
- **Indentation:** TBD (typically 4 spaces)
- **Line length:** TBD (typically 80-100 characters)
- **Naming conventions:**
  - Functions: `snake_case`
  - Variables: `CamelCase`
  - Atoms: `lowercase_with_underscores`

#### Testing
- **Framework:** TBD (likely EUnit or Common Test)
- **Test coverage:** Aim for meaningful coverage, not 100%
- **Test naming:** Descriptive names that explain what's being tested

---

## Project-Specific Guidelines

### Philosophy
Given the name "OdeToErlang," this project should embrace:
- **Functional programming principles**
- **Immutability by default**
- **Concurrent and distributed thinking**
- **Let it crash philosophy**
- **Pattern matching over conditionals**
- **Message passing for communication**

### Design Goals (To be refined)
- [ ] Demonstrate Erlang/OTP principles
- [ ] Provide clear, educational examples
- [ ] Maintain clean, idiomatic code
- [ ] Foster understanding of concurrent systems
- [ ] Build fault-tolerant applications

---

## Communication Guidelines

### Output Style
- **Be concise** - Output is displayed in CLI
- **Use markdown** - GitHub-flavored markdown is supported
- **No unnecessary emojis** - Only if explicitly requested
- **Direct communication** - Output text directly, not through bash echo or comments
- **Professional tone** - Objective, technical, factual

### Tool Usage
- **Parallel execution:** Call independent tools together in one message
- **Sequential when needed:** Wait for results if there are dependencies
- **Never guess parameters:** Ask if required values are missing
- **Prefer specialized tools:** Use Read/Edit/Write instead of cat/sed/echo

---

## Security Guidelines

### Authorized Activities
✅ Defensive security implementations
✅ Security testing with authorization
✅ CTF challenges and educational contexts
✅ Security research with proper context

### Prohibited Activities
❌ Destructive techniques
❌ DoS attacks
❌ Mass targeting
❌ Supply chain compromise
❌ Detection evasion for malicious purposes

### Dual-Use Tools
Require clear authorization context for:
- C2 frameworks
- Credential testing
- Exploit development

---

## Maintenance Notes

### When to Update This File
- Major architectural changes
- New language/framework adoption
- Established code conventions
- New development workflows
- Team decisions on standards
- Tool or dependency changes

### Update Protocol
1. Read current CLAUDE.md
2. Make necessary changes
3. Update "Last Updated" date
4. Document what changed and why
5. Commit with clear message: "Update CLAUDE.md: [what changed]"

---

## Quick Reference

### Essential Commands
```bash
# Check repository status
git status

# Create and switch to feature branch
git checkout -b claude/feature-name-<session-id>

# Stage and commit changes
git add <files>
git commit -m "Your message"

# Push to remote
git push -u origin <branch-name>

# Check recent commits
git log --oneline -10
```

### Common AI Assistant Tasks
1. **Analyzing code:** Read → Understand → Report
2. **Adding features:** Read → Plan (TodoWrite) → Implement → Test → Commit
3. **Fixing bugs:** Reproduce → Read → Fix → Test → Commit
4. **Refactoring:** Read → Plan → Refactor → Test → Commit

### File Operation Tools
- **Finding files:** `Glob` with patterns like `**/*.erl`
- **Searching code:** `Grep` with regex patterns
- **Reading:** `Read` for file contents
- **Editing:** `Edit` for precise string replacement
- **Creating:** `Write` for new files (use sparingly)

---

## Resources

### Erlang Documentation
- [Official Erlang Documentation](https://www.erlang.org/docs)
- [Learn You Some Erlang](https://learnyousomeerlang.com/)
- [Erlang/OTP Design Principles](https://www.erlang.org/doc/design_principles/users_guide.html)

### Git Resources
- [Git Documentation](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Project Links
- **Repository:** elecumbelly/OdeToErlang
- **License:** MIT (see LICENSE file)
- **Issues:** Use GitHub issues for tracking

---

## Notes for Future Development

### Areas to Define
- [ ] Primary programming language confirmation
- [ ] Build system and tooling
- [ ] Testing framework
- [ ] CI/CD pipeline
- [ ] Documentation generation
- [ ] Dependency management
- [ ] Release process
- [ ] Contributing guidelines

### Questions to Address
- What specific Erlang concepts will be explored?
- Is this a learning resource, library, or application?
- What's the target audience (beginners, experts)?
- Will this include OTP patterns and supervision trees?
- Are there specific performance or scalability goals?

---

*This document is a living guide that should evolve with the project. Keep it updated, concise, and useful for both AI assistants and human developers.*
