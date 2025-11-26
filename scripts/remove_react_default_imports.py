import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1] / "frontend" / "src"
PATTERN = re.compile(
    r"^\s*import\s+React(?:,\s*\{(?P<named>[^}]*)\})?\s+from\s+['\"]react['\"];?\s*$",
    re.MULTILINE,
)

changed_files = []
for file_path in ROOT.rglob("*.jsx"):
    text = file_path.read_text(encoding="utf-8")

    def _replace(match: re.Match[str]) -> str:
        named = match.group("named")
        if named:
            cleaned = " ".join(named.split())
            return f"import {{{cleaned}}} from 'react';"
        return ""

    new_text, count = PATTERN.subn(_replace, text)
    if count:
        file_path.write_text(new_text, encoding="utf-8")
        changed_files.append((file_path, count))

if changed_files:
    print("Updated React imports in:")
    for path, cnt in changed_files:
        rel = path.relative_to(ROOT.parents[0])
        print(f"  {rel} ({cnt} change(s))")
else:
    print("No default React imports found.")

