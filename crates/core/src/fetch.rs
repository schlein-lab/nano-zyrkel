//! HTTP and feed fetchers for nano-zyrkel sources.
//!
//! - [`fetch_source`] is the standard entry point used by the runtime.
//! - [`fetch_rss`] parses an RSS / Atom feed and returns one record per item.
//! - [`fetch_sitemap`] expands a `sitemap.xml` (recursively, for sitemap
//!   indexes) into the list of URLs it points at.
//! - [`fetch_ical`] parses an iCal calendar feed (`.ics`) and returns the
//!   upcoming events.
//!
//! All four reuse the same `reqwest::Client` configuration so retries,
//! timeouts and the user-agent string stay consistent.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use crate::config::Source;

const USER_AGENT: &str = "nano-zyrkel/0.2 (https://github.com/schlein-lab/nano-zyrkel)";
const TIMEOUT_SECS: u64 = 30;
const MAX_RETRIES: u32 = 3;
const RETRY_DELAY_MS: u64 = 2000;

/// Fetch content from a source URL with retry logic.
pub async fn fetch_source(source: &Source) -> Result<String> {
    let mut last_err = None;

    for attempt in 1..=MAX_RETRIES {
        match fetch_once(source).await {
            Ok(body) => return Ok(body),
            Err(e) => {
                tracing::warn!(attempt, max = MAX_RETRIES, error = %e, "Fetch attempt failed");
                last_err = Some(e);
                if attempt < MAX_RETRIES {
                    let delay = RETRY_DELAY_MS * (attempt as u64);
                    tokio::time::sleep(std::time::Duration::from_millis(delay)).await;
                }
            }
        }
    }

    Err(last_err.unwrap_or_else(|| anyhow::anyhow!("fetch failed")))
}

async fn fetch_once(source: &Source) -> Result<String> {
    let client = reqwest::Client::builder()
        .user_agent(USER_AGENT)
        .timeout(std::time::Duration::from_secs(TIMEOUT_SECS))
        .build()?;

    let mut req = match source.method.to_uppercase().as_str() {
        "POST" => client.post(&source.url),
        "PUT" => client.put(&source.url),
        _ => client.get(&source.url),
    };

    for (key, value) in &source.headers {
        req = req.header(key.as_str(), value.as_str());
    }

    if let Some(body) = &source.body {
        req = req.body(body.clone());
    }

    let response = req.send().await
        .with_context(|| format!("HTTP request to {}", source.url))?;

    let status = response.status();
    if !status.is_success() {
        anyhow::bail!("HTTP {} from {}", status, source.url);
    }

    let body = response.text().await
        .with_context(|| format!("Reading response body from {}", source.url))?;

    Ok(body)
}

// ─── RSS / Atom feed fetcher ──────────────────────────────────────────

/// One item from an RSS or Atom feed.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedItem {
    pub title: String,
    pub link: String,
    pub published: Option<String>,
    pub summary: Option<String>,
    pub guid: Option<String>,
    pub author: Option<String>,
    pub categories: Vec<String>,
}

/// Fetch an RSS or Atom feed and return its items.
///
/// Handles both RSS 2.0 (`<item>`) and Atom 1.0 (`<entry>`), namespaces,
/// CDATA sections, attribute-based Atom links and extended fields like
/// `<author>` and `<category>`. Backed by `quick-xml` for correct
/// streaming parsing instead of fragile string scanning.
pub async fn fetch_rss(url: &str) -> Result<Vec<FeedItem>> {
    let xml = fetch_text(url).await?;
    parse_feed(&xml)
}

/// Parse an RSS or Atom feed string. Made `pub` so plugins can re-use it
/// without re-fetching.
pub fn parse_feed(xml: &str) -> Result<Vec<FeedItem>> {
    use quick_xml::events::Event;
    use quick_xml::Reader;

    let mut reader = Reader::from_str(xml);
    reader.config_mut().trim_text(true);

    let mut items: Vec<FeedItem> = Vec::new();
    let mut current: Option<FeedItem> = None;
    let mut text_buf = String::new();
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(e)) => {
                let local = local_name(e.name().as_ref());
                match local.as_str() {
                    "item" | "entry" => {
                        current = Some(FeedItem {
                            title: String::new(),
                            link: String::new(),
                            published: None,
                            summary: None,
                            guid: None,
                            author: None,
                            categories: Vec::new(),
                        });
                    }
                    "link" if current.is_some() => {
                        // Atom: <link href="…"/> — capture from attributes.
                        for attr in e.attributes().flatten() {
                            if attr.key.as_ref() == b"href" {
                                if let Ok(v) = attr.unescape_value() {
                                    if let Some(item) = current.as_mut() {
                                        if item.link.is_empty() {
                                            item.link = v.into_owned();
                                        }
                                    }
                                }
                            }
                        }
                    }
                    "category" if current.is_some() => {
                        // Atom: <category term="…"/> — capture from attributes too.
                        for attr in e.attributes().flatten() {
                            if attr.key.as_ref() == b"term" {
                                if let Ok(v) = attr.unescape_value() {
                                    if let Some(item) = current.as_mut() {
                                        item.categories.push(v.into_owned());
                                    }
                                }
                            }
                        }
                    }
                    _ => {}
                }
                text_buf.clear();
            }
            Ok(Event::Empty(e)) => {
                // Self-closing tags like <link href="…" />
                let local = local_name(e.name().as_ref());
                if local == "link" && current.is_some() {
                    for attr in e.attributes().flatten() {
                        if attr.key.as_ref() == b"href" {
                            if let Ok(v) = attr.unescape_value() {
                                if let Some(item) = current.as_mut() {
                                    if item.link.is_empty() {
                                        item.link = v.into_owned();
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Ok(Event::Text(e)) => {
                if let Ok(t) = e.unescape() {
                    text_buf.push_str(&t);
                }
            }
            Ok(Event::CData(e)) => {
                text_buf.push_str(&String::from_utf8_lossy(e.as_ref()));
            }
            Ok(Event::End(e)) => {
                let local = local_name(e.name().as_ref());
                if local == "item" || local == "entry" {
                    if let Some(item) = current.take() {
                        items.push(item);
                    }
                } else if let Some(item) = current.as_mut() {
                    let value = text_buf.trim().to_string();
                    if !value.is_empty() {
                        match local.as_str() {
                            "title" => item.title = value,
                            "link" => {
                                if item.link.is_empty() {
                                    item.link = value;
                                }
                            }
                            "pubDate" | "published" | "updated" => {
                                if item.published.is_none() {
                                    item.published = Some(value);
                                }
                            }
                            "description" | "summary" | "content" => {
                                if item.summary.is_none() {
                                    item.summary = Some(value);
                                }
                            }
                            "guid" | "id" => {
                                if item.guid.is_none() {
                                    item.guid = Some(value);
                                }
                            }
                            "author" | "name" | "creator" => {
                                if item.author.is_none() {
                                    item.author = Some(value);
                                }
                            }
                            "category" => item.categories.push(value),
                            _ => {}
                        }
                    }
                }
                text_buf.clear();
            }
            Ok(Event::Eof) => break,
            Err(e) => anyhow::bail!("feed parse error at {}: {}", reader.buffer_position(), e),
            _ => {}
        }
        buf.clear();
    }

    Ok(items)
}

fn local_name(qname: &[u8]) -> String {
    let s = std::str::from_utf8(qname).unwrap_or("");
    match s.rsplit_once(':') {
        Some((_, local)) => local.to_string(),
        None => s.to_string(),
    }
}

// ─── Sitemap fetcher ──────────────────────────────────────────────────

/// Fetch a `sitemap.xml` and return every `<loc>` URL it contains.
///
/// Sitemap *index* files (with `<sitemapindex>`) are followed
/// transparently up to a depth of 3.
pub async fn fetch_sitemap(url: &str) -> Result<Vec<String>> {
    fetch_sitemap_inner(url, 0).await
}

async fn fetch_sitemap_inner(url: &str, depth: u32) -> Result<Vec<String>> {
    if depth > 3 {
        return Ok(Vec::new());
    }
    let xml = fetch_text(url).await?;
    let (is_index, locs) = parse_sitemap(&xml)?;

    if is_index {
        let mut all = Vec::new();
        for loc in locs {
            let nested = Box::pin(fetch_sitemap_inner(&loc, depth + 1)).await?;
            all.extend(nested);
        }
        Ok(all)
    } else {
        Ok(locs)
    }
}

/// Parse a sitemap XML, returning `(is_index, locs)`.
pub fn parse_sitemap(xml: &str) -> Result<(bool, Vec<String>)> {
    use quick_xml::events::Event;
    use quick_xml::Reader;

    let mut reader = Reader::from_str(xml);
    reader.config_mut().trim_text(true);

    let mut locs = Vec::new();
    let mut is_index = false;
    let mut in_loc = false;
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(e)) => {
                let local = local_name(e.name().as_ref());
                if local == "sitemapindex" {
                    is_index = true;
                }
                if local == "loc" {
                    in_loc = true;
                }
            }
            Ok(Event::Text(e)) if in_loc => {
                if let Ok(t) = e.unescape() {
                    locs.push(t.into_owned());
                }
            }
            Ok(Event::End(e)) => {
                if local_name(e.name().as_ref()) == "loc" {
                    in_loc = false;
                }
            }
            Ok(Event::Eof) => break,
            Err(e) => anyhow::bail!("sitemap parse error: {}", e),
            _ => {}
        }
        buf.clear();
    }

    Ok((is_index, locs))
}

// ─── iCal feed fetcher ────────────────────────────────────────────────

/// A single property value from an iCal property line, including its
/// raw parameters (anything between `;` and `:`).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CalendarProperty {
    pub value: String,
    pub params: std::collections::BTreeMap<String, String>,
}

/// One event from an iCal calendar (`VEVENT`).
///
/// Captures the standard RFC 5545 fields plus the raw `RRULE`, `RDATE`,
/// `EXDATE` and `ATTENDEE` lists for downstream processing.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CalendarEvent {
    pub uid: String,
    pub summary: String,
    pub start: Option<CalendarProperty>,
    pub end: Option<CalendarProperty>,
    pub location: Option<String>,
    pub description: Option<String>,
    pub url: Option<String>,
    pub organizer: Option<String>,
    pub status: Option<String>,
    pub categories: Vec<String>,
    pub attendees: Vec<String>,
    pub rrule: Option<String>,
    pub rdates: Vec<String>,
    pub exdates: Vec<String>,
    pub created: Option<String>,
    pub last_modified: Option<String>,
}

/// Fetch and parse an iCal feed (`.ics`).
pub async fn fetch_ical(url: &str) -> Result<Vec<CalendarEvent>> {
    let body = fetch_text(url).await?;
    parse_ical(&body)
}

/// Parse an iCal body. Made `pub` so plugins can re-use it without
/// re-fetching.
pub fn parse_ical(body: &str) -> Result<Vec<CalendarEvent>> {
    let mut events = Vec::new();
    let mut current: Option<CalendarEvent> = None;
    let unfolded = unfold_ical(body);

    for line in unfolded.lines() {
        if line.is_empty() {
            continue;
        }
        if line == "BEGIN:VEVENT" {
            current = Some(CalendarEvent::default());
            continue;
        }
        if line == "END:VEVENT" {
            if let Some(ev) = current.take() {
                events.push(ev);
            }
            continue;
        }
        if let Some(ev) = current.as_mut() {
            if let Some((key, params, value)) = parse_property_line(line) {
                set_event_field(ev, &key, params, value);
            }
        }
    }

    Ok(events)
}

fn unfold_ical(body: &str) -> String {
    // RFC 5545 §3.1: continuation lines start with space or tab.
    let mut out = String::new();
    for line in body.lines() {
        let line = line.trim_end_matches('\r');
        if line.starts_with(' ') || line.starts_with('\t') {
            out.push_str(&line[1..]);
        } else {
            if !out.is_empty() {
                out.push('\n');
            }
            out.push_str(line);
        }
    }
    out
}

fn parse_property_line(
    line: &str,
) -> Option<(String, std::collections::BTreeMap<String, String>, String)> {
    let colon = line.find(':')?;
    let head = &line[..colon];
    let value = decode_ical_text(&line[colon + 1..]);

    let mut parts = head.split(';');
    let key = parts.next()?.to_string();
    let mut params = std::collections::BTreeMap::new();
    for kv in parts {
        if let Some((k, v)) = kv.split_once('=') {
            params.insert(k.to_string(), v.to_string());
        }
    }
    Some((key, params, value))
}

fn set_event_field(
    ev: &mut CalendarEvent,
    key: &str,
    params: std::collections::BTreeMap<String, String>,
    value: String,
) {
    match key {
        "UID" => ev.uid = value,
        "SUMMARY" => ev.summary = value,
        "DTSTART" => ev.start = Some(CalendarProperty { value, params }),
        "DTEND" => ev.end = Some(CalendarProperty { value, params }),
        "LOCATION" => ev.location = Some(value),
        "DESCRIPTION" => ev.description = Some(value),
        "URL" => ev.url = Some(value),
        "ORGANIZER" => ev.organizer = Some(value),
        "STATUS" => ev.status = Some(value),
        "CATEGORIES" => ev.categories = value.split(',').map(|s| s.trim().to_string()).collect(),
        "ATTENDEE" => ev.attendees.push(value),
        "RRULE" => ev.rrule = Some(value),
        "RDATE" => ev.rdates.push(value),
        "EXDATE" => ev.exdates.push(value),
        "CREATED" => ev.created = Some(value),
        "LAST-MODIFIED" => ev.last_modified = Some(value),
        _ => {}
    }
}

fn decode_ical_text(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut chars = s.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\\' {
            match chars.next() {
                Some('n') | Some('N') => out.push('\n'),
                Some(',') => out.push(','),
                Some(';') => out.push(';'),
                Some('\\') => out.push('\\'),
                Some(other) => {
                    out.push('\\');
                    out.push(other);
                }
                None => out.push('\\'),
            }
        } else {
            out.push(c);
        }
    }
    out
}

// ─── Shared text fetch helper used by RSS/Sitemap/iCal ────────────────

async fn fetch_text(url: &str) -> Result<String> {
    let client = reqwest::Client::builder()
        .user_agent(USER_AGENT)
        .timeout(std::time::Duration::from_secs(TIMEOUT_SECS))
        .build()?;
    let resp = client.get(url).send().await
        .with_context(|| format!("HTTP request to {}", url))?;
    if !resp.status().is_success() {
        anyhow::bail!("HTTP {} from {}", resp.status(), url);
    }
    Ok(resp.text().await?)
}
