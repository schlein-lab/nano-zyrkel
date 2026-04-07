#!/usr/bin/env bash
set -euo pipefail

CONFIG="${1:-hats/config.json}"
ROOT="$(cd "$(dirname "$CONFIG")/.." && pwd)"
ID="$(jq -r '.id' "$CONFIG")"
STATE_DIR_REL="$(jq -r '.paths.state_dir' "$CONFIG")"
STATE_DIR="$ROOT/$STATE_DIR_REL"
INBOX_DIR="$STATE_DIR/inbox"
CASES_DIR="$STATE_DIR/cases"
FETCH_DIR="$STATE_DIR/fetches"
ARTIFACT_DIR="$STATE_DIR/artifacts"
STATE_JSON="$STATE_DIR/state.json"
TEMPLATE_HTML="$ROOT/assets/email-shell.html"
MAILBOX="${SMTP_USER:-$(jq -r '.mailbox.address' "$CONFIG")}"
IMAP_HOST="$(jq -r '.mailbox.imap_host // "imap.gmail.com"' "$CONFIG")"
SMTP_HOST="$(jq -r '.mailbox.smtp_host // "smtp.gmail.com"' "$CONFIG")"
REPLY_NAME="$(jq -r '.mailbox.reply_name' "$CONFIG")"
SIG_NAME="$(jq -r '.signature.name' "$CONFIG")"
SIG_ROLE="$(jq -r '.signature.role' "$CONFIG")"
MAX_EMAILS="$(jq -r '.agent.max_emails_per_run' "$CONFIG")"
MAX_FETCHES="$(jq -r '.agent.max_web_fetches' "$CONFIG")"
MAX_TASKS="$(jq -r '.agent.max_shell_tasks' "$CONFIG")"
MAX_CODEX_CHARS="$(jq -r '.agent.max_codex_chars' "$CONFIG")"
MAX_PREVIEW_CHARS="$(jq -r '.agent.max_preview_chars // 2400' "$CONFIG")"
MAX_ARTIFACT_OUTPUT_CHARS="$(jq -r '.agent.max_artifact_output_chars // 1200' "$CONFIG")"

mkdir -p "$STATE_DIR" "$INBOX_DIR" "$CASES_DIR" "$FETCH_DIR" "$ARTIFACT_DIR"
[ -f "$STATE_JSON" ] || printf '%s\n' '{"processed_uids":[],"pending_ids":[],"telegram_offset":0}' > "$STATE_JSON"

need_bin() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing binary: $1" >&2
    exit 1
  }
}

need_env() {
  local key="$1"
  if [ -z "${!key:-}" ]; then
    echo "missing env: $key" >&2
    exit 1
  fi
}

need_bin jq
need_bin curl
need_bin codex
need_bin awk
need_bin sed
need_bin grep
need_bin tr
need_bin head
need_env TELEGRAM_BOT_TOKEN
need_env TELEGRAM_CHAT_ID
need_env SMTP_USER
need_env SMTP_PASS

json_update() {
  local filter="$1"
  local tmp
  tmp="$(mktemp)"
  jq "$filter" "$STATE_JSON" > "$tmp"
  mv "$tmp" "$STATE_JSON"
}

case_update() {
  local case_json="$1"
  shift
  local tmp
  tmp="$(mktemp)"
  jq "$@" "$case_json" > "$tmp"
  mv "$tmp" "$case_json"
}

extract_header() {
  local header_name="$1"
  local file="$2"
  awk -v target="$header_name" '
    BEGIN { IGNORECASE = 1 }
    $0 ~ "^" target ":" {
      value = substr($0, index($0, ":") + 1)
      sub(/^[[:space:]]+/, "", value)
      print value
      exit
    }
  ' "$file" | tr -d '\r'
}

extract_email_address() {
  printf '%s' "$1" | grep -Eio '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}' | head -n 1 | tr '[:upper:]' '[:lower:]'
}

html_escape_stream() {
  sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'
}

build_html_body() {
  html_escape_stream < "$1" | awk '
    BEGIN { open = 0 }
    {
      gsub(/\r/, "")
      if (length($0) == 0) {
        if (open) {
          print "</p>"
          open = 0
        }
      } else {
        if (!open) {
          print "<p style=\"margin:0 0 16px 0;\">"
          open = 1
        }
        print $0 "<br>"
      }
    }
    END {
      if (open) {
        print "</p>"
      }
    }
  '
}

send_tg() {
  local text="$1"
  local payload
  payload="$(jq -n --arg chat_id "$TELEGRAM_CHAT_ID" --arg text "$(printf '%s' "$text" | head -c 3900)" '{chat_id:$chat_id,text:$text,disable_web_page_preview:true}')"
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -H 'Content-Type: application/json' \
    -d "$payload" >/dev/null
}

send_help() {
  send_tg "Maildesk-Kommandos:\n/pending\n/show <case-id>\n/approve <case-id>\n/revise <case-id> <hinweis>\n/ignore <case-id>\n/help"
}

codex_to_file() {
  local prompt="$1"
  local outfile="$2"
  codex exec --skip-git-repo-check --ephemeral -o "$outfile" "$prompt" >/dev/null 2>&1 || true
}

codex_json_to_file() {
  local prompt="$1"
  local outfile="$2"
  local raw
  raw="$(mktemp)"
  codex_to_file "$prompt" "$raw"
  if jq empty "$raw" >/dev/null 2>&1; then
    cp "$raw" "$outfile"
    rm -f "$raw"
    return
  fi
  sed -n '/^[[:space:]]*{/,$p' "$raw" > "$outfile" || true
  if ! jq empty "$outfile" >/dev/null 2>&1; then
    printf '%s\n' '{}' > "$outfile"
  fi
  rm -f "$raw"
}

safe_slug() {
  printf '%s' "$1" | sed 's#https\?://##; s#[^a-zA-Z0-9]#-#g' | cut -c1-60
}

is_safe_shell_script() {
  local file="$1"
  local lowered forbidden
  lowered="$(tr '[:upper:]' '[:lower:]' < "$file")"
  forbidden='rm |mv |git |ssh |scp |sudo |chmod |chown |dd |mkfs |shutdown |reboot |powershell|cmd.exe|python|perl|ruby|node |npm |npx |cargo |go |rustc|wget |invoke-webrequest|start-process|curl .*smtp|>|>>|\$\(|`|\.\./|~/|/etc/|/root/'
  if printf '%s' "$lowered" | grep -E "$forbidden" >/dev/null 2>&1; then
    return 1
  fi
  grep -Eq '^(#!/usr/bin/env bash|#!/bin/bash)' "$file"
}

run_shell_task() {
  local case_id="$1"
  local task_json="$2"
  local filename purpose script_file output_file summary_file
  filename="$(printf '%s' "$task_json" | jq -r '.filename // "artifact.sh"')"
  purpose="$(printf '%s' "$task_json" | jq -r '.purpose // "artifact"')"
  script_file="$ARTIFACT_DIR/$case_id-$filename"
  output_file="$ARTIFACT_DIR/$case_id-$filename.out"
  summary_file="$ARTIFACT_DIR/$case_id-$filename.summary.txt"
  printf '%s\n' "$(printf '%s' "$task_json" | jq -r '.script // empty')" > "$script_file"
  if ! is_safe_shell_script "$script_file"; then
    printf 'Task blocked by safety filter.\n' > "$output_file"
    printf -- '- %s (blocked by safety filter)\n' "$purpose" > "$summary_file"
    return
  fi
  chmod +x "$script_file"
  (
    cd "$ARTIFACT_DIR"
    bash "$(basename "$script_file")"
  ) > "$output_file" 2>&1 || true
  printf -- '- %s (%s)\n' "$purpose" "$(head -c "$MAX_ARTIFACT_OUTPUT_CHARS" "$output_file" | tr '\n' ' ' | tr '\r' ' ')" > "$summary_file"
}

compose_review_message() {
  local case_id="$1"
  local case_json="$CASES_DIR/$case_id.json"
  local draft_file="$CASES_DIR/$case_id.reply.txt"
  local summary research_preview draft_preview
  summary="$(jq -r '.summary // "Neue Mail eingegangen."' "$case_json")"
  research_preview="$(jq -r '.research_summary // "- keine zusaetzliche Recherche"' "$case_json")"
  draft_preview="$(head -c "$MAX_PREVIEW_CHARS" "$draft_file")"
  printf 'ich wuerde jetzt ungefaehr so als Antwort schreiben, passt das?\n\nCase: %s\nVon: %s\nBetreff: %s\n\nZusammenfassung:\n%s\n\nRecherche:\n%s\n\nVorschlag:\n%s\n\nKommandos: /approve %s | /revise %s <hinweis> | /ignore %s' \
    "$case_id" \
    "$(jq -r '.from_email' "$case_json")" \
    "$(jq -r '.subject' "$case_json")" \
    "$summary" \
    "$research_preview" \
    "$draft_preview" \
    "$case_id" \
    "$case_id" \
    "$case_id"
}

send_email_reply() {
  local case_json="$1"
  local case_id subject to_email draft_file body_html sig_html rendered_html mail_file
  [ -f "$case_json" ] || {
    send_tg "Case nicht gefunden."
    return
  }
  case_id="$(jq -r '.id' "$case_json")"
  subject="$(jq -r '.subject' "$case_json")"
  to_email="$(jq -r '.from_email' "$case_json")"
  draft_file="$CASES_DIR/$case_id.reply.txt"
  body_html="$(build_html_body "$draft_file")"
  sig_html="$(printf '%s<br>%s' "$SIG_NAME" "$SIG_ROLE")"
  rendered_html="$(mktemp)"
  mail_file="$(mktemp)"
  sed -e "s|__SUBJECT__|$subject|g" \
      -e "s|__BODY_HTML__|$body_html|g" \
      -e "s|__SIGNATURE_HTML__|$sig_html|g" \
      "$TEMPLATE_HTML" > "$rendered_html"
  {
    printf 'From: %s <%s>\r\n' "$REPLY_NAME" "$MAILBOX"
    printf 'To: %s\r\n' "$to_email"
    printf 'Subject: Re: %s\r\n' "$subject"
    printf 'MIME-Version: 1.0\r\n'
    printf 'Content-Type: text/html; charset=utf-8\r\n'
    printf '\r\n'
    cat "$rendered_html"
  } > "$mail_file"
  curl -s --url "smtps://${SMTP_HOST}:465" --ssl-reqd \
    --mail-from "$MAILBOX" --mail-rcpt "$to_email" \
    --user "$SMTP_USER:$SMTP_PASS" -T "$mail_file" >/dev/null
  case_update "$case_json" '.status="sent" | .sent_at=(now|todate)'
  json_update "(.pending_ids // []) |= map(select(. != \"$case_id\"))"
  send_tg "Antwort fuer $case_id wurde gesendet an $to_email."
}

render_reply() {
  local case_json="$1"
  local output_file="$2"
  local instruction="${3:-}"
  local prompt_file="$CASES_DIR/$(basename "$case_json" .json).render-prompt.txt"
  cat > "$prompt_file" <<EOF
Du bist ein semi-autonomer deutscher Maildesk fuer ${MAILBOX}.

Ziel:
- Formuliere eine konkrete, versandbereite Antwortmail.
- Sei freundlich, klar, hilfreich und knapp.
- Erfinde keine Fakten.
- Falls Informationen fehlen, stelle 1 bis 3 konkrete Rueckfragen.
- Wenn Recherche gemacht wurde, nutze sie vorsichtig und nur wenn sie belastbar ist.
- Gib NUR den eigentlichen Mailtext aus, ohne Betreff, ohne Einleitung ausserhalb der Mail, ohne Markdown.

Fall:
$(cat "$case_json")

Zusatzhinweis:
${instruction:-Kein Zusatzhinweis.}
EOF
  codex_to_file "$(cat "$prompt_file")" "$output_file"
}

regenerate_case() {
  local case_id="$1"
  local instruction="$2"
  local case_json="$CASES_DIR/$case_id.json"
  local draft_file="$CASES_DIR/$case_id.reply.txt"
  [ -f "$case_json" ] || {
    send_tg "Case $case_id nicht gefunden."
    return
  }
  render_reply "$case_json" "$draft_file" "$instruction"
  case_update "$case_json" --arg draft "$(cat "$draft_file")" --arg instruction "$instruction" '.draft_text=$draft | .status="awaiting_approval" | .last_revision_instruction=$instruction'
  send_tg "$(compose_review_message "$case_id")"
}

show_case() {
  local case_id="$1"
  local draft_file="$CASES_DIR/$case_id.reply.txt"
  [ -f "$draft_file" ] || {
    send_tg "Case $case_id nicht gefunden."
    return
  }
  send_tg "Aktueller Vorschlag fuer $case_id:\n\n$(head -c "$MAX_PREVIEW_CHARS" "$draft_file")"
}

process_telegram() {
  local offset updates
  offset="$(jq -r '.telegram_offset' "$STATE_JSON")"
  updates="$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=$((offset+1))&timeout=1")"
  printf '%s' "$updates" | jq -c '.result[]?' | while read -r item; do
    local update_id chat_id text cmd arg1 arg2
    update_id="$(printf '%s' "$item" | jq -r '.update_id')"
    chat_id="$(printf '%s' "$item" | jq -r '.message.chat.id // empty')"
    text="$(printf '%s' "$item" | jq -r '.message.text // empty')"
    [ "$chat_id" = "$TELEGRAM_CHAT_ID" ] || continue
    json_update ".telegram_offset = $update_id"
    cmd="$(printf '%s' "$text" | awk '{print $1}')"
    arg1="$(printf '%s' "$text" | awk '{print $2}')"
    arg2="$(printf '%s' "$text" | cut -d' ' -f3-)"
    case "$cmd" in
      /pending)
        if jq -e '.pending_ids | length > 0' "$STATE_JSON" >/dev/null; then
          send_tg "Offene Faelle:\n$(jq -r '.pending_ids[]' "$STATE_JSON")"
        else
          send_tg "Keine offenen Faelle."
        fi
        ;;
      /show)
        show_case "$arg1"
        ;;
      /approve)
        send_email_reply "$CASES_DIR/$arg1.json"
        ;;
      /ignore)
        if [ -f "$CASES_DIR/$arg1.json" ]; then
          case_update "$CASES_DIR/$arg1.json" '.status="ignored"'
          json_update "(.pending_ids // []) |= map(select(. != \"$arg1\"))"
          send_tg "Case $arg1 ignoriert."
        else
          send_tg "Case $arg1 nicht gefunden."
        fi
        ;;
      /revise)
        regenerate_case "$arg1" "$arg2"
        ;;
      /help|/start|*)
        send_help
        ;;
    esac
  done
}

fetch_unseen_uids() {
  curl -s --url "imaps://${IMAP_HOST}/INBOX" --user "$SMTP_USER:$SMTP_PASS" -X 'SEARCH UNSEEN' | grep -Eo '[0-9]+'
}

fetch_url_summary() {
  local case_id="$1"
  local url="$2"
  local slug html_file txt_file title
  slug="$(safe_slug "$url")"
  html_file="$FETCH_DIR/$case_id-$slug.html"
  txt_file="$FETCH_DIR/$case_id-$slug.txt"
  curl -L -s "$url" -o "$html_file" || true
  sed 's/<[^>]*>/ /g; s/&nbsp;/ /g' "$html_file" | tr -s ' ' | head -c 1500 > "$txt_file" || true
  title="$(grep -io '<title>.*</title>' "$html_file" | sed 's#<[^>]*>##g' | head -1 || true)"
  printf -- '- %s (%s)\n' "${title:-$url}" "$url"
}

create_case() {
  local uid="$1"
  local raw_file subject from_header from_email case_id case_json plan_json draft_file raw_excerpt
  local research_summary_file task_summary_file filename
  raw_file="$INBOX_DIR/$uid.eml"
  curl -s --url "imaps://${IMAP_HOST}/INBOX/;UID=$uid" --user "$SMTP_USER:$SMTP_PASS" -o "$raw_file"
  subject="$(extract_header 'Subject' "$raw_file")"
  from_header="$(extract_header 'From' "$raw_file")"
  from_email="$(extract_email_address "$from_header")"
  [ -n "$from_email" ] || from_email="$from_header"
  case_id="mail-$(date -u +%Y%m%d)-$uid"
  case_json="$CASES_DIR/$case_id.json"
  plan_json="$CASES_DIR/$case_id.plan.json"
  draft_file="$CASES_DIR/$case_id.reply.txt"
  research_summary_file="$CASES_DIR/$case_id.research.txt"
  task_summary_file="$CASES_DIR/$case_id.tasks.txt"
  raw_excerpt="$(head -c "$MAX_CODEX_CHARS" "$raw_file" | tr '\r' ' ' | tr '\n' ' ')"

  codex_json_to_file "Analysiere diese rohe E-Mail fuer einen semi-autonomen Maildesk. Antworte NUR mit JSON in genau diesem Format: {\"needs_reply\":true,\"summary\":\"...\",\"risk_flags\":[\"...\"],\"web_fetch_urls\":[\"https://...\"],\"shell_tasks\":[{\"filename\":\"artifact.sh\",\"purpose\":\"...\",\"script\":\"#!/usr/bin/env bash\\necho ...\"}],\"reply_brief\":\"...\",\"follow_up_questions\":[\"...\"]}. Regeln: maximal $MAX_FETCHES URLs, maximal $MAX_TASKS shell_tasks, nur Web-Recherche oder kleine Visualisierungs-/Analyse-Skripte, keine destruktiven Befehle, keine Paketinstallation, keine Secrets ausgeben. E-Mail: $raw_excerpt" "$plan_json"

  : > "$research_summary_file"
  while IFS= read -r url; do
    [ -n "$url" ] || continue
    fetch_url_summary "$case_id" "$url" >> "$research_summary_file"
  done < <(jq -r '.web_fetch_urls[]?' "$plan_json" | head -n "$MAX_FETCHES")

  : > "$task_summary_file"
  while IFS= read -r task; do
    [ -n "$task" ] || continue
    run_shell_task "$case_id" "$task"
    filename="$(printf '%s' "$task" | jq -r '.filename // "artifact.sh"')"
    cat "$ARTIFACT_DIR/$case_id-$filename.summary.txt" >> "$task_summary_file"
  done < <(jq -c '.shell_tasks[]?' "$plan_json" | head -n "$MAX_TASKS")

  jq -n \
    --arg id "$case_id" \
    --arg uid "$uid" \
    --arg from_email "$from_email" \
    --arg from_header "$from_header" \
    --arg subject "$subject" \
    --arg summary "$(jq -r '.summary // "Neue Mail eingegangen."' "$plan_json")" \
    --arg research_summary "$(cat "$research_summary_file" "$task_summary_file" 2>/dev/null)" \
    --arg reply_brief "$(jq -r '.reply_brief // ""' "$plan_json")" \
    --argjson risk_flags "$(jq -c '.risk_flags // []' "$plan_json")" \
    --argjson follow_up_questions "$(jq -c '.follow_up_questions // []' "$plan_json")" \
    '{id:$id,uid:$uid,from_email:$from_email,from_header:$from_header,subject:$subject,summary:$summary,research_summary:$research_summary,reply_brief:$reply_brief,risk_flags:$risk_flags,follow_up_questions:$follow_up_questions,status:"awaiting_approval"}' > "$case_json"

  render_reply "$case_json" "$draft_file"
  case_update "$case_json" --arg draft "$(cat "$draft_file")" '.draft_text=$draft'
  json_update ".processed_uids += [\"$uid\"] | .pending_ids += [\"$case_id\"]"
  send_tg "$(compose_review_message "$case_id")"
}

process_telegram
count=0
while IFS= read -r uid; do
  [ -n "$uid" ] || continue
  jq -e --arg uid "$uid" '.processed_uids | index($uid)' "$STATE_JSON" >/dev/null && continue
  create_case "$uid"
  count=$((count+1))
  [ "$count" -ge "$MAX_EMAILS" ] && break
done < <(fetch_unseen_uids | tail -n "$MAX_EMAILS")
