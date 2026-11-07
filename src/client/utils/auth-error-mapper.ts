import type { AuthError } from '@supabase/supabase-js';

/**
 * Translates Supabase authentication errors into clear, friendly Arabic messages.
 * Prevents account enumeration on login by returning a generic credential error.
 */
export function mapSupabaseError(error: AuthError | Error | string): string {
  const msg = typeof error === 'string' ? error : error?.message || '';
  const lower = msg.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }
  if (lower.includes('user already registered') || lower.includes('already registered')) {
    return 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.';
  }
  if (lower.includes('password should be at least') || lower.includes('password is too short')) {
    return 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.';
  }
  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return 'يرجى تأكيد بريدك الإلكتروني أولاً عبر الرابط المرسل إلى صندوق الوارد.';
  }
  if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit')) {
    return 'تم تجاوز الحد المسموح من المحاولات. يرجى الانتظار بضع دقائق ثم المحاولة مجدداً.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('timeout')) {
    return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
  }

  // If the error message is already in Arabic (contains Arabic characters), preserve it
  if (/[\u0600-\u06FF]/.test(msg)) {
    return msg;
  }

  // Fallback: never leak raw English/SDK technical errors to Arabic users
  return 'حدث خطأ أثناء معالجة المصادقة. يرجى المحاولة لاحقاً.';
}

