import argparse
import html
import json
from pathlib import Path


def has_displayable_content(value):
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (int, float, bool)):
        return True
    if isinstance(value, list):
        return any(has_displayable_content(item) for item in value)
    if isinstance(value, dict):
        return any(has_displayable_content(item) for item in value.values())
    return False


def text(value):
    return html.escape(str(value), quote=True)


def render_header(resume):
    basics = resume.get("basics") or {}
    name = basics.get("name")
    label = basics.get("label")
    summary = basics.get("summary")
    email = basics.get("email")
    phone = basics.get("phone")
    url = basics.get("url")

    profile_links = []
    for profile in basics.get("profiles") or []:
        if not isinstance(profile, dict):
            continue
        link_url = profile.get("url")
        link_label = profile.get("network") or profile.get("username") or profile.get("url")
        if has_displayable_content(link_url) and has_displayable_content(link_label):
            profile_links.append(
                f'<li><a href="{text(link_url)}" rel="noopener noreferrer">{text(link_label)}</a></li>'
            )

    pieces = []
    if has_displayable_content(name):
        pieces.append(f"<h1>{text(name)}</h1>")
    if has_displayable_content(label):
        pieces.append(f"<p>{text(label)}</p>")
    if has_displayable_content(summary):
        pieces.append(f"<p>{text(summary)}</p>")

    contact_bits = []
    if has_displayable_content(email):
        contact_bits.append(f'<a href="mailto:{text(email)}">{text(email)}</a>')
    if has_displayable_content(phone):
        contact_bits.append(text(phone))
    if has_displayable_content(url):
        contact_bits.append(f'<a href="{text(url)}" rel="noopener noreferrer">{text(url)}</a>')

    if contact_bits:
        pieces.append(f"<p>{' | '.join(contact_bits)}</p>")

    if profile_links:
        pieces.append(f"<ul>{''.join(profile_links)}</ul>")

    if not pieces:
        return ""
    return f"<section>{''.join(pieces)}</section>"


def render_timeline_section(title, section_data, fields):
    entries = []
    for item in section_data or []:
        if not isinstance(item, dict):
            continue
        if not any(has_displayable_content(item.get(field)) for field in fields):
            continue

        parts = []
        heading_bits = [item.get(fields[0]), item.get(fields[1]) if len(fields) > 1 else None]
        heading_bits = [text(bit) for bit in heading_bits if has_displayable_content(bit)]
        if heading_bits:
            parts.append(f"<h3>{' - '.join(heading_bits)}</h3>")

        date_start = item.get("startDate")
        date_end = item.get("endDate")
        if has_displayable_content(date_start) or has_displayable_content(date_end):
            label = f"{date_start or ''} - {date_end or ''}".strip(" -")
            if has_displayable_content(label):
                parts.append(f"<p>{text(label)}</p>")

        for paragraph_key in ("summary", "description"):
            value = item.get(paragraph_key)
            if has_displayable_content(value):
                parts.append(f"<p>{text(value)}</p>")

        highlights = [hl for hl in (item.get("highlights") or []) if has_displayable_content(hl)]
        if highlights:
            parts.append("<ul>" + "".join(f"<li>{text(hl)}</li>" for hl in highlights) + "</ul>")

        if parts:
            entries.append(f"<article>{''.join(parts)}</article>")

    if not entries:
        return ""
    return f"<section><h2>{text(title)}</h2>{''.join(entries)}</section>"


def render_skills(section_data):
    groups = []
    for skill in section_data or []:
        if not isinstance(skill, dict):
            continue
        name = skill.get("name")
        keywords = [word for word in (skill.get("keywords") or []) if has_displayable_content(word)]
        if not has_displayable_content(name) and not keywords:
            continue

        parts = []
        if has_displayable_content(name):
            parts.append(f"<h3>{text(name)}</h3>")
        if keywords:
            parts.append("<ul>" + "".join(f"<li>{text(word)}</li>" for word in keywords) + "</ul>")
        groups.append(f"<article>{''.join(parts)}</article>")

    if not groups:
        return ""
    return f"<section><h2>Skills</h2>{''.join(groups)}</section>"


def render_simple_list(title, items):
    values = [item for item in (items or []) if has_displayable_content(item)]
    if not values:
        return ""
    listing = "".join(f"<li>{text(item)}</li>" for item in values)
    return f"<section><h2>{text(title)}</h2><ul>{listing}</ul></section>"


def render_resume(resume):
    sections = [
        render_header(resume),
        render_timeline_section(
            "Work Experience",
            resume.get("work"),
            ["name", "position", "summary", "highlights"],
        ),
        render_timeline_section(
            "Education",
            resume.get("education"),
            ["institution", "studyType", "area", "courses"],
        ),
        render_timeline_section(
            "Projects",
            resume.get("projects"),
            ["name", "description", "highlights", "url"],
        ),
        render_skills(resume.get("skills")),
        render_simple_list("Languages", [entry.get("language") for entry in (resume.get("languages") or []) if isinstance(entry, dict)]),
        render_simple_list("Certificates", [entry.get("name") for entry in (resume.get("certificates") or []) if isinstance(entry, dict)]),
    ]

    visible_sections = [section for section in sections if section]
    body_content = "".join(visible_sections)

    return (
        "<!doctype html>"
        "<html lang=\"en\">"
        "<head>"
        "<meta charset=\"utf-8\">"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
        "<title>profile-site</title>"
        "<style>"
        "body{font-family:Georgia,serif;margin:2rem auto;max-width:900px;line-height:1.55;padding:0 1rem;color:#1f2933;}"
        "h1,h2,h3{line-height:1.2;margin-bottom:0.5rem;}"
        "section{margin:0 0 1.75rem 0;}"
        "article{margin-bottom:1rem;}"
        "ul{padding-left:1.2rem;margin:0.5rem 0;}"
        "a{color:#0b4f8a;text-decoration:none;}"
        "a:hover{text-decoration:underline;}"
        "</style>"
        "</head>"
        f"<body>{body_content}</body>"
        "</html>"
    )


def main():
    parser = argparse.ArgumentParser(description="Render a simple profile-site HTML from JSON Resume data.")
    parser.add_argument("--input", required=True, help="Path to validated JSON Resume file")
    parser.add_argument("--output", required=True, help="Output HTML path")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    resume = json.loads(input_path.read_text(encoding="utf-8"))
    rendered_html = render_resume(resume)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(rendered_html, encoding="utf-8")

    print(f"Rendered {output_path}")


if __name__ == "__main__":
    main()
