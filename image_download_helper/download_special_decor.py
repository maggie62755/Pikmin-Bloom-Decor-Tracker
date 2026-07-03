#!/usr/bin/env python3
r"""Download Pikmin Bloom Special Decor images by category.

Example:
    python download_decor_images.py "Summer Sticker"
    python download_decor_images.py -l
    python download_decor_images.py "Summer Sticker" --output "C:\Users\s1065\project\Maggie\Pikmin Bloom 2\public\images\decors_images"
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


BASE_URL = "https://www.pikminwiki.com"
API_URL = f"{BASE_URL}/api.php"
PAGE_TITLE = "Special_Decor_Pikmin"
USER_AGENT = "PikminDecorImageDownloader/1.0"
FILE_NAME_RE = re.compile(r"^Decor_(?P<color>.+?)_(?P<category>.+)\.png$")


class SectionImageLinkParser(HTMLParser):
    """Collect file-page links from a MediaWiki section HTML fragment."""

    def __init__(self) -> None:
        super().__init__()
        self.file_links: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "a":
            return

        attrs_dict = dict(attrs)
        href = attrs_dict.get("href")
        css_class = attrs_dict.get("class") or ""
        if not href or "image" not in css_class.split():
            return
        if not href.startswith("/File:Decor_"):
            return
        self.file_links.append(href)


def fetch_json(url: str) -> dict:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request) as response:
        return json.load(response)


def get_sections() -> list[dict]:
    params = {
        "action": "parse",
        "page": PAGE_TITLE,
        "prop": "sections",
        "format": "json",
    }
    data = fetch_json(f"{API_URL}?{urlencode(params)}")
    return data["parse"]["sections"]


def get_section_index(category_name: str) -> str:
    sections = get_sections()

    for section in sections:
        if section["line"].strip().lower() == category_name.strip().lower():
            return section["index"]

    available = ", ".join(section["line"] for section in sections)
    raise ValueError(f'Category "{category_name}" not found. Available sections: {available}')


def get_section_html(section_index: str) -> str:
    params = {
        "action": "parse",
        "page": PAGE_TITLE,
        "prop": "text",
        "section": section_index,
        "format": "json",
    }
    data = fetch_json(f"{API_URL}?{urlencode(params)}")
    return data["parse"]["text"]["*"]


def get_image_download_url(file_name: str) -> str:
    params = {
        "action": "query",
        "titles": f"File:{file_name}",
        "prop": "imageinfo",
        "iiprop": "url",
        "format": "json",
    }
    data = fetch_json(f"{API_URL}?{urlencode(params)}")
    pages = data["query"]["pages"]
    page = next(iter(pages.values()))
    imageinfo = page.get("imageinfo")
    if not imageinfo:
        raise ValueError(f"Could not resolve image URL for {file_name}")
    return imageinfo[0]["url"]


def normalize_category_token(text: str) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "", text).lower()


def build_category_aliases(category_name: str) -> set[str]:
    aliases = {normalize_category_token(category_name)}
    if ":" in category_name:
        primary = category_name.split(":", maxsplit=1)[0].strip()
        if primary:
            aliases.add(normalize_category_token(primary))
    return aliases


def extract_file_names(section_html: str, category_aliases: set[str]) -> list[str]:
    parser = SectionImageLinkParser()
    parser.feed(section_html)

    matches: list[str] = []
    seen: set[str] = set()
    for href in parser.file_links:
        file_name = href.removeprefix("/File:")
        match = FILE_NAME_RE.match(file_name)
        if not match:
            continue
        file_category = normalize_category_token(match.group("category"))
        if file_category not in category_aliases:
            continue
        if file_name not in seen:
            seen.add(file_name)
            matches.append(file_name)

    if matches:
        return matches

    # Fallback: if aliases are still too strict for this section, keep all decor images from it.
    for href in parser.file_links:
        file_name = href.removeprefix("/File:")
        if not FILE_NAME_RE.match(file_name):
            continue
        if file_name not in seen:
            seen.add(file_name)
            matches.append(file_name)

    return matches


def normalize_category_name(category_name: str) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "", category_name)


def color_sort_key(file_name: str) -> tuple[int, str]:
    match = FILE_NAME_RE.match(file_name)
    color = match.group("color") if match else file_name
    order = ["Red", "Yellow", "Blue", "White", "Purple", "Rock", "Winged", "Ice"]
    try:
        return (order.index(color), color)
    except ValueError:
        return (len(order), color)


def download_file(url: str, destination: Path) -> None:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request) as response, destination.open("wb") as output:
        output.write(response.read())


def build_output_path(output_root: Path, category_dir: str, file_name: str) -> Path:
    match = FILE_NAME_RE.match(file_name)
    if not match:
        raise ValueError(f"Unexpected file name format: {file_name}")

    color = match.group("color")
    return output_root / category_dir / f"{category_dir}_{color}.png"


def iter_download_targets(category_name: str, output_root: Path) -> Iterable[tuple[str, Path]]:
    category_aliases = build_category_aliases(category_name)
    section_index = get_section_index(category_name)
    section_html = get_section_html(section_index)
    file_names = extract_file_names(section_html, category_aliases)

    if not file_names:
        raise ValueError(f'No decor images found for category "{category_name}".')

    category_dir = normalize_category_name(category_name)
    for file_name in sorted(file_names, key=color_sort_key):
        download_url = get_image_download_url(file_name)
        yield download_url, build_output_path(output_root, category_dir, file_name)


def parse_args() -> argparse.Namespace:
    example_output = r"C:\Users\s1065\project\Maggie\Pikmin Bloom 2\public\images\decors_images"
    parser = argparse.ArgumentParser(
        description="Download Pikmin Bloom Special Decor images for a specified category.",
        epilog=(
            "Examples:\n"
            '  python download_decor_images.py -l\n'
            '  python download_decor_images.py "Summer Sticker"\n'
            f'  python download_decor_images.py "Summer Sticker" --output "{example_output}"'
        ),
        formatter_class=argparse.RawTextHelpFormatter,
    )
    parser.add_argument(
        "category",
        nargs="?",
        help='Category name on the wiki, for example "Summer Sticker".',
    )
    parser.add_argument(
        "--output",
        default="",
        help="Output root folder. The category subfolder structure is preserved.",
    )
    parser.add_argument(
        "--list-categories",
        "-l",
        action="store_true",
        help="List all available categories from the wiki and exit.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    output_root = Path(args.output).resolve()

    try:
        if args.list_categories:
            sections = get_sections()
            print("Available categories:")
            for section in sections:
                print(section["line"])
            return 0

        if not args.category:
            print("A category is required unless --list-categories is used.", file=sys.stderr)
            return 1

        downloads = list(iter_download_targets(args.category, output_root))
        for _, destination in downloads:
            destination.parent.mkdir(parents=True, exist_ok=True)

        for url, destination in downloads:
            print(f"Downloading {url} -> {destination}")
            download_file(url, destination)
    except ValueError as exc:
        print(exc, file=sys.stderr)
        return 1
    except (HTTPError, URLError) as exc:
        print(f"Network error: {exc}", file=sys.stderr)
        return 1

    print(f"Done. Downloaded {len(downloads)} files to {output_root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
