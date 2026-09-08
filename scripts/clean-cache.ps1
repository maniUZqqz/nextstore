<#
.SYNOPSIS
    پاکسازی کش‌های بازساختنی پروژه — برای جلوگیری از پر شدن درایو C.

.DESCRIPTION
    ⚠️ چرا این اسکریپت لازم شد؟

       درایو C روی این سیستم همیشه نزدیک به پر است. کش توربوپک در
       `.next` با هر بیلد چند صد مگابایت رشد می‌کند و یک‌بار به ۱.۵
       گیگابایت رسید. وقتی فضا تمام شد، Next نتوانست کش را بنویسد و
       صفحه‌ها **بدون خطای آشکار** هیدریشن نشدند: دکمه‌ها در HTML
       بودند ولی هیچ کلیکی کار نمی‌کرد. تست‌های سرتاسری شکست خوردند
       و شکست دقیقاً شبیه باگ کد به نظر می‌رسید.

       تشخیص آن یک ساعت وقت گرفت. این اسکریپت همان تشخیص را به یک
       دستور تبدیل می‌کند.

    چیزهایی که پاک می‌شوند، همه بازساختنی‌اند:
      .next            کش بیلد Next — با اجرای بعدی ساخته می‌شود
      npm-cache        پروژه با pnpm کار می‌کند؛ این کش بلااستفاده است
      Temp             فقط فایل‌های قدیمی‌تر از یک روز
      storage/logs     لاگ‌های لاراول
      pnpm store       فقط بسته‌های بی‌ارجاع (prune)

    ⚠️ چیزی که پاک **نمی‌شود** و نباید بشود:
      node_modules            نصب دوباره چند دقیقه طول می‌کشد
      ms-playwright           مرورگر تست‌های سرتاسری
      database/database.sqlite  کل داده‌ی دمو

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\clean-cache.ps1

.EXAMPLE
    # فقط گزارش، بدون حذف
    powershell -ExecutionPolicy Bypass -File scripts\clean-cache.ps1 -WhatIf
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    # حذف پوسته‌ی headless پلی‌رایت (~۲۵۰ مگابایت).
    #
    # ⚠️ اسکریپت‌های تست این پروژه از آن استفاده **نمی‌کنند** — همه با
    #    `executablePath` مرورگر کامل را صدا می‌زنند و پوشه‌های headless
    #    را صریحاً رد می‌کنند. ولی اگر روزی `playwright test` ساده اجرا
    #    شود، دوباره دانلود می‌شود. پس پیش‌فرض خاموش است.
    [switch]$DeepClean
)

$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $PSScriptRoot

function Get-SizeMB([string]$Path) {
    if (-not (Test-Path $Path)) { return 0 }
    $sum = (Get-ChildItem $Path -Recurse -File -ErrorAction SilentlyContinue |
            Measure-Object Length -Sum).Sum
    return [math]::Round($sum / 1MB, 1)
}

$freeBefore = [math]::Round((Get-PSDrive C).Free / 1GB, 2)
Write-Host ""
Write-Host "فضای آزاد پیش از پاکسازی: $freeBefore GB" -ForegroundColor Cyan
Write-Host ""

# ---------------------------------------------------------------------------
# ⚠️ سرور dev باید پیش از حذف `.next` متوقف شود.
#
#    حذف کش زیر پای سرور در حال اجرا، آن را در وضعیتی رها می‌کند که به
#    فایل‌های ناموجود ارجاع می‌دهد. نتیجه **خطای ۵۰۰ روی همه‌ی صفحات**
#    است، با پیامی که هیچ ربطی به علت ندارد:
#        Cannot find module '../chunks/ssr/[turbopack]_runtime.js'
#
#    یک‌بار همین اتفاق افتاد و شبیه رگرسیون کد به نظر رسید، نه نتیجه‌ی
#    خودِ پاکسازی. پس اسکریپت خودش سرور را متوقف می‌کند و صریح
#    می‌گوید که این کار را کرده.
# ---------------------------------------------------------------------------
$devServers = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*next*dev*' })

if ($devServers.Count -gt 0) {
    if ($PSCmdlet.ShouldProcess('سرور dev', 'توقف پیش از پاکسازی')) {
        foreach ($proc in $devServers) {
            Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
        Write-Host "  ⏹ سرور dev متوقف شد تا کش با خیال راحت پاک شود." -ForegroundColor Yellow
        Write-Host "     پس از پاکسازی دوباره اجرایش کن: run.bat" -ForegroundColor Yellow
        Write-Host ""
    }
}

# --- اهدافی که کامل حذف می‌شوند ---
$targets = [ordered]@{
    'کش بیلد Next'  = Join-Path $root 'nextstore-web\.next'
    'کش npm'        = Join-Path $env:LOCALAPPDATA 'npm-cache\_cacache'
    'لاگ لاراول'    = Join-Path $root 'nextstore-api\storage\logs'
}

foreach ($name in $targets.Keys) {
    $path = $targets[$name]
    $size = Get-SizeMB $path

    if ($size -eq 0) {
        Write-Host "  - $name : چیزی برای پاک کردن نیست"
        continue
    }

    if ($PSCmdlet.ShouldProcess($path, 'حذف')) {
        # لاگ‌ها فایل‌اند و خود پوشه باید بماند
        if ($name -eq 'لاگ لاراول') {
            Get-ChildItem $path -Filter *.log | Remove-Item -Force
        }
        else {
            Remove-Item $path -Recurse -Force
        }
        Write-Host "  ✓ $name : $size MB آزاد شد" -ForegroundColor Green
    }
}

# --- Temp: فقط فایل‌های قدیمی، تا فایل‌های در حال استفاده قفل نشوند ---
$cutoff = (Get-Date).AddDays(-1)
if ($PSCmdlet.ShouldProcess($env:TEMP, 'حذف فایل‌های قدیمی‌تر از یک روز')) {
    Get-ChildItem $env:TEMP -Force |
        Where-Object { $_.LastWriteTime -lt $cutoff } |
        ForEach-Object { Remove-Item $_.FullName -Recurse -Force }
    Write-Host "  ✓ Temp : فایل‌های قدیمی پاک شدند" -ForegroundColor Green
}

# --- پوسته‌ی headless پلی‌رایت — فقط با -DeepClean ---
if ($DeepClean) {
    $shell = Get-ChildItem (Join-Path $env:LOCALAPPDATA 'ms-playwright') -Directory |
        Where-Object { $_.Name -like 'chromium_headless_shell-*' }

    foreach ($dir in $shell) {
        $size = Get-SizeMB $dir.FullName
        if ($PSCmdlet.ShouldProcess($dir.FullName, 'حذف')) {
            Remove-Item $dir.FullName -Recurse -Force
            Write-Host "  ✓ پوسته‌ی headless پلی‌رایت : $size MB آزاد شد" -ForegroundColor Green
        }
    }
}

# --- pnpm: فقط بسته‌هایی که هیچ پروژه‌ای ارجاعشان نمی‌دهد ---
if ($PSCmdlet.ShouldProcess('pnpm store', 'prune')) {
    Push-Location (Join-Path $root 'nextstore-web')
    & pnpm store prune 2>&1 | Select-Object -Last 1
    Pop-Location
}

$freeAfter = [math]::Round((Get-PSDrive C).Free / 1GB, 2)
$gained = [math]::Round($freeAfter - $freeBefore, 2)

Write-Host ""
Write-Host "فضای آزاد پس از پاکسازی: $freeAfter GB  (+$gained GB)" -ForegroundColor Cyan

# --- هشدار وقتی فضا هنوز کم است ---
if ($freeAfter -lt 3) {
    Write-Host ""
    Write-Host "⚠️  کمتر از ۳ گیگابایت آزاد است." -ForegroundColor Yellow
    Write-Host "   بیلد تولید Next به تنهایی می‌تواند بیش از یک گیگابایت بگیرد." -ForegroundColor Yellow
    Write-Host "   اگر سرور dev بی‌دلیل مرد یا صفحه‌ها هیدریشن نشدند، علتش همین است." -ForegroundColor Yellow
    Write-Host "   برای ~۲۵۰ مگابایت بیشتر:  clean-cache.ps1 -DeepClean" -ForegroundColor Yellow
}
Write-Host ""
