# Curtis on Code and Things

A Jekyll-powered blog hosted on GitHub Pages.

## Setup

### Prerequisites
- Ruby (with Bundler)
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/tehcurtis/tehcurtis.github.com.git
cd tehcurtis.github.com

# Install dependencies
bundle install
```

## Common Commands

### Development

#### Start Local Development Server
```bash
# Start Jekyll server with auto-reload
bundle exec jekyll serve

# Start with drafts included
bundle exec jekyll serve --drafts

# Start with future posts included
bundle exec jekyll serve --future

# Start with both drafts and future posts
bundle exec jekyll serve --drafts --future
```

The site will be available at `http://localhost:4000`

#### Build Site
```bash
# Build the site for production
bundle exec jekyll build

# Build with drafts included
bundle exec jekyll build --drafts

# Build with future posts included
bundle exec jekyll build --future
```

### Content Management

#### Create New Post
```bash
# Create a new post with today's date
bundle exec jekyll post "My New Post Title"

# Create a new post with a specific date
bundle exec jekyll post "My New Post Title" --date 2024-01-15

# Create a new draft post
bundle exec jekyll draft "My Draft Post Title"
```

#### Create New Page
```bash
# Create a new page
bundle exec jekyll page "My New Page"
```

#### Publish Draft
```bash
# Move a draft to published posts
bundle exec jekyll publish _drafts/my-draft-post.md
```

#### Unpublish Post
```bash
# Move a published post back to drafts
bundle exec jekyll unpublish _posts/2024-01-15-my-post-title.md
```

### Deployment

#### Deploy to GitHub Pages
```bash
# Add and commit changes
git add .
git commit -m "Your commit message"

# Push to GitHub (triggers automatic deployment)
git push origin master
```

GitHub Pages will automatically build and deploy your site when you push to the `master` branch.

### Maintenance

#### Update Dependencies
```bash
# Update Jekyll and plugins
bundle update

# Update GitHub Pages gem specifically
bundle update github-pages
```

#### Check for Issues
```bash
# Validate site structure
bundle exec jekyll doctor

# Check for broken links (if you have jekyll-link-checker installed)
bundle exec jekyll link-checker
```

## Blog Structure

- `_posts/` - Published blog posts (format: YYYY-MM-DD-title.md)
- `_drafts/` - Draft posts (not published)
- `_layouts/` - HTML templates
- `_scss/` - Sass stylesheets
- `assets/` - Static assets (CSS, images)
- `_config.yml` - Site configuration
- `Gemfile` - Ruby dependencies

## Configuration

Key settings in `_config.yml`:
- `title`: Site title
- `email`: Author email
- `author`: Author name
- `description`: Site description
- `url`: Site URL
- `twitter_username`: Twitter handle
- `github_username`: GitHub username
- `theme`: Jekyll theme (currently: jekyll-theme-hacker)

## Plugins

This blog uses the following Jekyll plugins:
- `jekyll-feed` - Generates RSS/Atom feeds
- `jekyll-compose` - Provides content management commands

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   bundle exec jekyll serve --port 4001
   ```

2. **Dependencies out of date**
   ```bash
   bundle update
   ```

3. **Site not updating**
   - Restart the Jekyll server after changing `_config.yml`
   - Clear browser cache
   - Check for syntax errors in Markdown files

### Getting Help

- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll)
- [Jekyll Themes](https://jekyllthemes.io/)

## License

This blog content is licensed under [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/).