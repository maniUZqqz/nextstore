<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\TicketStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Support\ReplyTicketRequest;
use App\Http\Resources\TicketDetailResource;
use App\Http\Resources\TicketResource;
use App\Models\Ticket;
use App\Services\Support\TicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * کنترلر صف پشتیبانی — پنل مدیریت.
 * ---------------------------------------------------------------------------
 * قرینه‌ی Customer\TicketController، با دو تفاوت بنیادی:
 *
 *   ۱. کوئری از خودِ مدل Ticket شروع می‌شود، نه از `$user->tickets()`.
 *      پشتیبان باید همه‌ی گفتگوها را ببیند؛ همان کدی که در سمت
 *      مشتری IDOR بود، اینجا لازمه‌ی کار است. محافظت به میدل‌ور
 *      `admin` روی گروه مسیرها سپرده شده.
 *
 *   ۲. پاسخ با `isStaff: true` ثبت می‌شود، پس وضعیت تیکت به
 *      «پاسخ داده شده» می‌رود و از صف کاری بیرون می‌آید.
 *
 * ⚠️ بررسی نقش مدیر اینجا انجام *نمی‌شود* — روی گروه مسیرها است تا
 *    اکشن جدیدی که فردا اضافه شود خودکار محافظت‌شده باشد.
 */
class AdminTicketController extends Controller
{
    public function __construct(
        private readonly TicketService $tickets,
    ) {}

    /**
     * GET /api/v1/admin/tickets?status=needs_attention&q=…
     * صف پشتیبانی با فیلتر وضعیت و جستجو.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Ticket::query()->with(['user', 'order'])->withCount('messages');

        /*
         * پیش‌فرض «نیازمند رسیدگی» است، نه «همه».
         *
         * کاری که پشتیبان روزانه انجام می‌دهد رسیدگی به صف است؛ باز
         * کردن صفحه روی فهرست کامل یعنی هر بار یک کلیک فیلتر اضافه.
         */
        match ($request->query('status', 'needs_attention')) {
            'all' => null,
            'open' => $query->open(),
            'closed' => $query->where('status', TicketStatus::Closed),
            'answered' => $query->where('status', TicketStatus::Answered),
            default => $query->needsAttention(),
        };

        /* جستجو روی شماره، موضوع و نام مشتری */
        if ($term = trim((string) $request->query('q'))) {
            $query->where(function ($q) use ($term) {
                $q->where('ticket_number', 'like', "%{$term}%")
                    ->orWhere('subject', 'like', "%{$term}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$term}%"));
            });
        }

        /*
         * قدیمی‌ترین پاسخ اول.
         *
         * ⚠️ برخلاف «تیکت‌های من» که تازه‌ترین را بالا می‌آورد.
         *    برای مشتری تازه‌ترین گفتگو مهم‌ترین است؛ برای پشتیبان
         *    آن که بیشتر منتظر مانده. مرتب‌سازی نزولی اینجا یعنی
         *    تیکت‌های ته صف هرگز دیده نمی‌شوند.
         */
        $tickets = $query
            ->orderByRaw('last_reply_at IS NULL, last_reply_at ASC')
            ->paginate(min((int) $request->query('per_page', 20), 100));

        /*
         * ⚠️ شمارش‌ها زیر کلید مستقل «counts» می‌رود، نه داخل «meta».
         *    لاراول خودش meta را با اطلاعات صفحه‌بندی پر می‌کند و
         *    additional(['meta' => …]) آن را کامل بازنویسی می‌کرد.
         */
        return TicketResource::collection($tickets)
            ->additional(['counts' => $this->tickets->statusCounts()]);
    }

    /**
     * GET /api/v1/admin/tickets/{ticket}
     * گفتگوی کامل یک تیکت.
     */
    public function show(Ticket $ticket): TicketDetailResource
    {
        return new TicketDetailResource(
            $ticket->load(['messages.user', 'user', 'order'])->loadCount('messages'),
        );
    }

    /**
     * POST /api/v1/admin/tickets/{ticket}/reply
     * پاسخ پشتیبانی.
     */
    public function reply(ReplyTicketRequest $request, Ticket $ticket): JsonResponse
    {
        /*
         * تیکت بسته پاسخ نمی‌پذیرد — همان قاعده‌ی سمت مشتری.
         *
         * ۴۰۹ و نه ۴۲۲: داده‌ی ارسالی مشکلی ندارد، وضعیت گفتگو با
         * درخواست تعارض دارد. پنل می‌تواند به‌جای هایلایت فیلد،
         * دکمه‌ی «بازگشایی» نشان دهد.
         */
        if (! $ticket->acceptsReply()) {
            return response()->json([
                'message' => __('shop.ticket_closed'),
                'error' => ['code' => 'TICKET_CLOSED'],
            ], 409);
        }

        $this->tickets->reply(
            $ticket,
            $request->user(),
            $request->validated()['body'],
            isStaff: true,
        );

        return $this->respond($ticket->fresh(), __('shop.ticket_replied'));
    }

    /**
     * PATCH /api/v1/admin/tickets/{ticket}/close
     * بستن گفتگو توسط پشتیبانی.
     */
    public function close(Ticket $ticket): JsonResponse
    {
        return $this->respond($this->tickets->close($ticket), __('shop.ticket_closed_ok'));
    }

    /**
     * PATCH /api/v1/admin/tickets/{ticket}/reopen
     * بازگشایی گفتگو.
     */
    public function reopen(Ticket $ticket): JsonResponse
    {
        return $this->respond($this->tickets->reopen($ticket), __('shop.ticket_reopened'));
    }

    /**
     * ساخت پاسخ استاندارد پس از یک کنش.
     *
     * هر سه اکشن نوشتنی همان گفتگوی کامل را برمی‌گردانند تا پنل
     * نیازی به درخواست دوم نداشته باشد و وضعیت روی صفحه بلافاصله
     * درست شود.
     */
    private function respond(Ticket $ticket, string $message): JsonResponse
    {
        return (new TicketDetailResource(
            $ticket->load(['messages.user', 'user', 'order'])->loadCount('messages'),
        ))
            ->additional(['message' => $message])
            ->response();
    }
}
