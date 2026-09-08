<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Enums\TicketDepartment;
use App\Enums\TicketPriority;
use App\Http\Controllers\Controller;
use App\Http\Requests\Support\ReplyTicketRequest;
use App\Http\Requests\Support\StoreTicketRequest;
use App\Http\Resources\TicketDetailResource;
use App\Http\Resources\TicketResource;
use App\Models\Ticket;
use App\Services\Support\TicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * کنترلر تیکت‌های پشتیبانی — سمت مشتری.
 * ---------------------------------------------------------------------------
 * ⚠️ اصل امنیتی محوری: هر کوئری از `$request->user()->tickets()` شروع
 *    می‌شود، نه از مدل Ticket.
 *
 *    بدون آن، کاربر می‌توانست با تغییر شماره در آدرس درخواست
 *    (TK-000123 به TK-000124) گفتگوی خصوصی دیگران را بخواند — یک
 *    آسیب‌پذیری IDOR کلاسیک که در تیکت پشتیبانی می‌تواند اطلاعات
 *    سفارش، آدرس و شماره تماس دیگران را لو بدهد.
 */
class TicketController extends Controller
{
    public function __construct(
        private readonly TicketService $tickets,
    ) {}

    /**
     * GET /api/v1/tickets/meta
     * دپارتمان‌ها و اولویت‌های قابل انتخاب — برای پرکردن فرم تیکت تازه.
     *
     * ⚠️ چرا اندپوینت و نه فهرست ثابت در فرانت؟
     *    برچسب‌ها همین حالا در enum های PHP هستند و ReviewResource و
     *    TicketResource هم از همان‌ها می‌خوانند. اگر فرم، فهرست خودش
     *    را داشته باشد، دو نسخه از یک قاعده به وجود می‌آید: افزودن
     *    دپارتمان تازه در بک‌اند، فرم را بی‌صدا ناقص می‌گذارد و
     *    اعتبارسنجی مقداری را رد می‌کند که کاربر اصلاً نمی‌توانست
     *    انتخاب کند.
     *
     *    همان الگوی AdminOrderController::statuses.
     */
    public function meta(): JsonResponse
    {
        $locale = app()->getLocale();

        return response()->json([
            'data' => [
                'departments' => collect(TicketDepartment::cases())
                    ->map(fn (TicketDepartment $d) => [
                        'value' => $d->value,
                        'label' => $d->label($locale),
                    ])->all(),

                'priorities' => collect(TicketPriority::cases())
                    ->map(fn (TicketPriority $p) => [
                        'value' => $p->value,
                        'label' => $p->label($locale),
                        'color' => $p->color(),
                    ])->all(),
            ],
        ]);
    }

    /**
     * GET /api/v1/tickets
     * فهرست تیکت‌های کاربر.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $request->user()->tickets()
            ->withCount('messages')
            ->with('order');

        /* --- فیلتر وضعیت --- */
        match ($request->query('status')) {
            'open' => $query->open(),
            'closed' => $query->where('status', 'closed'),
            default => null,
        };

        $tickets = $query
            /*
             * ترتیب بر اساس آخرین پاسخ، نه تاریخ ساخت.
             * گفتگویی که همین الان جواب گرفته باید بالای فهرست
             * باشد، حتی اگر ماه‌ها پیش باز شده.
             */
            ->orderByDesc('last_reply_at')
            ->paginate(min((int) $request->query('per_page', 10), 50));

        return TicketResource::collection($tickets);
    }

    /**
     * GET /api/v1/tickets/{ticket}
     * گفتگوی کامل یک تیکت.
     */
    public function show(Request $request, string $ticket): TicketDetailResource
    {
        $model = $this->findOwned($request, $ticket);

        return new TicketDetailResource(
            $model->load(['messages.user', 'order'])->loadCount('messages'),
        );
    }

    /**
     * POST /api/v1/tickets
     * ثبت تیکت تازه.
     */
    public function store(StoreTicketRequest $request): JsonResponse
    {
        $ticket = $this->tickets->create($request->user(), $request->validated());

        return (new TicketDetailResource($ticket->load(['messages.user', 'order'])->loadCount('messages')))
            ->additional(['message' => __('shop.ticket_created', ['number' => $ticket->ticket_number])])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * POST /api/v1/tickets/{ticket}/reply
     * پاسخ کاربر به گفتگو.
     */
    public function reply(ReplyTicketRequest $request, string $ticket): JsonResponse
    {
        $model = $this->findOwned($request, $ticket);

        /*
         * تیکت بسته پاسخ نمی‌پذیرد.
         *
         * ۴۰۹ و نه ۴۲۲: داده‌ی ارسالی مشکلی ندارد، وضعیت فعلی گفتگو
         * است که با این درخواست تعارض دارد. فرانت‌اند می‌تواند این
         * را از خطای اعتبارسنجی تفکیک کند و به‌جای هایلایت فیلد،
         * دکمه‌ی «بازگشایی» نشان دهد.
         */
        if (! $model->acceptsReply()) {
            return response()->json([
                'message' => __('shop.ticket_closed'),
                'error' => ['code' => 'TICKET_CLOSED'],
            ], 409);
        }

        $this->tickets->reply(
            $model,
            $request->user(),
            $request->validated()['body'],
            isStaff: false,
        );

        return (new TicketDetailResource($model->fresh()->load(['messages.user', 'order'])->loadCount('messages')))
            ->additional(['message' => __('shop.ticket_replied')])
            ->response();
    }

    /**
     * PATCH /api/v1/tickets/{ticket}/close
     * بستن گفتگو توسط کاربر.
     */
    public function close(Request $request, string $ticket): JsonResponse
    {
        $model = $this->findOwned($request, $ticket);
        $updated = $this->tickets->close($model);

        return (new TicketDetailResource($updated->load(['messages.user', 'order'])->loadCount('messages')))
            ->additional(['message' => __('shop.ticket_closed_ok')])
            ->response();
    }

    /**
     * PATCH /api/v1/tickets/{ticket}/reopen
     * بازگشایی گفتگو.
     */
    public function reopen(Request $request, string $ticket): JsonResponse
    {
        $model = $this->findOwned($request, $ticket);
        $updated = $this->tickets->reopen($model);

        return (new TicketDetailResource($updated->load(['messages.user', 'order'])->loadCount('messages')))
            ->additional(['message' => __('shop.ticket_reopened')])
            ->response();
    }

    /**
     * یافتن تیکتی که *متعلق به کاربر جاری* باشد.
     *
     * اگر تیکت وجود نداشته باشد یا مال کاربر دیگری باشد، ۴۰۴
     * برمی‌گردد — نه ۴۰۳. دلیل: ۴۰۳ تأیید می‌کند که آن شماره وجود
     * دارد و همین یک بیت اطلاعات، شمارش تیکت‌ها را ممکن می‌کند.
     */
    private function findOwned(Request $request, string $ticketNumber): Ticket
    {
        return $request->user()->tickets()
            ->where('ticket_number', $ticketNumber)
            ->firstOrFail();
    }
}
