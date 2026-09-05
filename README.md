# Curtis on Code and Things

A Jekyll-powered blog hosted on GitHub Pages.

## Setup

### Prerequisites
- Ruby 3.2.9 (with Bundler)
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

#### Blog Control Commands

##### Start the Blog
```bash
# Start Jekyll server with auto-reload (foreground)
bundle exec jekyll serve

# Start with drafts included
bundle exec jekyll serve --drafts

# Start with future posts included
bundle exec jekyll serve --future

# Start with both drafts and future posts
bundle exec jekyll serve --drafts --future

# Start in background (detached mode)
bundle exec jekyll serve --detach

# Start on a different port
bundle exec jekyll serve --port 4001
```

##### Stop the Blog
```bash
# If running in foreground, use Ctrl+C to stop

# If running in background, find and kill the process
ps aux | grep jekyll
kill <process_id>

# Or kill all Jekyll processes
pkill -f jekyll

# Alternative: kill processes on port 4000
lsof -ti:4000 | xargs kill
```

##### Check Blog Status
```bash
# Check if Jekyll is running
ps aux | grep jekyll

# Check what's using port 4000
lsof -i:4000

# Check Jekyll processes
pgrep -f jekyll
```

The site will be available at `http://localhost:4000` (or the port you specify)

#### Easy Blog Control Script

For convenience, you can use the included `blog.sh` script:

```bash
# Make the script executable (first time only)
chmod +x blog.sh

# Start the blog
./blog.sh start

# Stop the blog
./blog.sh stop

# Restart the blog
./blog.sh restart

# Check blog status
./blog.sh status

# Build the site
./blog.sh build

# View recent logs
./blog.sh logs

# Show help
./blog.sh help
```

The script provides colored output, process management, and automatic cleanup.

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

The site uses a custom design (no Jekyll theme): layouts live in `_layouts/`, styles in `_scss/_base.scss`.

## Plugins

This blog uses the following Jekyll plugins:
- `jekyll-feed` - Generates RSS/Atom feeds
- `jekyll-seo-tag` - Generates SEO meta tags
- `jekyll-compose` - Provides content management commands

## Updated Dependencies

This blog has been upgraded to Ruby 3.2.9 with the following key gem versions:
- **Jekyll**: 3.10.0 (was 3.8.5)
- **GitHub Pages**: 232 (was 203)
- **Bundler**: 2.7.2 (was 2.0.1)
- **Kramdown**: 2.4.0 (was 1.17.0)
- **Liquid**: 4.0.4 (was 4.0.3)
- **Rouge**: 3.30.0 (was 3.13.0)
- **Nokogiri**: 1.18.10 (was 1.10.7)

All gems have been updated to their latest compatible versions for Ruby 3.2.9.

## Pixel neighborhood

The site uses a continuous city backdrop behind solid, stepped pixel frames
for the homepage, articles, archive, about page, and 404 page. Long-form articles
retain a comfortable reading width inside the frame. The artwork lives in `assets/images/city-backdrop.png`;
`assets/css/neighborhood.css` controls the homepage composition. The art direction
uses clean, flat isometric pixel shapes and colorful navy-night tones, informed
by the supplied pixorama references. Reading surfaces remain fully opaque.

Edit `_data/neighborhood.yml` to choose `auto`, `spring`, `summer`, `autumn`, or
`winter`, and enable or disable named effects. Auto follows the visitor's local
date and Northern Hemisphere meteorological seasons. There are no visitor controls.
Spring adds petals, autumn leaves, winter snow, and summer clear air. Seasons
currently change the overlay rather than the illustrated buildings.

Effects live in the `effects` object in `assets/js/neighborhood.js`. Each receives
the canvas context, elapsed time in milliseconds, and season. Add a function and
an entry under `animations` in the YAML to add an effect; set it to false to remove
it from the scene. Use the shared animation loop rather than independent timers.
The old strip's packet and signal effects are disabled until their coordinates
are remapped to the new city. The previous illustration is retained for iteration.

The background remains still for reduced-motion preferences, and animation stops
when the document is hidden. The solid reading surfaces cover the animation.
The illustration works without JavaScript.

### Local preview

```bash
bundle exec jekyll serve --host 127.0.0.1 --port 4001
```

Open `http://127.0.0.1:4001/`. The shared layout supplies the backdrop and animation script on all HTML pages.

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