<#
===============================================================================
 NextStore — اسکریپت راه‌اندازی خودکار
===============================================================================
 این اسکریپت همه‌ی کارهای لازم برای بالا آوردن پروژه را انجام می‌دهد:

   ۱. بررسی وجود PHP، Composer، Node و pnpm
   ۲. نصب خودکار وابستگی‌های نصب‌نشده (composer install / pnpm install)
   ۳. ساخت فایل .env و کلید برنامه در صورت نبود
   ۴. ساخت دیتابیس SQLite و اجرای مایگریشن و سیدر در صورت نبود
   ۵. بررسی آزاد بودن پورت‌ها
   ۶. اجرای هم‌زمان بک‌اند لاراول و فرانت‌اند Next.js
   ۷. بررسی سلامت هر دو سرویس پیش از اعلام موفقیت

 پارامترها:
   -Fresh   دیتابیس را از صفر بازسازی و داده نمونه را دوباره می‌ریزد
   -Stop    سرویس‌های در حال اجرا را متوقف می‌کند
   -Prod    فرانت‌اند را در حالت تولید اجرا می‌کند (build + start)
   -Force   پروسه‌ی اشغال‌کننده‌ی پورت را بدون پرسیدن می‌بندد
===============================================================================
#>

[CmdletBinding()]
param(
    [switch]$Fresh,
    [switch]$Stop,
    [switch]$Prod,
    [switch]$Force
)

# خروج فوری در صورت بروز خطای مدیریت‌نشده
$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# کدگذاری خروجی کنسول
# ---------------------------------------------------------------------------
<#
 ⚠️ باگی که این بلوک رفع می‌کند — متن فارسی به‌صورت ????? دیده می‌شد:

    نسخه‌ی قبلی فقط $OutputEncoding را ست می‌کرد. آن متغیر اما فقط
    تعیین می‌کند پاورشل چه کدگذاری‌ای برای *ورودی* دستورات native
    بفرستد؛ هیچ ربطی به آنچه روی کنسول *چاپ* می‌شود ندارد.

    چیزی که خروجی را کنترل می‌کند [Console]::OutputEncoding است. اگر
    آن روی کدپیج قدیمی (مثل CP437) بماند، دات‌نت هر کاراکتر خارج از
    آن کدپیج را با «نزدیک‌ترین معادل» جایگزین می‌کند:
        ✓ (U+2713)  →  √
        هر حرف فارسی →  ?
    دقیقاً همان چیزی که در خروجی دیده می‌شد: یک ? به‌ازای هر حرف.

    run.bat خودش chcp 65001 می‌زند، ولی نمی‌توان به آن تکیه کرد —
    اگر کسی اسکریپت را مستقیم از پاورشل، از ISE، یا از یک ترمینال
    دیگر اجرا کند، آن chcp اصلاً اجرا نشده است. پس کدگذاری را همین‌جا
    و پیش از اولین خروجی تنظیم می‌کنیم.

    داخل try است چون وقتی خروجی ریدایرکت شده باشد (مثلاً در CI یا
    `run.bat > log.txt`) کنسولی وجود ندارد و ست کردن این مقدار خطا
    می‌دهد — که نباید کل اجرا را بخواباند.
#>
try {
    # بدون BOM — وگرنه سه بایت اضافه در ابتدای هر خروجی ریدایرکت‌شده می‌نشیند
    $utf8 = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = $utf8
    $OutputEncoding = $utf8
} catch {
    # کنسول در دسترس نیست (خروجی ریدایرکت شده) — بی‌اهمیت است
}

# ---------------------------------------------------------------------------
# تله‌ی خطای پیش‌بینی‌نشده
# ---------------------------------------------------------------------------
<#
 هر خطایی که جایی مدیریت نشده باشد اینجا گرفته می‌شود.

 چرا لازم است؟ با $ErrorActionPreference = 'Stop' هر خطای کوچک اجرا را
 قطع می‌کند و پاورشل یک دیوارِ متن قرمز با stack trace چاپ می‌کند —
 چیزی که برای کسی که فقط می‌خواهد پروژه را اجرا کند هیچ معنایی ندارد
 و حتی نمی‌گوید در کدام مرحله بوده است.

 این تله همان خطا را در قالبی می‌گذارد که بشود از رویش کاری کرد:
 پیام، فایل و شماره خط، و کد خروج مشخص ۹ برای «خطای پیش‌بینی‌نشده».
#>
trap {
    Write-Host ""
    Write-Host "  ══════════ خطای پیش‌بینی‌نشده ══════════" -ForegroundColor Red
    Write-Host ""
    Write-Host "  ✗ $($_.Exception.Message)" -ForegroundColor Red

    if ($_.InvocationInfo) {
        Write-Host "    محل: خط $($_.InvocationInfo.ScriptLineNumber) از $(Split-Path -Leaf $_.InvocationInfo.ScriptName)" -ForegroundColor DarkGray
        if ($_.InvocationInfo.Line) {
            Write-Host "    دستور: $($_.InvocationInfo.Line.Trim())" -ForegroundColor DarkGray
        }
    }

    Write-Host ""
    Write-Host "  اگر تکرار شد، خروجی بالا را همراه با محتوای پوشه .logs گزارش کنید." -ForegroundColor Yellow
    Write-Host ""
    exit 9
}

# ---------------------------------------------------------------------------
# مسیرها و تنظیمات
# ---------------------------------------------------------------------------

$Root      = Split-Path -Parent $PSScriptRoot
$ApiPath   = Join-Path $Root 'nextstore-api'
$WebPath   = Join-Path $Root 'nextstore-web'
$ToolsPath = Join-Path $Root 'tools'

$Php      = Join-Path $ToolsPath 'php\php.exe'
$Composer = Join-Path $ToolsPath 'composer.phar'

$ApiPort = 8100
$WebPort = 3100

$LogDir = Join-Path $Root '.logs'

# ---------------------------------------------------------------------------
# توابع کمکی نمایش
# ---------------------------------------------------------------------------

function Write-Step   { param([string]$Text) Write-Host "`n▶ $Text" -ForegroundColor Cyan }
function Write-Ok     { param([string]$Text) Write-Host "  ✓ $Text" -ForegroundColor Green }
function Write-Warn   { param([string]$Text) Write-Host "  ! $Text" -ForegroundColor Yellow }
function Write-Err    { param([string]$Text) Write-Host "  ✗ $Text" -ForegroundColor Red }
function Write-Info   { param([string]$Text) Write-Host "    $Text" -ForegroundColor DarkGray }

function Write-Banner {
    Write-Host ""
    Write-Host "  ╔════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "  ║   NextStore  —  Laravel 13  +  Next.js 16      ║" -ForegroundColor Magenta
    Write-Host "  ╚════════════════════════════════════════════════╝" -ForegroundColor Magenta
}

<#
.SYNOPSIS
    بررسی می‌کند آیا یک پورت TCP در حال گوش دادن است.
.PARAMETER Port
    شماره پورت
#>
function Test-PortInUse {
    param([int]$Port)
    $null -ne (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

<#
.SYNOPSIS
    اطلاعات کامل پروسه‌ای که یک پورت را اشغال کرده برمی‌گرداند.
.DESCRIPTION
    خروجی شامل شناسه، نام، خط فرمان کامل، و مهم‌تر از همه IsOurs است:
    یعنی آیا این پروسه یکی از سرویس‌های همین پروژه است یا برنامه‌ای
    کاملاً بی‌ربط.

    چرا خط فرمان لازم است؟ روی این سیستم چند پروژه‌ی Node و PHP
    هم‌زمان اجرا می‌شوند. صرفِ اینکه نام پروسه «node» است چیزی
    نمی‌گوید — باید دید از کدام پوشه اجرا شده. بدون این تفکیک،
    بستن خودکار پورت می‌تواند کار در حال انجامِ کس دیگری را از
    بین ببرد.
.PARAMETER Port
    شماره پورت
#>
function Get-PortOwner {
    param([int]$Port)

    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1

    if (-not $conn) { return $null }

    $processId = [int]$conn.OwningProcess
    $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue

    # خط فرمان فقط از CIM در دسترس است، نه از Get-Process
    $commandLine = ''
    try {
        $cim = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction Stop
        $commandLine = [string]$cim.CommandLine
    } catch {
        # دسترسی به خط فرمان ممکن است رد شود (پروسه‌ی سیستمی یا سطح دسترسی بالاتر)
    }

    <#
      تشخیص «مالِ ماست»:
        - خط فرمان به پوشه‌ی این پروژه اشاره کند، یا
        - دستور، همان سرویسی باشد که خودمان اجرا می‌کنیم
          (artisan serve روی پورت ما، یا next dev/start روی پورت ما)

      مقایسه‌ی مسیر با -like و کاراکتر عام انجام می‌شود چون خط فرمان
      ممکن است مسیر را با کوتیشن یا اسلش متفاوت بنویسد.
    #>
    $isOurs = $false
    if ($commandLine) {
        $isOurs =
            ($commandLine -like "*$Root*") -or
            ($commandLine -like '*artisan*serve*' -and $commandLine -like "*$Port*") -or
            ($commandLine -like '*next*' -and $commandLine -like "*$Port*")
    }

    [pscustomobject]@{
        ProcessId   = $processId
        Name        = if ($proc) { $proc.ProcessName } else { "PID $processId" }
        CommandLine = $commandLine
        IsOurs      = $isOurs
    }
}

<#
.SYNOPSIS
    زنجیره‌ی پدرانِ یک پروسه را برمی‌گرداند (از خودش تا ریشه).
.DESCRIPTION
    برای دو کار لازم است:
      ۱. پیدا کردن «ناظر» یک سرور، تا بستنش واقعاً مؤثر باشد
      ۲. ساختن فهرست پروسه‌هایی که *نباید* بسته شوند — یعنی خود این
         اسکریپت و هر چیزی که آن را اجرا کرده است
.PARAMETER ProcessId
    شناسه‌ی پروسه‌ی شروع
#>
function Get-AncestorChain {
    param([int]$ProcessId)

    $chain = @()
    $current = $ProcessId

    # سقف ۱۰ مرحله — محافظت در برابر حلقه در صورت بازاستفاده‌ی شناسه توسط ویندوز
    for ($depth = 0; $depth -lt 10 -and $current -gt 0; $depth++) {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $current" -ErrorAction SilentlyContinue
        if (-not $proc) { break }

        $chain += [pscustomobject]@{
            ProcessId   = [int]$proc.ProcessId
            Name        = [string]$proc.Name
            CommandLine = [string]$proc.CommandLine
        }

        $current = [int]$proc.ParentProcessId
    }

    return $chain
}

<#
.SYNOPSIS
    پورت اشغال‌شده را آزاد می‌کند.
.DESCRIPTION
    اگر پروسه‌ی اشغال‌کننده مالِ همین پروژه باشد (بازمانده‌ی اجرای
    قبلی)، بدون پرسیدن بسته می‌شود. اگر برنامه‌ی بی‌ربطی باشد، از
    کاربر تأیید گرفته می‌شود مگر اینکه -Force داده شده باشد.

    ⚠️ چرا برای پروسه‌ی بیگانه می‌پرسیم؟
       بستن خودکارِ هر چیزی که روی این پورت است، می‌تواند سروری را
       که کاربر عمداً بالا آورده — یا حتی کار ذخیره‌نشده‌اش را — از
       بین ببرد. بازمانده‌ی خودمان داستان دیگری است: آن را خودمان
       ساخته‌ایم و بستنش هیچ چیزی از دست نمی‌دهد.
.PARAMETER Port
    شماره پورت
.PARAMETER Label
    نام سرویس برای نمایش
.PARAMETER AutoConfirm
    بدون پرسیدن ببند (سوییچ -Force)
.OUTPUTS
    [bool] آیا پورت در پایان آزاد است؟
#>
function Clear-Port {
    param(
        [int]$Port,
        [string]$Label,
        [bool]$AutoConfirm = $false
    )

    $owner = Get-PortOwner -Port $Port
    if (-not $owner) { return $true }

    if ($owner.IsOurs) {
        Write-Warn "پورت $Port ($Label) توسط اجرای قبلی همین پروژه اشغال است — بسته می‌شود."
    } else {
        Write-Warn "پورت $Port ($Label) توسط «$($owner.Name)» (شناسه $($owner.ProcessId)) اشغال شده است."

        if ($owner.CommandLine) {
            $preview = $owner.CommandLine
            if ($preview.Length -gt 100) { $preview = $preview.Substring(0, 100) + '…' }
            Write-Info $preview
        }

        if (-not $AutoConfirm) {
            <#
              پیش‌فرض «نه» است: کاربری که سراسیمه Enter می‌زند نباید
              ناخواسته پروسه‌ی کس دیگری را ببندد.

              Read-Host وقتی ورودی ریدایرکت شده باشد بلافاصله رشته‌ی
              خالی برمی‌گرداند، که همان «نه» است — یعنی در حالت
              غیرتعاملی هم رفتار امن دارد.
            #>
            $answer = Read-Host "     این پروسه بسته شود؟ (y/N)"
            if ($answer -notmatch '^[yY]') {
                Write-Err "پورت $Port آزاد نشد."
                Write-Host "     راه‌حل: آن برنامه را ببندید، یا اجرا کنید: run.bat -Force" -ForegroundColor Yellow
                return $false
            }
        }
    }

    <#
      ⚠️ کل زنجیره بسته می‌شود، نه فقط پروسه‌ی شنونده.

      باگی که در تست واقعی پیدا شد: `php artisan serve` یک *ناظر* است
      که خودش cmd.exe و آن هم `php -S` را اجرا می‌کند. شنونده‌ی پورت،
      برگِ این درخت است. با بستن تنها همان برگ، ناظر بلافاصله یکی
      دیگر بالا می‌آورد و پورت هرگز آزاد نمی‌شود — پیام «پس از بستن
      پروسه هنوز آزاد نشد» دقیقاً همین بود.

      پس از برگ به سمت ریشه بالا می‌رویم و هر جدی را که «مالِ ما»
      باشد جمع می‌کنیم، سپس از بالا به پایین می‌بندیم: اول ناظر (تا
      نتواند دوباره بسازد) و بعد بقیه.
    #>

    # پروسه‌های محافظت‌شده: خود این اسکریپت و هر چیزی که آن را اجرا کرده
    $protectedIds = @(Get-AncestorChain -ProcessId $PID | ForEach-Object { $_.ProcessId })

    $chain = Get-AncestorChain -ProcessId $owner.ProcessId
    $toKill = @()

    foreach ($node in $chain) {
        # به محض رسیدن به پروسه‌ای بیرون از دنیای ما، بالا رفتن را متوقف می‌کنیم
        if ($node.ProcessId -in $protectedIds) { break }
        if ($node.CommandLine -notlike "*$Root*") { break }

        $toKill += $node
    }

    # اگر هیچ جدی مالِ ما نبود، دست‌کم خودِ شنونده باید بسته شود
    if ($toKill.Count -eq 0) {
        $toKill = @([pscustomobject]@{ ProcessId = $owner.ProcessId; Name = $owner.Name })
    }

    # از ریشه به برگ: ناظر پیش از فرزندش بسته شود
    [array]::Reverse($toKill)

    foreach ($node in $toKill) {
        try {
            Stop-Process -Id $node.ProcessId -Force -ErrorAction Stop
        } catch {
            <#
              خطا در بستن یک حلقه لزوماً شکست نیست: بستن ناظر معمولاً
              فرزندانش را هم با خود می‌برد، پس وقتی نوبت به فرزند
              می‌رسد ممکن است دیگر وجود نداشته باشد. نتیجه‌ی واقعی را
              پایین‌تر با بررسی خودِ پورت می‌سنجیم، نه با این خطاها.
            #>
            Write-Info "بستن $($node.Name) (شناسه $($node.ProcessId)): $($_.Exception.Message)"
        }
    }

    <#
      صبر تا واقعاً آزاد شود.

      ویندوز سوکت را بلافاصله پس از مرگ پروسه رها نمی‌کند؛ اگر همان
      لحظه سرور را بالا بیاوریم با خطای «آدرس در حال استفاده است»
      شکست می‌خورد — خطایی که به نظر می‌رسد ربطی به این مرحله ندارد
      و پیدا کردنش وقت می‌گیرد.
    #>
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Milliseconds 250
        if (-not (Test-PortInUse -Port $Port)) {
            Write-Ok "پورت $Port آزاد شد"
            return $true
        }
    }

    Write-Err "پورت $Port پس از بستن پروسه هنوز آزاد نشد."
    return $false
}

<#
.SYNOPSIS
    سرور توسعه‌ی Next که روی همین پوشه باز است را می‌بندد.
.DESCRIPTION
    ⚠️ باگی که این تابع رفع می‌کند — «فرانت‌اند بالا نیامد» بدون دلیل روشن:

       بررسی پورت به‌تنهایی کافی نیست. قفل Next روی *پوشه* است، نه
       پورت. اگر جای دیگری `next dev` روی همین پوشه باز باشد — حتی
       روی پورتی کاملاً متفاوت — اجرای دوم با این پیام رد می‌شود:

           ⨯ Another next dev server is already running.

       نتیجه: پورت ۳۱۰۰ آزاد بود، بررسی پورت سبز می‌شد، سرویس اجرا
       می‌شد و بعد در بررسی سلامت شکست می‌خورد — با خطایی که در
       فایل لاگ پنهان بود و هیچ ربطی به مرحله‌ی قبل به نظر نمی‌رسید.

       Next خودش مشخصات سرور در حال اجرا را در .next\dev\lock
       می‌نویسد؛ همان را می‌خوانیم.

    این قفل داخل پوشه‌ی خودِ پروژه است، پس هر پروسه‌ای که در آن ثبت
    شده قطعاً یکی از سرورهای همین پروژه است — نیازی به پرسیدن نیست.
.OUTPUTS
    [bool] آیا مسیر برای اجرای سرور تازه باز است؟
#>
function Clear-NextDevLock {
    <#
      ⚠️ تشخیص از روی پروسه‌ها انجام می‌شود، نه فایل .next\dev\lock.

         تلاش اول این بود که PID را از خود فایل قفل بخوانیم. کار
         نکرد: سرور Next آن فایل را با دسترسی *انحصاری* باز نگه
         می‌دارد و هیچ پروسه‌ی دیگری — حتی فقط برای خواندن و حتی با
         FileShare.ReadWrite — نمی‌تواند بازش کند. نتیجه‌ی آن نسخه
         این بود که خطا در catch بلعیده می‌شد و تابع طوری رفتار
         می‌کرد که انگار قفلی وجود ندارد؛ یعنی همان باگی که قرار
         بود رفع کند.

         راه درستی که کار می‌کند: پیدا کردن پروسه‌های node که خط
         فرمانشان هم به پوشه‌ی فرانت‌اند ما اشاره دارد و هم next
         را اجرا می‌کند. مسیر، مالکیت را قطعی می‌کند — سرور dev
         پروژه‌ی دیگری هرگز این شرط را برآورده نمی‌کند.
    #>
    $running = @(
        Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
            Where-Object {
                $_.CommandLine -and
                $_.CommandLine -like "*$WebPath*" -and
                $_.CommandLine -like '*next*'
            }
    )

    $lockFile = Join-Path $WebPath '.next\dev\lock'

    if ($running.Count -eq 0) {
        <#
          قفلِ بی‌صاحب: پروسه مرده ولی فایل مانده. پس از بسته شدن
          ناگهانی ترمینال پیش می‌آید و بدون پاک کردنش، اجرای بعدی
          هم رد می‌شود. حالا که پروسه‌ای زنده نیست، فایل آزاد است و
          حذفش موفق می‌شود.
        #>
        if (Test-Path -LiteralPath $lockFile) {
            Write-Info 'قفل بازمانده‌ی سرور توسعه پاک شد'
            Remove-Item -LiteralPath $lockFile -Force -ErrorAction SilentlyContinue
        }
        return $true
    }

    Write-Warn "سرور توسعه‌ی دیگری روی همین پوشه باز است ($($running.Count) پروسه) — بسته می‌شود."

    foreach ($proc in $running) {
        try {
            Stop-Process -Id ([int]$proc.ProcessId) -Force -ErrorAction Stop
        } catch {
            # ممکن است با بسته شدن والدش از قبل مرده باشد — نتیجه پایین سنجیده می‌شود
            Write-Info "بستن شناسه $($proc.ProcessId): $($_.Exception.Message)"
        }
    }

    # صبر تا همه واقعاً بمیرند و ویندوز قفل فایل را رها کند
    for ($i = 0; $i -lt 24; $i++) {
        Start-Sleep -Milliseconds 250

        $stillAlive = @(
            $running | Where-Object { Get-Process -Id ([int]$_.ProcessId) -ErrorAction SilentlyContinue }
        )
        if ($stillAlive.Count -eq 0) {
            Remove-Item -LiteralPath $lockFile -Force -ErrorAction SilentlyContinue
            Write-Ok 'سرور توسعه‌ی قبلی بسته شد'
            return $true
        }
    }

    Write-Err 'سرور توسعه‌ی قبلی بسته نشد.'
    Write-Host '     راه‌حل: آن پنجره را ببندید و دوباره اجرا کنید.' -ForegroundColor Yellow
    return $false
}

<#
.SYNOPSIS
    یک کلید را در فایل env می‌نویسد یا اگر مقدارش فرق دارد اصلاح می‌کند.
.DESCRIPTION
    ⚠️ باگی که این تابع رفع می‌کند — «تصویرها ۴۰۴ می‌دهند و فرانت به
       بک وصل نمی‌شود، ولی هر دو سرور بالا هستند»:

       اسکریپت فایل‌های .env را فقط *وقتی وجود ندارند* می‌ساخت. اگر
       کسی یک بار پروژه را با پورت دیگری اجرا کرده بود (یا فایل را
       از .env.example کپی کرده بود که پورت قدیمی دارد)، آن مقدارها
       تا ابد می‌ماندند. نتیجه: run.bat سرویس‌ها را روی ۸۱۰۰ و ۳۱۰۰
       بالا می‌آورد، اما فرانت‌اند به ۸۰۰۱ درخواست می‌زد و آدرس
       تصویرها هم به ۸۰۰۱ اشاره می‌کرد.

       بدترین بخشش این بود که روی سیستمی که سرور قدیمی هنوز باز
       بود، همه‌چیز *کار می‌کرد* — و فقط روی ماشین تازه می‌شکست.

    فقط کلیدهای وابسته به پورت اصلاح می‌شوند؛ بقیه‌ی فایل — از جمله
    APP_KEY و رازها — دست‌نخورده می‌ماند.
.PARAMETER Path
    مسیر فایل env
.PARAMETER Key
    نام کلید
.PARAMETER Value
    مقدار درست
.OUTPUTS
    [bool] آیا فایل تغییر کرد؟
#>
function Set-EnvValue {
    param(
        [string]$Path,
        [string]$Key,
        [string]$Value
    )

    if (-not (Test-Path -LiteralPath $Path)) { return $false }

    $lines = @(Get-Content -LiteralPath $Path -Encoding utf8)
    $desired = "$Key=$Value"
    $found = $false
    $changed = $false

    for ($i = 0; $i -lt $lines.Count; $i++) {
        # فقط خط تعریف کلید، نه کامنتی که اتفاقاً نام کلید در آن آمده
        if ($lines[$i] -match "^\s*$([regex]::Escape($Key))\s*=") {
            $found = $true
            if ($lines[$i].Trim() -ne $desired) {
                $lines[$i] = $desired
                $changed = $true
            }
            break
        }
    }

    if (-not $found) {
        $lines += $desired
        $changed = $true
    }

    if ($changed) {
        Set-Content -LiteralPath $Path -Value $lines -Encoding utf8
    }

    return $changed
}

<#
.SYNOPSIS
    منتظر می‌ماند تا یک آدرس HTTP پاسخ دهد.
.PARAMETER Url
    آدرسی که باید بررسی شود
.PARAMETER TimeoutSeconds
    حداکثر زمان انتظار
#>
function Wait-ForHttp {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 60
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) { return $true }
        } catch {
            # هنوز بالا نیامده — کمی صبر می‌کنیم و دوباره تلاش
        }
        Start-Sleep -Milliseconds 800
    }

    return $false
}

# ===========================================================================
#  حالت توقف: سرویس‌های در حال اجرا را می‌بندد
# ===========================================================================

if ($Stop) {
    Write-Banner
    Write-Step 'توقف سرویس‌ها'

    # اگر حتی یکی از سرویس‌ها بسته نشد، کد خروج باید موفقیت را گزارش نکند
    $stopFailed = $false

    foreach ($item in @(
        @{ Port = $ApiPort; Name = 'بک‌اند لاراول' },
        @{ Port = $WebPort; Name = 'فرانت‌اند Next.js' }
    )) {
        if (-not (Test-PortInUse -Port $item.Port)) {
            Write-Info "$($item.Name): در حال اجرا نبود"
            continue
        }

        <#
          از همان Clear-Port استفاده می‌شود که مرحله‌ی بررسی پورت هم
          به کار می‌برد.

          ⚠️ نسخه‌ی قبلی اینجا فقط Stop-Process روی پروسه‌ی شنونده
             می‌زد و «متوقف شد» می‌گفت — بدون آنکه بررسی کند واقعاً
             متوقف شده. چون `artisan serve` یک ناظر است که سرور را
             دوباره بالا می‌آورد، پیام موفقیت می‌آمد ولی پورت هنوز
             اشغال بود. حالا هر دو مسیر یک منطق دارند: کل درخت بسته
             می‌شود و نتیجه با بررسی خودِ پورت تأیید می‌شود.

          AutoConfirm همیشه true است: کاربری که -Stop زده، نیت خود را
          صریح اعلام کرده و پرسیدن دوباره فقط مزاحمت است.
        #>
        if (-not (Clear-Port -Port $item.Port -Label $item.Name -AutoConfirm $true)) {
            $stopFailed = $true
        }
    }

    Write-Host ""
    if ($stopFailed) { exit 3 }
    exit 0
}

# ===========================================================================
#  گام ۱ — بررسی ابزارهای موردنیاز
# ===========================================================================

Write-Banner
Write-Step 'بررسی ابزارهای موردنیاز'

$problems = @()

# --- PHP ---
if (Test-Path -LiteralPath $Php) {
    $phpVersion = (& $Php -r "echo PHP_VERSION;" 2>$null)
    Write-Ok "PHP $phpVersion (نسخه پرتابل داخل پروژه)"
} else {
    # شاید PHP روی سیستم نصب باشد و در PATH قرار داشته باشد
    $systemPhp = Get-Command php -ErrorAction SilentlyContinue
    if ($systemPhp) {
        $Php = $systemPhp.Source
        Write-Ok "PHP از مسیر سیستم: $Php"
    } else {
        $problems += @{
            Name = 'PHP'
            Message = "یافت نشد. انتظار می‌رفت اینجا باشد: $Php"
            Fix = 'نسخه پرتابل را از github.com/shivammathur/php-builder-windows دانلود و در tools\php اکسترکت کنید.'
        }
    }
}

# --- اکستنشن‌های ضروری PHP ---
if (Test-Path -LiteralPath $Php) {
    $required = @('pdo_sqlite', 'sqlite3', 'mbstring', 'openssl', 'fileinfo', 'curl')
    $loaded = @(& $Php -m 2>$null)
    $missing = $required | Where-Object { $_ -notin $loaded }

    if ($missing.Count -gt 0) {
        $problems += @{
            Name = 'اکستنشن‌های PHP'
            Message = "این اکستنشن‌ها فعال نیستند: $($missing -join ', ')"
            Fix = 'در فایل tools\php\php.ini علامت ; را از ابتدای خط extension=<name> بردارید.'
        }
    } else {
        Write-Ok "اکستنشن‌های PHP کامل است ($($required.Count) مورد)"
    }
}

# --- Composer ---
if (Test-Path -LiteralPath $Composer) {
    Write-Ok 'Composer (composer.phar داخل tools)'
} else {
    $systemComposer = Get-Command composer -ErrorAction SilentlyContinue
    if ($systemComposer) {
        Write-Ok "Composer از مسیر سیستم"
    } else {
        $problems += @{
            Name = 'Composer'
            Message = "یافت نشد. انتظار می‌رفت اینجا باشد: $Composer"
            Fix = 'دانلود کنید: https://getcomposer.org/composer-stable.phar و در پوشه tools بگذارید.'
        }
    }
}

# --- Node.js ---
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
    $nodeVersion = (& node -v)
    $majorVersion = [int]($nodeVersion -replace '^v(\d+).*', '$1')

    if ($majorVersion -lt 20) {
        $problems += @{
            Name = 'نسخه Node.js'
            Message = "نسخه فعلی $nodeVersion است، اما Next.js 16 حداقل به نسخه ۲۰ نیاز دارد."
            Fix = 'از nodejs.org نسخه LTS را نصب کنید.'
        }
    } else {
        Write-Ok "Node.js $nodeVersion"
    }
} else {
    $problems += @{
        Name = 'Node.js'
        Message = 'نصب نیست یا در PATH قرار ندارد.'
        Fix = 'از nodejs.org نسخه LTS (۲۰ یا بالاتر) را نصب کنید.'
    }
}

# --- pnpm ---
$pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
if ($pnpm) {
    Write-Ok "pnpm $(& pnpm -v)"
} else {
    Write-Warn 'pnpm نصب نیست — تلاش برای نصب خودکار...'
    try {
        & npm install -g pnpm --silent 2>&1 | Out-Null
        $pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
        if ($pnpm) {
            Write-Ok "pnpm نصب شد ($(& pnpm -v))"
        } else {
            throw 'نصب انجام شد اما دستور در دسترس نیست'
        }
    } catch {
        $problems += @{
            Name = 'pnpm'
            Message = 'نصب خودکار ناموفق بود.'
            Fix = 'دستی اجرا کنید: npm install -g pnpm'
        }
    }
}

# --- فضای دیسک ---
$freeMb = (Get-PSDrive C).Free -shr 20
if ($freeMb -lt 1500) {
    $problems += @{
        Name = 'فضای دیسک'
        Message = "فقط $freeMb مگابایت آزاد است."
        Fix = 'حداقل ۱۵۰۰ مگابایت لازم است. کش‌های npm و مرورگر را پاک کنید.'
    }
} else {
    Write-Ok "فضای دیسک: $freeMb مگابایت آزاد"
}

# --- گزارش مشکلات و توقف ---
if ($problems.Count -gt 0) {
    Write-Host ""
    Write-Host "  ══════════ پیش‌نیازهای برطرف‌نشده ══════════" -ForegroundColor Red

    foreach ($problem in $problems) {
        Write-Host ""
        Write-Err "$($problem.Name): $($problem.Message)"
        Write-Host "     راه‌حل: $($problem.Fix)" -ForegroundColor Yellow
    }

    Write-Host ""
    exit 1
}

# ===========================================================================
#  گام ۲ — آماده‌سازی بک‌اند
# ===========================================================================

Write-Step 'آماده‌سازی بک‌اند (لاراول)'

if (-not (Test-Path -LiteralPath $ApiPath)) {
    Write-Err "پوشه بک‌اند یافت نشد: $ApiPath"
    exit 2
}

Push-Location $ApiPath
try {
    $env:COMPOSER_HOME = Join-Path $ToolsPath '.composer'

    # --- وابستگی‌های Composer ---
    if (-not (Test-Path -LiteralPath 'vendor\autoload.php')) {
        Write-Warn 'پوشه vendor موجود نیست — در حال نصب وابستگی‌ها (چند دقیقه طول می‌کشد)...'
        & $Php $Composer install --no-interaction --no-progress --prefer-dist
        if ($LASTEXITCODE -ne 0) { throw 'نصب وابستگی‌های Composer ناموفق بود' }
        Write-Ok 'وابستگی‌های Composer نصب شد'
    } else {
        Write-Ok 'وابستگی‌های Composer موجود است'
    }

    # --- فایل .env ---
    if (-not (Test-Path -LiteralPath '.env')) {
        Write-Warn 'فایل .env موجود نیست — ساخته می‌شود'
        Copy-Item '.env.example' '.env'
        & $Php artisan key:generate --force | Out-Null
        Write-Ok 'فایل .env و کلید برنامه ساخته شد'
    } else {
        Write-Ok 'فایل .env موجود است'
    }

    <#
      همگام‌سازی کلیدهای وابسته به پورت — چه فایل تازه ساخته شده
      باشد چه از قبل بوده.

      APP_URL آدرس تصویرها را می‌سازد و FRONTEND_URL مقصد باطل کردن
      کش است. اگر با پورت واقعی سرویس نخوانند، تصویرها ۴۰۴ می‌دهند و
      تغییرات پنل هرگز در سایت دیده نمی‌شوند — بدون هیچ پیام خطایی.
    #>
    $envChanged = $false
    $envChanged = (Set-EnvValue '.env' 'APP_URL' "http://127.0.0.1:$ApiPort") -or $envChanged
    $envChanged = (Set-EnvValue '.env' 'FRONTEND_URL' "http://127.0.0.1:$WebPort") -or $envChanged

    if ($envChanged) {
        Write-Warn "آدرس‌های .env با پورت‌های جاری همگام شد ($ApiPort / $WebPort)"
        # کش پیکربندی لاراول باید پاک شود وگرنه مقدار قدیمی می‌ماند
        & $Php artisan config:clear 2>&1 | Out-Null
    }

    # --- دیتابیس SQLite ---
    $dbFile = Join-Path $ApiPath 'database\database.sqlite'

    if ($Fresh) {
        Write-Warn 'حالت Fresh — دیتابیس از صفر بازسازی می‌شود'
        if (-not (Test-Path -LiteralPath $dbFile)) { New-Item -ItemType File -Path $dbFile | Out-Null }
        & $Php artisan migrate:fresh --seed --force
        if ($LASTEXITCODE -ne 0) { throw 'بازسازی دیتابیس ناموفق بود' }
        Write-Ok 'دیتابیس بازسازی و داده نمونه ریخته شد'
    }
    elseif (-not (Test-Path -LiteralPath $dbFile)) {
        Write-Warn 'دیتابیس موجود نیست — ساخته می‌شود'
        New-Item -ItemType File -Path $dbFile | Out-Null
        & $Php artisan migrate --seed --force
        if ($LASTEXITCODE -ne 0) { throw 'ساخت دیتابیس ناموفق بود' }
        Write-Ok 'دیتابیس ساخته و داده نمونه ریخته شد'
    }
    else {
        # دیتابیس هست، اما شاید مایگریشن جدیدی اجرا نشده باشد
        $pending = & $Php artisan migrate:status 2>&1 | Select-String -Pattern 'Pending' -Quiet
        if ($pending) {
            Write-Warn 'مایگریشن اجرانشده وجود دارد — اجرا می‌شود'
            & $Php artisan migrate --force | Out-Null
            Write-Ok 'مایگریشن‌های جدید اجرا شد'
        } else {
            Write-Ok 'دیتابیس به‌روز است'
        }
    }
}
finally {
    Pop-Location
}

# ===========================================================================
#  گام ۳ — آماده‌سازی فرانت‌اند
# ===========================================================================

Write-Step 'آماده‌سازی فرانت‌اند (Next.js)'

if (-not (Test-Path -LiteralPath $WebPath)) {
    Write-Err "پوشه فرانت‌اند یافت نشد: $WebPath"
    exit 2
}

Push-Location $WebPath
try {
    # --- وابستگی‌های npm ---
    if (-not (Test-Path -LiteralPath 'node_modules\next')) {
        Write-Warn 'پوشه node_modules موجود نیست — در حال نصب (چند دقیقه طول می‌کشد)...'
        & pnpm install
        if ($LASTEXITCODE -ne 0) { throw 'نصب وابستگی‌های pnpm ناموفق بود' }
        Write-Ok 'وابستگی‌های فرانت‌اند نصب شد'
    } else {
        Write-Ok 'وابستگی‌های فرانت‌اند موجود است'
    }

    # --- فایل .env.local ---
    if (-not (Test-Path -LiteralPath '.env.local')) {
        Write-Warn 'فایل .env.local موجود نیست — ساخته می‌شود'
        @"
# آدرس API بک‌اند لاراول
NEXT_PUBLIC_API_URL=http://127.0.0.1:$ApiPort/api/v1

# آدرس عمومی سایت — برای canonical و hreflang
NEXT_PUBLIC_SITE_URL=http://localhost:$WebPort
"@ | Set-Content '.env.local' -Encoding utf8
        Write-Ok 'فایل .env.local ساخته شد'
    } else {
        Write-Ok 'فایل .env.local موجود است'
    }

    <#
      همگام‌سازی آدرس API — همان دلیل سمت بک‌اند.

      اگر NEXT_PUBLIC_API_URL به پورتی اشاره کند که سرویسی رویش نیست،
      کل فروشگاه خالی بالا می‌آید بدون آنکه معلوم باشد چرا: صفحه
      رندر می‌شود، خطای قرمزی نیست، فقط هیچ داده‌ای نمی‌آید.
    #>
    $webEnvChanged = $false
    $webEnvChanged = (Set-EnvValue '.env.local' 'NEXT_PUBLIC_API_URL' "http://127.0.0.1:$ApiPort/api/v1") -or $webEnvChanged
    $webEnvChanged = (Set-EnvValue '.env.local' 'NEXT_PUBLIC_SITE_URL' "http://localhost:$WebPort") -or $webEnvChanged

    if ($webEnvChanged) {
        Write-Warn "آدرس‌های .env.local با پورت‌های جاری همگام شد ($ApiPort / $WebPort)"
    }

    # --- بیلد تولید (فقط با پارامتر -Prod) ---
    if ($Prod) {
        Write-Warn 'حالت تولید — در حال بیلد گرفتن...'
        & pnpm build
        if ($LASTEXITCODE -ne 0) { throw 'بیلد فرانت‌اند ناموفق بود' }
        Write-Ok 'بیلد تولید آماده شد'
    }
}
finally {
    Pop-Location
}

# ===========================================================================
#  گام ۴ — بررسی پورت‌ها
# ===========================================================================

Write-Step 'بررسی پورت‌ها'

foreach ($item in @(
    @{ Port = $ApiPort; Name = 'بک‌اند' },
    @{ Port = $WebPort; Name = 'فرانت‌اند' }
)) {
    if (-not (Test-PortInUse -Port $item.Port)) {
        Write-Ok "پورت $($item.Port) آزاد است ($($item.Name))"
        continue
    }

    <#
      پورت اشغال است — به‌جای شکست دادن اجرا، تلاش می‌کنیم آزادش کنیم.

      نسخه‌ی قبلی همین‌جا exit 1 می‌زد و کاربر را با یک پیام تنها
      می‌گذاشت. در عمل، اشغال بودن پورت تقریباً همیشه بازمانده‌ی
      اجرای قبلیِ خودِ همین اسکریپت است — چیزی که خودمان ساخته‌ایم و
      می‌توانیم بی‌خطر ببندیم.
    #>
    if (-not (Clear-Port -Port $item.Port -Label $item.Name -AutoConfirm:$Force.IsPresent)) {
        Write-Host ""
        exit 3
    }
}

<#
  قفل سرور توسعه‌ی Next.

  فقط در حالت توسعه معنا دارد؛ `next start` (حالت -Prod) این قفل را
  نمی‌سازد و نمی‌خواند.

  ⚠️ این بررسی مستقل از پورت است و باید جدا انجام شود — بخش بالا
     فقط می‌داند پورت ۳۱۰۰ آزاد است، در حالی که سرور مزاحم ممکن
     است روی پورت دیگری باز باشد و باز هم مانع اجرا شود.
#>
if (-not $Prod) {
    if (-not (Clear-NextDevLock)) {
        Write-Host ""
        exit 3
    }
}

# ===========================================================================
#  گام ۵ — اجرای سرویس‌ها
# ===========================================================================

Write-Step 'اجرای سرویس‌ها'

if (-not (Test-Path -LiteralPath $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

# --- بک‌اند لاراول ---
Start-Process -FilePath $Php `
    -ArgumentList 'artisan', 'serve', '--host=127.0.0.1', "--port=$ApiPort" `
    -WorkingDirectory $ApiPath `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $LogDir 'api.log') `
    -RedirectStandardError  (Join-Path $LogDir 'api.error.log')

Write-Info 'بک‌اند در حال بالا آمدن...'

# --- فرانت‌اند Next.js ---
$nextBin = Join-Path $WebPath 'node_modules\next\dist\bin\next'
$nextArgs = if ($Prod) { @($nextBin, 'start', '-p', "$WebPort") } else { @($nextBin, 'dev', '-p', "$WebPort") }

Start-Process -FilePath 'node' `
    -ArgumentList $nextArgs `
    -WorkingDirectory $WebPath `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $LogDir 'web.log') `
    -RedirectStandardError  (Join-Path $LogDir 'web.error.log')

Write-Info 'فرانت‌اند در حال بالا آمدن...'

# ===========================================================================
#  گام ۶ — بررسی سلامت سرویس‌ها
# ===========================================================================

Write-Step 'بررسی سلامت سرویس‌ها'

$apiHealthy = Wait-ForHttp -Url "http://127.0.0.1:$ApiPort/api/v1/health" -TimeoutSeconds 45
if ($apiHealthy) {
    Write-Ok "بک‌اند پاسخ می‌دهد → http://127.0.0.1:$ApiPort/api/v1"
} else {
    Write-Err 'بک‌اند بالا نیامد.'
    Write-Host "     لاگ خطا: $(Join-Path $LogDir 'api.error.log')" -ForegroundColor Yellow
    $errLog = Join-Path $LogDir 'api.error.log'
    if (Test-Path -LiteralPath $errLog) { Get-Content $errLog -Tail 15 -Encoding UTF8 | ForEach-Object { Write-Info $_ } }
    exit 4
}

$webHealthy = Wait-ForHttp -Url "http://localhost:$WebPort/fa" -TimeoutSeconds 90
if ($webHealthy) {
    Write-Ok "فرانت‌اند پاسخ می‌دهد → http://localhost:$WebPort"
} else {
    Write-Err 'فرانت‌اند بالا نیامد.'
    Write-Host "     لاگ خطا: $(Join-Path $LogDir 'web.error.log')" -ForegroundColor Yellow
    $errLog = Join-Path $LogDir 'web.error.log'
    if (Test-Path -LiteralPath $errLog) { Get-Content $errLog -Tail 15 -Encoding UTF8 | ForEach-Object { Write-Info $_ } }
    exit 4
}

# ===========================================================================
#  پایان — نمایش خلاصه
# ===========================================================================

Write-Host ""
Write-Host "  ╔════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║            همه چیز آماده است                   ║" -ForegroundColor Green
Write-Host "  ╚════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "   فروشگاه (فارسی)  " -NoNewline; Write-Host "http://localhost:$WebPort/fa" -ForegroundColor Cyan
Write-Host "   فروشگاه (English) " -NoNewline; Write-Host "http://localhost:$WebPort/en" -ForegroundColor Cyan
Write-Host "   API               " -NoNewline; Write-Host "http://127.0.0.1:$ApiPort/api/v1" -ForegroundColor Cyan
Write-Host ""
Write-Host "   حساب‌های نمایشی:" -ForegroundColor DarkGray
Write-Host "     مدیر    admin@demo.dev / password" -ForegroundColor DarkGray
Write-Host "     مشتری   user@demo.dev  / password" -ForegroundColor DarkGray
Write-Host ""
Write-Host "   توقف سرویس‌ها:  " -NoNewline -ForegroundColor DarkGray
Write-Host "run.bat -Stop" -ForegroundColor Yellow
Write-Host "   لاگ‌ها:          " -NoNewline -ForegroundColor DarkGray
Write-Host ".logs\" -ForegroundColor Yellow
Write-Host ""

# باز کردن مرورگر روی صفحه اصلی
Start-Process "http://localhost:$WebPort/fa"
