<?php

/** Shop messages — English */

return [
    /* --- Cart --- */
    'cart_added' => 'Product added to your cart.',
    'cart_updated' => 'Cart updated.',
    'cart_removed' => 'Product removed from your cart.',
    'cart_cleared' => 'Cart cleared.',

    /* --- Errors --- */
    'insufficient_stock' => 'Not enough stock. Only :count left in inventory.',
    'out_of_stock' => 'This product is currently out of stock.',
    'product_required' => 'Please select a product.',
    'product_not_found' => 'Product not found.',
    'quantity_max' => 'You can order at most :max units of each item.',
    /* --- Address --- */
    'address_created' => 'Address saved successfully.',
    'address_updated' => 'Address updated.',
    'address_deleted' => 'Address deleted.',
    'address_default_set' => 'Default address changed.',
    'address_not_found' => 'The selected address was not found.',

    /* --- Order --- */
    'order_placed' => 'Your order has been placed successfully.',
    'order_cancelled' => 'Order cancelled.',
    'order_not_payable' => 'This order cannot be paid for.',
    'order_not_cancellable' => 'This order can no longer be cancelled.',
    'cart_empty' => 'Your cart is empty.',
    'product_unavailable' => 'One of the items in your cart is no longer available.',
    'invalid_status_transition' => 'Changing status from ":from" to ":to" is not allowed.',

    /* --- Payment --- */
    'payment_succeeded' => 'Payment completed successfully.',
    'payment_failed' => 'Payment failed.',
    'gateway_not_supported' => 'The selected payment gateway is not supported.',
    /* --- Admin panel --- */
    'order_status_updated' => 'Order status updated.',
    'invalid_status' => 'The selected status is not valid.',
    'product_created' => 'Product created successfully.',
    'product_updated' => 'Product updated.',
    'product_deleted' => 'Product deleted.',
    'stock_updated' => 'Stock updated.',

    /* --- Wishlist --- */
    'wishlist_added' => 'Added to your wishlist.',
    'wishlist_removed' => 'Removed from your wishlist.',
    'wishlist_empty' => 'Your wishlist is empty.',
    'product' => 'product',

    /* --- Reviews --- */
    'review_submitted' => 'Your review was submitted and will appear after moderation.',
    'review_already_exists' => 'You have already reviewed this product.',
    'review_rating_required' => 'A rating is required.',
    'review_rating_range' => 'The rating must be between 1 and 5 stars.',
    'review_comment_short' => 'Your review must be at least :min characters.',
    'review_own_vote' => 'You cannot vote on your own review.',
    'review_voted' => 'Your vote was recorded.',
    'review_unvoted' => 'Your vote was removed.',
    'review_approved' => 'Review approved and published.',
    'review_rejected' => 'Review rejected.',
    'review_deleted' => 'Review deleted.',

    /* --- Blog --- */
    'post_created' => 'Post created.',
    'post_updated' => 'Post updated.',
    'post_deleted' => 'Post deleted.',
    'post_published' => 'Post published.',
    'post_unpublished' => 'Post moved back to draft.',

    /* --- Profile & security --- */
    'profile_updated' => 'Your account details were updated.',
    'profile_name_required' => 'Name is required.',
    'profile_name_short' => 'Name must be at least 3 characters.',
    'profile_email_required' => 'Email is required.',
    'profile_email_invalid' => 'That email address is not valid.',
    'profile_email_taken' => 'That email is already registered.',
    'profile_phone_invalid' => 'The phone number must be 11 digits starting with 09.',
    'profile_phone_taken' => 'That phone number is already registered.',
    'profile_birth_future' => 'Your birth date cannot be in the future.',
    'password_updated' => 'Password changed. Other devices were signed out.',
    'password_current_required' => 'Your current password is required.',
    'password_current_wrong' => 'That is not your current password.',
    'password_new_required' => 'A new password is required.',
    'password_mismatch' => 'The confirmation does not match the new password.',
    'password_same_as_current' => 'The new password must differ from the current one.',
    'session_revoked' => 'That device was signed out.',
    'session_not_found' => 'Session not found.',
    'session_cannot_revoke_current' => 'You cannot end your current session from here.',

    /* --- Categories & brands (admin) --- */
    'category_created' => 'Category created.',
    'category_updated' => 'Category updated.',
    'category_deleted' => 'Category deleted.',
    'category_reordered' => 'Category order saved.',
    'category_cycle' => 'That would create a loop: a category cannot sit under its own child.',
    'category_has_children' => 'Remove or move the sub-categories first.',
    'category_has_products' => 'This category has :count products and cannot be deleted. You can deactivate it instead.',
    'brand_created' => 'Brand created.',
    'brand_updated' => 'Brand updated.',
    'brand_deleted' => 'Brand deleted.',
    'brand_has_products' => 'This brand has :count products and cannot be deleted. You can deactivate it instead.',
    /* --- Support tickets --- */
    'ticket_created' => 'Ticket :number was created. Our team will reply shortly.',
    'ticket_replied' => 'Your reply was posted.',
    'ticket_closed' => 'This ticket is closed. Reopen it to continue the conversation.',
    'ticket_closed_ok' => 'Ticket closed.',
    'ticket_reopened' => 'Ticket reopened.',
    'ticket_subject_required' => 'A subject is required.',
    'ticket_subject_short' => 'The subject must be at least :min characters.',
    'ticket_body_required' => 'A message body is required.',
    'ticket_body_short' => 'The message must be at least :min characters.',
    'ticket_reply_required' => 'A reply body is required.',
    'ticket_order_invalid' => 'The selected order does not belong to you.',
    'ticket_department_required' => 'Please choose a department.',
    'ticket_department_invalid' => 'The selected department is not valid.',
    'ticket_priority_required' => 'Please choose a priority.',
    'ticket_priority_invalid' => 'The selected priority is not valid.',

    /* --- مشتریان (پنل) --- */
    'customer_enabled' => 'Customer account enabled.',
    'customer_disabled' => 'Customer account disabled. They cannot sign in until it is re-enabled.',
    'customer_is_staff' => 'This account belongs to staff and cannot be changed here.',

    /* --- کد تخفیف --- */
    'coupon_applied' => 'Coupon applied.',
    'coupon_removed' => 'Coupon removed.',
    'coupon_invalid' => 'This coupon code is not valid.',
    'coupon_not_started' => 'This coupon is not active yet.',
    'coupon_expired' => 'This coupon has expired.',
    'coupon_exhausted' => 'This coupon has reached its usage limit.',
    'coupon_min_total' => 'This coupon only applies to carts over :amount toman.',
    'coupon_already_used' => 'You have already used this coupon.',

    /* --- کد تخفیف (پنل) --- */
    'coupon_created' => 'Coupon :code was created.',
    'coupon_updated' => 'Coupon updated.',
    'coupon_deleted' => 'Coupon deleted.',
    'coupon_enabled' => 'Coupon enabled.',
    'coupon_disabled' => 'Coupon disabled.',
    'coupon_has_usage' => 'This coupon has been used and cannot be deleted; disable it to end the campaign.',
    'coupon_code_required' => 'A code is required.',
    'coupon_code_format' => 'The code may only contain letters, digits, hyphens and underscores.',
    'coupon_code_taken' => 'This code is already taken.',
    'coupon_type_required' => 'Choose a discount type.',
    'coupon_value_required' => 'A discount value is required.',
    'coupon_value_min' => 'The discount value must be greater than zero.',
    'coupon_percent_range' => 'A percentage discount cannot exceed 100.',
    'coupon_max_only_percent' => 'A discount cap only applies to percentage coupons.',
    'coupon_expiry_order' => 'The end date must be after the start date.',
    'coupon_per_user_required' => 'A per-user limit is required.',

    /* --- تنظیمات --- */
    'settings_saved' => 'Settings saved.',

    /* --- تماس با ما --- */
    'contact_name_required' => 'Please enter your name.',
    'contact_name_short' => 'Your name must be at least 3 characters.',
    'contact_email_required' => 'Please enter your email.',
    'contact_email_invalid' => 'That email is not valid - without it we cannot reply.',
    'contact_subject_required' => 'Please enter a subject.',
    'contact_subject_short' => 'The subject must be at least 3 characters.',
    'contact_message_required' => 'Please enter your message.',
    'contact_message_short' => 'Your message must be at least :min characters.',
    'contact_sent' => 'Your message has been received. We will reply soon.',
    'contact_deleted' => 'Message deleted.',

    /* --- بنرها --- */
    'banner_title_required' => 'A Persian title is required.',
    'banner_href_required' => 'Please enter the banner destination.',
    'banner_href_internal' => 'The destination must be an internal path starting with / - external URLs are not accepted.',
    'banner_icon_invalid' => 'An icon name may only contain lowercase letters, digits and hyphens.',
    'banner_date_order' => 'The end date must be after the start date.',
    'banner_created' => 'Banner created.',
    'banner_updated' => 'Banner updated.',
    'banner_deleted' => 'Banner deleted.',

    /* --- اعلان‌ها --- */
    'notifications_all_read' => 'All notifications marked as read.',
    'notification_deleted' => 'Notification deleted.',
];
