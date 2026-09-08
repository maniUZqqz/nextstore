#!/bin/sh
#
# فعال‌سازی هوک‌های گیت.
# =============================================================================
# ⚠️ هوک‌ها در `.githooks/` نگه داشته می‌شوند نه `.git/hooks/`، چون
#    محتویات `.git/` وارد مخزن نمی‌شود. این دستور به گیت می‌گوید کجا
#    دنبالشان بگردد.
#
#    هر کسی که مخزن را clone می‌کند باید یک بار اجرایش کند.

set -e

git config core.hooksPath .githooks
chmod +x .githooks/* 2>/dev/null || true

echo "✓ هوک‌های گیت فعال شدند (core.hooksPath = .githooks)"
echo "  برای غیرفعال کردن:  git config --unset core.hooksPath"
