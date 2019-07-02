---
layout: post
title: "hello shhhhh"
date: 2014-07-28 23:06 -0700
categories: [gems, ruby]
---
So I wrote a <a href="http://rubygems.org/gems/shhhhh">pretty small</a> gem whose current main purpose is keep the &ldquo;/assets/..&rdquo; entries from appearing in your
dev log files and incidentally your server output. I just got tired of all of assets hiding the real meat of
the request so I figured I would write something to scratch that itch.</p>

Now, there already is a project/gem that does basically the same thing. It is called <a href="https://github.com/evrone/quiet_assets">quiet_assets</a> and it is
a fantastic little gem as well. In that gem, they basically alias_method_chain into the Rails::Rack::Logger#call
method and do their business. I wanted to achieve the same result but with normal inheritance instead
of &ldquo;alias_method_chain&#8221;ing. Turns out I could so I did. I plan on adding some features when I get time so
feel free to check in on it from time to time or even submit some pull requests or issues for any desired functionality.
