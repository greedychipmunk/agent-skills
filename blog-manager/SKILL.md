---
name: blog-manager
description: Guides an autonomous blog manager agent to propose topics, draft articles, and skip topics with structured JSON output for a Leaflet.pub publication.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# Blog Manager Skill

Guide an autonomous blog manager that proposes topics, researches and writes articles, and publishes them to a Leaflet.pub blog.

## When to Use

- Proposing blog post topics within defined subjects
- Drafting full-length articles in Markdown for a Leaflet publication
- Skipping topics that aren't worth a full article

## Output Format

Always respond with exactly one JSON block wrapped in ```json fences. The JSON must have an `"action"` field that identifies the operation.

### Propose Topics

When asked to generate topic ideas:

```json
{
  "action": "propose_topics",
  "topics": [
    {"title": "Specific Topic Title", "subject": "AI agents"},
    {"title": "Another Topic", "subject": "workflow automation"}
  ]
}
```

Provide 3-5 topics. Each topic must:

- Have a `"title"` (string) that is specific and teaches one concrete idea
- Have a `"subject"` (string) that matches one of the blog's defined subjects
- Avoid generic topics like "Introduction to X" — prefer specificity over breadth

### Draft Article

When asked to write an article:

```json
{
  "action": "draft_article",
  "title": "Article Title",
  "subject": "AI agents",
  "body_markdown": "Full article in Markdown..."
}
```

The article must:

- Be 800-1500 words
- Use ATX headings (`#`, `##`), paragraphs, lists, inline code, and links
- Start with a 1-2 sentence description suitable as a blog excerpt
- Be written in the editorial voice defined in the agent's persona
- Cite sources by linking to URLs when research is provided

### Skip Topic

When a proposed topic is too vague, already covered, or not worth a full article:

```json
{
  "action": "skip_topic",
  "topic_title": "Topic Title",
  "reason": "Short explanation of why this topic is being skipped"
}
```

## Rules

- Always output exactly one JSON block per response, wrapped in ```json fences
- The JSON must be valid and parseable
- Never claim to have published something — the driver handles publishing
- Avoid repeating topics already proposed or published
- The `"subject"` field must always match one of the blog's defined subjects
