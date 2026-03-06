# The Number Crunch — Hugo Setup Guide

## 1. Install Hugo on your VPS (or Mac/Linux)

```bash
# Ubuntu/Debian VPS
sudo apt-get update && sudo apt-get install -y hugo

# Or install the latest extended version (recommended):
HUGO_VERSION="0.145.0"
wget "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz"
tar -xzf hugo_extended_*.tar.gz
sudo mv hugo /usr/local/bin/
hugo version
```

## 2. Preview locally

```bash
cd thenumbercrunch
hugo server -D          # -D includes draft posts
# Open: http://localhost:1313
```

## 3. Build for production

```bash
hugo --minify --gc
# Output is in ./public/
```

## 4. Deploy to Nginx (VPS)

### Install Nginx
```bash
sudo apt-get install -y nginx
```

### Nginx config
Create `/etc/nginx/sites-available/thenumbercrunch.com`:

```nginx
server {
    listen 80;
    server_name thenumbercrunch.com www.thenumbercrunch.com;
    root /var/www/thenumbercrunch.com/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/html text/css application/javascript;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/thenumbercrunch.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Copy built files
```bash
sudo mkdir -p /var/www/thenumbercrunch.com/html
sudo rsync -av --delete ./public/ /var/www/thenumbercrunch.com/html/
```

## 5. HTTPS with Let's Encrypt (recommended)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d thenumbercrunch.com -d www.thenumbercrunch.com
```

## 6. Auto-deploy on content change (optional)

Set up a cron job or Git hook to rebuild and redeploy whenever you push new posts.

```bash
# Example cron: rebuild every hour
0 * * * * cd /path/to/thenumbercrunch && hugo --minify --gc && rsync -av --delete public/ /var/www/thenumbercrunch.com/html/
```

## 7. Writing new posts

```bash
hugo new posts/my-new-post.md
# Edit the file in content/posts/my-new-post.md
# Change draft: true → false when ready to publish
```

## Project Structure

```
thenumbercrunch/
├── hugo.toml              ← Site config (edit baseURL, author, etc.)
├── content/
│   ├── posts/             ← All your blog posts (Markdown)
│   └── pages/             ← About, Contact pages
├── themes/
│   └── archie/            ← Theme files (CSS, layouts)
│       └── static/css/    ← Edit style.css to customize design
├── static/                ← Your images, custom files
├── public/                ← Built site (git-ignored, created by hugo)
└── deploy.sh              ← One-shot deploy script
```

## Images from WordPress

Your old image URLs still point to `thenumbercrunch.com/wp-content/uploads/...`.
To self-host them:

1. Download them from your WordPress media library (Tools → Export Media Library, or use a plugin)
2. Put them in `static/images/`
3. Update image paths in your markdown posts (find/replace `https://thenumbercrunch.com/wp-content/uploads` → `/images`)
