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

use nano_zyrkel_core::{introspect, HatConfig, RunOptions, Runtime};

#[derive(Parser, Debug)]
#[command(
    name = "nano-zyrkel",
    version,
    about = "nano-zyrkel — autonomous agent runner",
    long_about = "nano-zyrkel SDK CLI. Without a subcommand the legacy `--config X` flow runs."
)]
struct Cli {
    /// Path to the nano config JSON file (legacy form, equivalent to `run --config`).
    #[arg(short, long, global = true)]
    config: Option<PathBuf>,

    /// Output language for messages (de, en).
    #[arg(short, long, default_value = "de", global = true)]
    lang: String,

    /// Dry run — fetch and evaluate but do not notify or commit.
    #[arg(long, global = true)]
    dry_run: bool,

    /// Verbose output.
    #[arg(short, long, global = true)]
    verbose: bool,

    /// Optional bulk data file path for one-time backfill imports.
    #[arg(long, global = true)]
    backfill: Option<PathBuf>,

    #[command(subcommand)]
    command: Option<Command>,
}

#[derive(clap::Subcommand, Debug)]
enum Command {
    /// Run the nano-zyrkel pipeline against `--config`.
    Run,

    /// Validate the config file without firing any side effects.
    Validate,

    /// Print the SDK schema (every nano type, fetcher, condition, action
    /// and notifier the binary supports) as JSON.
    Introspect {
        /// Output file. Defaults to stdout.
        #[arg(short, long)]
        out: Option<PathBuf>,
    },
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

    match &cli.command {
        Some(Command::Introspect { out }) => {
            let json = introspect::schema_json();
            match out {
                Some(path) => {
                    std::fs::write(path, &json)
                        .with_context(|| format!("write {}", path.display()))?;
                }
                None => println!("{}", json),
            }
            return Ok(());
        }
        Some(Command::Validate) => {
            let path = cli
                .config
                .as_ref()
                .ok_or_else(|| anyhow::anyhow!("--config required for validate"))?;
            HatConfig::load(path)
                .with_context(|| format!("Failed to load config: {}", path.display()))?;
            println!("config OK: {}", path.display());
            return Ok(());
        }
        // Default + explicit `run` use the same code path.
        Some(Command::Run) | None => {}
    }

    let path = cli
        .config
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("--config is required"))?;
    let config = HatConfig::load(path)
        .with_context(|| format!("Failed to load config: {}", path.display()))?;

    let opts = RunOptions {
        lang: cli.lang,
        dry_run: cli.dry_run,
        backfill: cli.backfill.map(|p| p.to_string_lossy().into_owned()),
    };

    Runtime::new(config).run(opts).await
}
