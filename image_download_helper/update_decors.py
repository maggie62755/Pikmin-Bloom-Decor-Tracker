#!/usr/bin/env python3
"""Download one Special Decor category and update src/data/decors.json.

The command is intentionally interactive when arguments are omitted:

    python image_download_helper/update_decors.py

It can also be used non-interactively:

    python image_download_helper/update_decors.py "Summer Sticker" \
        --chinese-name "夏日貼紙" --yes
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import re
import shutil
import sys
import unicodedata
import uuid
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator
from urllib.error import HTTPError, URLError

from download_special_decor import (
    FILE_NAME_RE,
    build_category_aliases,
    color_sort_key,
    download_file,
    extract_file_names,
    get_image_download_url,
    get_section_html,
    get_sections,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_ROOT = PROJECT_ROOT / "public" / "images" / "decors_images"
DEFAULT_DATA_FILE = PROJECT_ROOT / "src" / "data" / "decors.json"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
COLOR_ORDER = ("red", "yellow", "blue", "white", "purple", "rock", "winged", "ice")
COLOR_FILE_NAMES = {
    "red": "Red",
    "yellow": "Yellow",
    "blue": "Blue",
    "white": "White",
    "purple": "Purple",
    "rock": "Rock",
    "winged": "Winged",
    "ice": "Ice",
}
EVENT_ID_RE = re.compile(r"^event_[a-z0-9]+(?:_[a-z0-9]+)*$")
IMAGE_TOKEN_RE = re.compile(r"^[A-Za-z0-9]+$")


class UpdateError(RuntimeError):
    """A user-actionable update error."""


@dataclass(frozen=True)
class DownloadSpec:
    color_id: str
    color_file_name: str
    source_file_name: str
    url: str


@dataclass(frozen=True)
class UpdatePlan:
    wiki_name: str
    chinese_name: str
    category_id: str
    image_token: str
    colors: tuple[str, ...]
    specs: tuple[DownloadSpec, ...]
    existing_index: int | None

    @property
    def is_new(self) -> bool:
        return self.existing_index is None


def ascii_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(char for char in normalized if not unicodedata.combining(char))


def normalize_image_token(value: str) -> str:
    """Match the image folder/file convention already used by the project."""
    return re.sub(r"[^A-Za-z0-9]+", "", ascii_text(value))


def normalize_id_token(value: str) -> str:
    token = re.sub(r"[^A-Za-z0-9]+", "_", ascii_text(value)).strip("_").lower()
    return token


def comparable_name(value: str) -> str:
    return normalize_image_token(value).casefold()


def find_wiki_section(category_name: str) -> dict:
    requested = category_name.strip().casefold()
    sections = get_sections()
    for section in sections:
        if section.get("line", "").strip().casefold() == requested:
            return section

    # A short suggestion is more useful than printing every heading on the page.
    import difflib

    names = [section.get("line", "").strip() for section in sections]
    suggestions = difflib.get_close_matches(category_name.strip(), names, n=5, cutoff=0.45)
    hint = f" 可能的名稱：{', '.join(suggestions)}" if suggestions else ""
    raise UpdateError(f'Wiki 找不到飾品分類「{category_name}」。{hint}')


def resolve_download_specs(category_name: str) -> tuple[str, tuple[DownloadSpec, ...]]:
    section = find_wiki_section(category_name)
    wiki_name = section["line"].strip()
    section_html = get_section_html(section["index"])
    file_names = extract_file_names(section_html, build_category_aliases(wiki_name))
    if not file_names:
        raise UpdateError(f'Wiki 分類「{wiki_name}」內找不到飾品 PNG。')

    specs: list[DownloadSpec] = []
    seen_colors: set[str] = set()
    for file_name in sorted(file_names, key=color_sort_key):
        match = FILE_NAME_RE.match(file_name)
        if not match:
            continue

        raw_color = match.group("color")
        color_id = raw_color.casefold()
        if color_id not in COLOR_FILE_NAMES:
            raise UpdateError(
                f'「{wiki_name}」含有無法自動對應的圖片 {file_name}（顏色欄位：{raw_color}）。'
                " 這通常代表同色有多款造型，請先調整 JSON 的 variants 規則。"
            )
        if color_id in seen_colors:
            raise UpdateError(
                f'「{wiki_name}」的 {raw_color} 有多張圖片；為避免覆蓋檔案，工具已停止。'
            )

        seen_colors.add(color_id)
        specs.append(
            DownloadSpec(
                color_id=color_id,
                color_file_name=COLOR_FILE_NAMES[color_id],
                source_file_name=file_name,
                url=get_image_download_url(file_name),
            )
        )

    if not specs:
        raise UpdateError(f'Wiki 分類「{wiki_name}」內沒有支援的皮克敏顏色。')

    specs.sort(key=lambda item: COLOR_ORDER.index(item.color_id))
    return wiki_name, tuple(specs)


def load_decor_data(path: Path) -> tuple[dict, bytes, str]:
    try:
        original = path.read_bytes()
        data = json.loads(original.decode("utf-8"))
    except FileNotFoundError as exc:
        raise UpdateError(f"找不到資料檔：{path}") from exc
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise UpdateError(f"資料檔不是有效的 UTF-8 JSON：{path}\n{exc}") from exc

    if not isinstance(data, dict) or not isinstance(data.get("categories"), list):
        raise UpdateError(f"資料檔缺少 categories 陣列：{path}")

    newline = "\r\n" if b"\r\n" in original else "\n"
    return data, original, newline


def find_existing_category(
    categories: list[dict], wiki_name: str, image_token: str, category_id: str
) -> int | None:
    matches: list[int] = []
    wiki_key = comparable_name(wiki_name)
    image_key = image_token.casefold()

    for index, category in enumerate(categories):
        if not isinstance(category, dict):
            continue
        same_id = str(category.get("id", "")).casefold() == category_id.casefold()
        same_name = comparable_name(str(category.get("name", ""))) == wiki_key
        same_image = str(category.get("image_path", "")).casefold() == image_key
        if same_id or same_name or same_image:
            matches.append(index)

    if len(matches) > 1:
        ids = ", ".join(str(categories[index].get("id")) for index in matches)
        raise UpdateError(f"找到多個可能重複的分類（{ids}），請先整理 decors.json。")
    return matches[0] if matches else None


def validate_existing_category(category: dict) -> dict:
    variants = category.get("variants")
    if not isinstance(variants, list) or len(variants) != 1 or not isinstance(variants[0], dict):
        raise UpdateError(
            f'既有分類「{category.get("name", category.get("id"))}」不是單一 variant，'
            "工具無法安全地自動合併。"
        )
    image_path = str(category.get("image_path", ""))
    image_name = str(variants[0].get("image_name", ""))
    if not image_path or not image_name:
        raise UpdateError("既有分類缺少 image_path 或 image_name。")
    if not IMAGE_TOKEN_RE.fullmatch(image_path) or not IMAGE_TOKEN_RE.fullmatch(image_name):
        raise UpdateError(
            "既有分類的 image_path 或 image_name 不符合專案的英數字命名規則。"
        )
    return variants[0]


def create_plan(
    data: dict,
    requested_name: str,
    chinese_name: str | None,
    custom_id: str | None,
    custom_image_token: str | None,
    resolved: tuple[str, tuple[DownloadSpec, ...]] | None = None,
) -> UpdatePlan:
    wiki_name, specs = resolved or resolve_download_specs(requested_name)
    default_image_token = normalize_image_token(wiki_name)
    image_token = custom_image_token or default_image_token
    category_id = custom_id or f"event_{normalize_id_token(wiki_name)}"

    if not image_token or not IMAGE_TOKEN_RE.fullmatch(image_token):
        raise UpdateError("image name 只能包含英文字母與數字。")
    if not EVENT_ID_RE.fullmatch(category_id):
        raise UpdateError("id 必須是 event_ 開頭的小寫 snake_case，例如 event_summer_sticker。")

    categories = data["categories"]
    existing_index = find_existing_category(categories, wiki_name, image_token, category_id)
    if existing_index is not None:
        existing = categories[existing_index]
        variant = validate_existing_category(existing)
        if custom_image_token and custom_image_token != existing["image_path"]:
            raise UpdateError("更新既有分類時不可變更 image name，以免舊圖片路徑失效。")
        image_token = str(existing["image_path"])
        category_id = str(existing["id"])
        chinese_name = chinese_name or str(existing.get("name_ch", ""))
        if not chinese_name:
            raise UpdateError("既有分類缺少中文名稱，請使用 --chinese-name 補上。")
        # Validate now so the final destination always agrees with the existing variant.
        if not variant.get("image_name"):
            raise UpdateError("既有分類缺少 image_name。")
    elif not chinese_name:
        raise UpdateError("新增分類需要中文名稱，請輸入或使用 --chinese-name。")

    return UpdatePlan(
        wiki_name=wiki_name,
        chinese_name=chinese_name,
        category_id=category_id,
        image_token=image_token,
        colors=tuple(spec.color_id for spec in specs),
        specs=specs,
        existing_index=existing_index,
    )


def apply_plan_to_data(data: dict, plan: UpdatePlan) -> dict:
    updated = copy.deepcopy(data)
    categories = updated["categories"]

    if plan.is_new:
        category = {
            "id": plan.category_id,
            "name": plan.wiki_name,
            "name_ch": plan.chinese_name,
            "icon": "special.png",
            "image_path": plan.image_token,
            "variants": [
                {
                    "id": plan.category_id,
                    "name": plan.wiki_name,
                    "name_ch": plan.chinese_name,
                    "image_name": plan.image_token,
                    "colors": list(plan.colors),
                }
            ],
        }
        categories.append(category)
        return updated

    category = categories[plan.existing_index]
    variant = validate_existing_category(category)
    category["name_ch"] = plan.chinese_name
    variant["name_ch"] = plan.chinese_name
    variant["colors"] = list(plan.colors)
    return updated


def destination_for_spec(output_root: Path, data: dict, plan: UpdatePlan, spec: DownloadSpec) -> Path:
    if plan.is_new:
        image_name = plan.image_token
    else:
        category = data["categories"][plan.existing_index]
        image_name = str(validate_existing_category(category)["image_name"])
    return output_root / plan.image_token / f"{image_name}_{spec.color_file_name}.png"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_png(path: Path) -> None:
    try:
        size = path.stat().st_size
        with path.open("rb") as stream:
            signature = stream.read(len(PNG_SIGNATURE))
    except OSError as exc:
        raise UpdateError(f"無法檢查下載檔：{path}\n{exc}") from exc
    if size <= len(PNG_SIGNATURE) or signature != PNG_SIGNATURE:
        raise UpdateError(f"下載內容不是有效的 PNG：{path.name}")


@contextmanager
def temporary_directory(parent: Path, prefix: str) -> Iterator[Path]:
    """Create a removable workspace directory without tempfile's Windows ACL changes."""
    path = parent / f"{prefix}{uuid.uuid4().hex}"
    path.mkdir(parents=False, exist_ok=False)
    try:
        yield path
    finally:
        shutil.rmtree(path, ignore_errors=True)


def serialize_json(data: dict, newline: str) -> bytes:
    text = json.dumps(data, ensure_ascii=False, indent=4) + "\n"
    if newline != "\n":
        text = text.replace("\n", newline)
    return text.encode("utf-8")


def commit_update(
    staged_files: list[tuple[Path, Path]],
    data_file: Path,
    updated_json: bytes,
    force: bool,
) -> tuple[int, int]:
    """Atomically replace individual files and roll them back if a later step fails."""
    changed: list[tuple[Path, Path | None]] = []
    skipped = 0
    rollback_root = data_file.parent / f".decor-rollback-{uuid.uuid4().hex}"
    rollback_root.mkdir(parents=False, exist_ok=False)
    json_temp = data_file.with_name(f".{data_file.name}.{uuid.uuid4().hex}.tmp")

    try:
        for staged, destination in staged_files:
            destination.parent.mkdir(parents=True, exist_ok=True)
            if destination.exists() and sha256(staged) == sha256(destination):
                skipped += 1
                continue
            if destination.exists() and not force:
                raise UpdateError(
                    f"圖片已存在且內容不同：{destination}\n"
                    "如確定要以 Wiki 圖片取代，請加上 --force。"
                )

            backup: Path | None = None
            if destination.exists():
                backup = rollback_root / f"{len(changed)}.png"
                shutil.copy2(destination, backup)

            destination_temp = destination.with_name(f".{destination.name}.{uuid.uuid4().hex}.tmp")
            try:
                shutil.copy2(staged, destination_temp)
                os.replace(destination_temp, destination)
            finally:
                destination_temp.unlink(missing_ok=True)
            changed.append((destination, backup))

        json_temp.write_bytes(updated_json)
        os.replace(json_temp, data_file)
        return len(changed), skipped
    except Exception:
        for destination, backup in reversed(changed):
            if backup is None:
                destination.unlink(missing_ok=True)
            else:
                os.replace(backup, destination)
        raise
    finally:
        json_temp.unlink(missing_ok=True)
        shutil.rmtree(rollback_root, ignore_errors=True)


def print_plan(plan: UpdatePlan, data_file: Path, output_root: Path, data: dict) -> None:
    action = "新增分類" if plan.is_new else "更新既有分類"
    if plan.is_new:
        image_name = plan.image_token
    else:
        category = data["categories"][plan.existing_index]
        image_name = str(validate_existing_category(category)["image_name"])

    print("\n預計更新內容")
    print("-" * 64)
    print(f"動作：       {action}")
    print(f"英文名稱：   {plan.wiki_name}")
    print(f"中文名稱：   {plan.chinese_name}")
    print(f"ID：         {plan.category_id}")
    print(f"圖片目錄：   {output_root / plan.image_token}")
    print(f"圖片前綴：   {image_name}")
    print(f"顏色：       {', '.join(plan.colors)}")
    print(f"圖片數：     {len(plan.specs)}")
    print("圖片檔名：")
    for spec in plan.specs:
        print(f"  - {image_name}_{spec.color_file_name}.png")
    print(f"資料檔：     {data_file}")
    print("-" * 64)


def prompt_required(label: str) -> str:
    while True:
        value = input(label).strip()
        if value:
            return value
        print("此欄位不可空白。")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="下載一組 Special Decor 圖片，並同步更新 src/data/decors.json。",
        formatter_class=argparse.RawTextHelpFormatter,
        epilog=(
            "範例：\n"
            "  python image_download_helper/update_decors.py\n"
            '  python image_download_helper/update_decors.py "Summer Sticker" '
            '--chinese-name "夏日貼紙" --dry-run\n'
            '  python image_download_helper/update_decors.py "Summer Sticker" '
            '--chinese-name "夏日貼紙" --yes'
        ),
    )
    parser.add_argument("category", nargs="?", help="Wiki 上的 Special Decor 英文分類名稱。")
    parser.add_argument("--chinese-name", "-z", help="網站顯示的繁體中文名稱。")
    parser.add_argument("--id", dest="custom_id", help="覆寫新分類 ID（須為 event_...）。")
    parser.add_argument(
        "--image-name",
        dest="custom_image_token",
        help="覆寫新分類的圖片目錄與檔名前綴（只允許英數字）。",
    )
    parser.add_argument("--dry-run", action="store_true", help="只顯示預計變更，不下載或寫檔。")
    parser.add_argument("--yes", "-y", action="store_true", help="略過最後確認。")
    parser.add_argument("--force", action="store_true", help="允許覆寫內容不同的既有圖片。")
    parser.add_argument("--list-categories", "-l", action="store_true", help="列出 Wiki 頁面章節。")
    parser.add_argument(
        "--output-root",
        type=Path,
        default=DEFAULT_OUTPUT_ROOT,
        help=argparse.SUPPRESS,
    )
    parser.add_argument(
        "--data-file",
        type=Path,
        default=DEFAULT_DATA_FILE,
        help=argparse.SUPPRESS,
    )
    return parser.parse_args()


def configure_windows_console() -> None:
    """Keep Traditional Chinese prompts readable in Windows terminals."""
    if sys.platform != "win32":
        return
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure:
            reconfigure(encoding="utf-8")


def main() -> int:
    configure_windows_console()
    args = parse_args()
    output_root = args.output_root.resolve()
    data_file = args.data_file.resolve()

    try:
        if args.list_categories:
            print("Wiki 頁面章節：")
            for section in get_sections():
                print(section.get("line", "").strip())
            return 0

        category_name = args.category
        if not category_name:
            if not sys.stdin.isatty():
                raise UpdateError("請提供 Wiki 英文分類名稱。")
            category_name = prompt_required("Wiki 英文分類名稱：")

        print(f'正在查詢 Wiki 分類「{category_name}」...')
        resolved = resolve_download_specs(category_name)
        data, _original_json, newline = load_decor_data(data_file)

        # First identify whether this is an existing category. A new category then needs
        # one extra human-supplied translation, which cannot be inferred reliably from Wiki.
        chinese_name = args.chinese_name
        try:
            plan = create_plan(
                data,
                category_name,
                chinese_name,
                args.custom_id,
                args.custom_image_token,
                resolved=resolved,
            )
        except UpdateError as exc:
            if "新增分類需要中文名稱" not in str(exc) or not sys.stdin.isatty():
                raise
            chinese_name = prompt_required("網站顯示的繁體中文名稱：")
            plan = create_plan(
                data,
                category_name,
                chinese_name,
                args.custom_id,
                args.custom_image_token,
                resolved=resolved,
            )

        updated_data = apply_plan_to_data(data, plan)
        print_plan(plan, data_file, output_root, data)

        if args.dry_run:
            print("Dry run 完成，未下載圖片，也未修改檔案。")
            return 0

        if not args.yes:
            if not sys.stdin.isatty():
                raise UpdateError("非互動模式請加上 --yes 才會寫入。")
            answer = input("確認下載並更新？[y/N] ").strip().casefold()
            if answer not in {"y", "yes"}:
                print("已取消，未修改任何檔案。")
                return 0

        with temporary_directory(PROJECT_ROOT, ".pikmin-decor-update-") as stage_root:
            staged_files: list[tuple[Path, Path]] = []
            for spec in plan.specs:
                staged = stage_root / f"{spec.color_file_name}.png"
                destination = destination_for_spec(output_root, data, plan, spec)
                print(f"下載 {spec.source_file_name} ...")
                download_file(spec.url, staged)
                validate_png(staged)
                staged_files.append((staged, destination))

            changed, skipped = commit_update(
                staged_files,
                data_file,
                serialize_json(updated_data, newline),
                args.force,
            )

        action = "新增" if plan.is_new else "更新"
        print(f"完成：已{action} {plan.wiki_name}，寫入 {changed} 張圖片，略過 {skipped} 張相同圖片。")
        return 0
    except UpdateError as exc:
        print(f"錯誤：{exc}", file=sys.stderr)
        return 1
    except (HTTPError, URLError, TimeoutError) as exc:
        print(f"網路錯誤：{exc}", file=sys.stderr)
        return 1
    except OSError as exc:
        print(f"檔案錯誤：{exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
