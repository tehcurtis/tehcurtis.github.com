---
layout: post
title: hello, here's project cyclic
date: 2026-08-15 14:20 -0700
categories:
- ai
- python
---
Hello. Hope your 2026 is going well. I want to get back in the habit of manually writing and tinkering with things. Riding the AI/LLM exponential has been fun, but I want to continue to learn and develop my writing skills. I figured posting about this one project I've been working on would be a good place to start.

[Cyclic](https://github.com/tehcurtis/project-cyclic) is a project I've been using to explore building and running a self-healing code execution agent. You can use it to ask for help with coding exercises, for example:

```bash
uv run cyclic run "Can you give me the solution to leetcode problem 295. Find Median from Data Stream"
```

It will return a cached response or it will send the request to the target LLM, get the response, and then cache the response for similar questions asked in the future. This gives me a chance to tinker with some semantic caching and code execution sandboxing, two areas I think are very important in building agentic apps. The code that's generated is run in a Docker sandbox to ensure it's safe and correct before it's returned to the user.

It's also "self-healing" in the way it will attempt to generate correct code given the boundaries of its environment (a sandboxed Docker container that won't allow everything to run). It will try up to three times to generate runnable, correct code.

The local semantic cache is powered by Chroma for no particular reason. Also noteworthy is that currently, the only programming language that's supported is Python, so that's what you'll get. It won't return solutions in any other PL even if you ask it to.

This seemed like a fun little thing to tinker with, a venue to try out certain concepts and techniques. If anything else interesting develops out of it, I'll post it here.

Cheers to continued tinkering and hacking!
