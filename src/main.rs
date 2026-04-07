use anyhow::{Context, Result};
use clap::Parser;
use std::path::PathBuf;
use tracing_subscriber::EnvFilter;

mod config;
mod condition;
mod fetch;
mod i18n;
mod notify;
mod output;

use config::HatConfig;

#[derive(Parser, Debug)]
#[command(name = "hat-runner", about = "Zyrkel HAT — autonomous agent runner")]
struct Cli {
    /// Path to HAT config JSON
    #[arg(short, long)]
    config: PathBuf,

    /// Language for output messages (de, en)
    #[arg(short, long, default_value = "de")]
    lang: String,

    /// Dry run — don't notify or commit, just check
    #[arg(long)]
    dry_run: bool,

    /// Verbose output
    #[arg(short, long)]
    verbose: bool,
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| {
                    if cli.verbose { "hat_runner=debug".into() } else { "hat_runner=info".into() }
                }),
        )
        .compact()
        .init();

    let config = HatConfig::load(&cli.config)
        .with_context(|| format!("Failed to load config: {}", cli.config.display()))?;

    tracing::info!(
        hat_id = %config.id,
        hat_type = %config.hat_type,
        "{}",
        i18n::msg(&cli.lang, "hat_starting", &[&config.id])
    );

    // 1. Fetch content from source
    let content = fetch::fetch_source(&config.source).await
        .with_context(|| i18n::msg(&cli.lang, "fetch_failed", &[&config.source.url]))?;

    tracing::debug!(bytes = content.len(), "Content fetched");

    // 2. Evaluate condition
    let result = condition::evaluate(&config.condition, &content, &config).await?;

    // 3. Write output to staging/
    output::write_result(&config, &result, cli.dry_run)?;

    // 4. Notify if match found
    if result.matched && !cli.dry_run {
        notify::send(&config.notify, &config, &result, &cli.lang).await?;
        tracing::info!(
            "{}",
            i18n::msg(&cli.lang, "match_found", &[&config.id, &result.summary])
        );
    } else if result.matched {
        tracing::info!("[DRY RUN] {}", i18n::msg(&cli.lang, "match_found", &[&config.id, &result.summary]));
    } else {
        tracing::info!(
            "{}",
            i18n::msg(&cli.lang, "no_match", &[&config.id])
        );
    }

    Ok(())
}
