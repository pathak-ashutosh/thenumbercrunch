<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" doctype-system="about:legacy-compat" />

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title><xsl:value-of select="rss/channel/title" /> — RSS feed</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="crossorigin" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&amp;family=IBM+Plex+Sans:wght@500;600;700&amp;family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&amp;display=swap" rel="stylesheet" />
        <style>
          :root { color-scheme: light dark; --bg: #f5f7fa; --fg: #172129; --muted: #65717c; --border: #ccd4dc; --accent: #e6553b; --blue: #255cd6; }
          * { box-sizing: border-box; }
          body { background: var(--bg); color: var(--fg); font-family: "Source Serif 4", Georgia, serif; line-height: 1.6; margin: 0; padding: 1.5rem; }
          main { margin: 0 auto; max-width: 46.5rem; }
          .mark { height: 2.5rem; width: 2.5rem; }
          .eyebrow { color: var(--blue); font-family: "IBM Plex Mono", monospace; font-size: .72rem; letter-spacing: .1em; margin: 2.5rem 0 .7rem; text-transform: uppercase; }
          h1 { font-family: "IBM Plex Sans", sans-serif; font-size: clamp(2.3rem, 8vw, 4.5rem); letter-spacing: -.06em; line-height: .98; margin: 0 0 1.2rem; }
          .intro { color: var(--muted); font-size: 1.08rem; margin: 0 0 2.5rem; max-width: 38rem; }
          .intro a, article a { color: var(--fg); text-underline-offset: .2rem; }
          .subscribe { border-left: 3px solid var(--accent); color: var(--muted); font-family: "IBM Plex Sans", sans-serif; font-size: .88rem; margin-bottom: 3.5rem; padding: .25rem 0 .25rem 1rem; }
          article { border-top: 1px solid var(--border); padding: 1.4rem 0; }
          time { color: var(--muted); display: block; font-family: "IBM Plex Mono", monospace; font-size: .68rem; margin-bottom: .4rem; text-transform: uppercase; }
          h2 { font-family: "IBM Plex Sans", sans-serif; font-size: 1.35rem; letter-spacing: -.035em; line-height: 1.2; margin: 0; }
          h2 a { text-decoration: none; }
          h2 a:hover { color: var(--blue); }
          .summary { color: var(--muted); font-size: .92rem; margin-top: .5rem; }
          @media (prefers-color-scheme: dark) { :root { --bg: #10181e; --fg: #edf2f5; --muted: #a4b0b9; --border: #35434e; --accent: #ff8068; --blue: #82a8ff; } }
        </style>
      </head>
      <body>
        <main>
          <a href="/" aria-label="The Number Crunch home"><img class="mark" src="/brand/number-mark.svg" alt="" /></a>
          <p class="eyebrow">The Number Crunch / RSS</p>
          <h1>Notes, without an algorithm.</h1>
          <p class="intro">This is the RSS feed for <a href="/"><xsl:value-of select="rss/channel/title" /></a>. New here? RSS lets a reader app bring each post to you—no inbox or social feed required.</p>
          <p class="subscribe">Copy this page’s URL into any RSS reader to subscribe.</p>
          <section aria-label="Recent notes">
            <xsl:for-each select="rss/channel/item">
              <article>
                <time><xsl:value-of select="pubDate" /></time>
                <h2><a href="{link}"><xsl:value-of select="title" /></a></h2>
                <p class="summary"><xsl:value-of select="description" /></p>
              </article>
            </xsl:for-each>
          </section>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
