//! # nano-zyrkel CLI
//!
//! Thin command-line wrapper around the [`nano_zyrkel_core::Runtime`].
//!
//! All actual logic lives in the core library — this binary only parses
//! command-line arguments, configures logging, loads the config and hands
//! everything to the runtime. User repos that need custom behavior should
//! depend on `nano-zyrkel-core` directly and call `Runtime::register_plugin()`
//! before `run()` instead of using this CLI.

use anyhow::{Context, Result};
use clap::Parser;
use std::path::PathBuf;
use tracing_subscriber::EnvFilter;

use nano_zyrkel_core::{HatConfig, RunOptions, Runtime};

#[derive(Parser, Debug)]
#[command(
    name = "nano-zyrkel",
    version,
    about = "nano-zyrkel — autonomous agent runner"
)]
struct Cli {
    /// Path to the nano config JSON file.
    #[arg(short, long)]
    config: PathBuf,

    /// Output language for messages (de, en).
    #[arg(short, long, default_value = "de")]
    lang: String,

    /// Dry run — fetch and evaluate but do not notify or commit.
    #[arg(long)]
    dry_run: bool,

    /// Verbose output.
    #[arg(short, long)]
    verbose: bool,

    /// Optional bulk data file path for one-time backfill imports.
    #[arg(long)]
    backfill: Option<PathBuf>,
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            if cli.verbose {
                "nano_zyrkel_core=debug".into()
            } else {
                "nano_zyrkel_core=info".into()
            }
        }))
        .compact()
        .init();

    let config = HatConfig::load(&cli.config)
        .with_context(|| format!("Failed to load config: {}", cli.config.display()))?;

    let opts = RunOptions {
        lang: cli.lang,
        dry_run: cli.dry_run,
        backfill: cli.backfill.map(|p| p.to_string_lossy().into_owned()),
    };

    Runtime::new(config).run(opts).await
}
