---
layout: default
title: Hello shhhhh
---

So I wrote a [pretty small gem](http://rubygems.org/gems/shhhhh) whose current main
purpose is kepp the \"/assets/..\" entries from appearing in your dev log files
and incidentally your server output (provided your server is logging to
stdout). I just got tired of all of assets hiding the real meat of the request so I figured
I would write something to scratch that itch.

Now, there already is a project/gem that does basically the same thing. It is called [quiet_assets](https://github.com/evrone/quiet_assets)
and it is a fantastic little gem as well. In that gem, they basically alias_method_chain into the Rails::Rack::Logger#call method
and do their business. I wanted to achieve the same result but with normal inheritance instead of \"alias_method_chain\"ing. Turns
out I could so I did. I plan on adding some features when I get time so feel free to check in on it from time to time or even
submit some pull requests or issues for any desired functionality.
