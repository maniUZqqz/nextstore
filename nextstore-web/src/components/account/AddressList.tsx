'use client'

/**
 * مدیریت آدرس‌های کاربر — پنل کاربری
 * ---------------------------------------------------------------------------
 * فهرست کارتی · افزودن · ویرایش · حذف · تعیین پیش‌فرض
 *
 * پوشش حالت‌ها: loading · error · empty · success
 *
 * ⚠️ فرم از components/address/AddressForm می‌آید — همان فرمی که
 *    مرحله‌ی تسویه استفاده می‌کند. دو نسخه‌ی جدا یعنی دو مجموعه قاعده‌ی
 *    اعتبارسنجی که دیر یا زود واگرا می‌شوند و کاربر در یک صفحه
 *    آدرسی می‌سازد که صفحه‌ی دیگر ردش می‌کند.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { MapPin, Plus, Pencil, Trash2, Star, AlertCircle, Loader2 } from 'lucide-react'
import * as ordersApi from '@/lib/api/orders'
import { AddressForm } from '@/components/address/AddressForm'
import { cn } from '@/lib/utils/cn'
import type { Address, AddressInput } from '@/types/order'

/** کلید کش آدرس‌ها — با مرحله‌ی تسویه مشترک است تا هر دو هم‌زمان تازه شوند. */
export const ADDRESSES_QUERY_KEY = ['addresses'] as const

export function AddressList() {
  const t = useTranslations('address')
  const tStates = useTranslations('states')
  const queryClient = useQueryClient()

  /**
   * وضعیت فرم.
   *   null           → فرم بسته است
   *   'new'          → افزودن آدرس تازه
   *   Address        → ویرایش همان آدرس
   */
  const [editing, setEditing] = useState<Address | 'new' | null>(null)

  const addressesQuery = useQuery({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: ordersApi.getAddresses,
    staleTime: 60_000,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY })
  }

  /* =====================================================================
   * ذخیره (ساخت یا ویرایش)
   * =================================================================== */
  const saveMutation = useMutation({
    mutationFn: (input: AddressInput) =>
      editing && editing !== 'new'
        ? ordersApi.updateAddress(editing.id, input)
        : ordersApi.createAddress(input),

    onSuccess: () => {
      toast.success(t('saved'))
      setEditing(null)
      invalidate()
    },
    /*
     * خطا اینجا مدیریت نمی‌شود: AddressForm خودش خطاهای اعتبارسنجی
     * سرور را می‌گیرد و زیر هر فیلد نشان می‌دهد. نمایش یک toast
     * عمومی روی آن، فقط پیام دقیق‌تر را می‌پوشاند.
     */
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ordersApi.deleteAddress(id),
    onSuccess: () => {
      toast.success(t('deleted'))
      invalidate()
    },
    onError: () => toast.error(tStates('errorTitle')),
  })

  const defaultMutation = useMutation({
    mutationFn: (id: number) => ordersApi.setDefaultAddress(id),
    onSuccess: () => {
      toast.success(t('defaultSet'))
      invalidate()
    },
    onError: () => toast.error(tStates('errorTitle')),
  })

  const addresses = addressesQuery.data ?? []

  /* --- حالت بارگذاری --- */
  if (addressesQuery.isLoading) {
    return (
      <ul className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <li key={i} className="h-40 animate-pulse rounded-(--radius-lg) bg-muted" />
        ))}
      </ul>
    )
  }

  /* --- حالت خطا --- */
  if (addressesQuery.isError) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
        <AlertCircle className="size-12 text-warning" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
      </div>
    )
  }

  /* --- فرم باز است --- */
  if (editing !== null) {
    return (
      <div className="rounded-(--radius-lg) border border-border p-5">
        <h2 className="mb-4 text-base font-bold text-foreground">
          {editing === 'new' ? t('add') : t('edit')}
        </h2>

        <AddressForm
          address={editing === 'new' ? null : editing}
          onSubmit={async (input) => {
            await saveMutation.mutateAsync(input)
          }}
          onCancel={() => setEditing(null)}
          isSubmitting={saveMutation.isPending}
        />
      </div>
    )
  }

  return (
    <div>
      {/* ================= نوار بالا ================= */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t('count', { count: addresses.length })}
        </p>

        {addresses.length > 0 && (
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="inline-flex h-10 items-center gap-2 rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t('add')}
          </button>
        )}
      </div>

      {/* ================= محتوا ================= */}
      {addresses.length === 0 ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <MapPin className="size-12 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">{t('empty')}</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            {t('emptyDesc')}
          </p>

          <button
            type="button"
            onClick={() => setEditing('new')}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t('addFirst')}
          </button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => {
            const isBusy =
              (deleteMutation.isPending && deleteMutation.variables === address.id) ||
              (defaultMutation.isPending && defaultMutation.variables === address.id)

            return (
              <li
                key={address.id}
                className={cn(
                  'relative rounded-(--radius-lg) border p-4 transition-opacity',
                  address.isDefault ? 'border-primary bg-primary/5' : 'border-border',
                  isBusy && 'opacity-50',
                )}
              >
                {/* --- سربرگ کارت --- */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-foreground">
                      {address.label || address.recipientName}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {address.recipientName} · {address.recipientPhone}
                    </p>
                  </div>

                  {address.isDefault && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-(--radius-sm) bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      <Star className="size-3 fill-current" aria-hidden="true" />
                      {t('isDefault')}
                    </span>
                  )}
                </div>

                {/* --- نشانی --- */}
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {address.fullAddress}
                </p>

                {address.postalCode && (
                  <p dir="ltr" className="mt-1 text-start text-xs text-muted-foreground">
                    {address.postalCode}
                  </p>
                )}

                {/* --- عملیات --- */}
                <div className="mt-4 flex flex-wrap items-center gap-1">
                  {/*
                    «پیش‌فرض کن» فقط روی آدرسی که پیش‌فرض نیست.
                    دکمه‌ای که کاری نمی‌کند، فقط کاربر را سردرگم می‌کند.
                  */}
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => defaultMutation.mutate(address.id)}
                      disabled={isBusy}
                      className="inline-flex h-8 items-center gap-1.5 rounded-(--radius-md) px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                    >
                      <Star className="size-3.5" aria-hidden="true" />
                      {t('setDefault')}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setEditing(address)}
                    disabled={isBusy}
                    className="inline-flex h-8 items-center gap-1.5 rounded-(--radius-md) px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    {t('edit')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t('deleteConfirm'))) deleteMutation.mutate(address.id)
                    }}
                    disabled={isBusy}
                    className="ms-auto inline-flex h-8 items-center gap-1.5 rounded-(--radius-md) px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    {isBusy
                      ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      : <Trash2 className="size-3.5" aria-hidden="true" />}
                    {t('delete')}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
