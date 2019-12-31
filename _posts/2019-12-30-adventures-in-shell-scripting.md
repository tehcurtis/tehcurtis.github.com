---
layout: post
title: Adventures in shell scripting
date: 2019-12-30 21:27 -0700
categories: [bash shell scripting]
---

I don't write bash or shell scripts everyday, but I write it enough to have picked up some useful tips. Some of those tips I'm constantly forgetting,
so as part of an effort to further cement their usefulness to memory, I figure I could jot them down here as I think of them.

I am a big fan of linters and using tooling to help write clean code where possible, so this tip should come as no surprise: Use [shellcheck](https://github.com/koalaman/shellcheck)!
If you're writing shell scripts, you should use something that will help enforce some kind of consistent style. You never
know who might have to add code to your script in the future, so do them and yourself a favor, use a linter and add the
linter usage to the documentation for the script itself.

Shellcheck is [easy to install](https://github.com/koalaman/shellcheck#installing), [easy to run](https://github.com/koalaman/shellcheck#how-to-use),
and [easy to configure](https://github.com/koalaman/shellcheck/wiki/Ignore). There's even a little handy [web tool](https://www.shellcheck.net/)
you can use if you want to kick the tires on it a bit. Overall it's a pretty useful bit of haskell, A+, would use again.
