import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapSupabaseError } from '../../src/client/utils/auth-error-mapper.ts';

describe('Supabase Auth Arabic Error Mapper', () => {
  it('maps invalid login credentials to generic Arabic message', () => {
    assert.equal(mapSupabaseError('Invalid login credentials'), 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    assert.equal(mapSupabaseError('invalid_grant: error verifying credentials'), 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
  });

  it('maps duplicate email registration to Arabic login prompt', () => {
    assert.equal(mapSupabaseError('User already registered'), 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.');
  });

  it('maps short password error to Arabic explanation', () => {
    assert.equal(mapSupabaseError('Password should be at least 6 characters'), 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.');
  });

  it('maps unconfirmed email to Arabic check-inbox prompt', () => {
    assert.equal(mapSupabaseError('Email not confirmed'), 'يرجى تأكيد بريدك الإلكتروني أولاً عبر الرابط المرسل إلى صندوق الوارد.');
  });

  it('maps rate limit violations to polite Arabic wait message', () => {
    assert.equal(mapSupabaseError('over_email_send_rate_limit'), 'تم تجاوز الحد المسموح من المحاولات. يرجى الانتظار بضع دقائق ثم المحاولة مجدداً.');
  });

  it('maps network dropouts to Arabic connectivity message', () => {
    assert.equal(mapSupabaseError('TypeError: Failed to fetch'), 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.');
  });
});
