# theme-clinical

White, blue, lots of whitespace, Inter font. Built for medical and
scientific dashboards where readability is more important than visual
flash.

## Use it

```bash
cp -r theme-clinical/docs/* my-nano-zyrkel/docs/
```

## CSS variables you can tweak

| Variable      | Default     | Purpose                          |
| ------------- | ----------- | -------------------------------- |
| `--brand`     | `#2563EB`   | Primary accent color             |
| `--brand-2`   | `#06B6D4`   | Secondary accent (chart strokes) |
| `--bg`        | `#FFFFFF`   | Page background                  |
| `--surface`   | `#F9FAFB`   | Card background                  |
| `--text`      | `#111827`   | Body text                        |
| `--muted`     | `#6B7280`   | Secondary text                   |
| `--max-w`     | `1080px`    | Content max width                |

Override them in your own stylesheet — they cascade through every
element in this theme.
