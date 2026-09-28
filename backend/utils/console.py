"""Console helpers for local scripts and development servers."""

from __future__ import annotations

from typing import TextIO


def configure_utf8_output(*streams: TextIO) -> None:
    """Configure supported text streams to emit UTF-8 safely."""

    for stream in streams:
        reconfigure = getattr(stream, "reconfigure", None)
        if callable(reconfigure):
            reconfigure(encoding="utf-8", errors="replace")
