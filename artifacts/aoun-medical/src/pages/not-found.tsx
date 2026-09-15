import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="main-wrap" dir="rtl" style={{ minHeight: '70dvh', display: 'grid', placeItems: 'center' }}>
      <div className="question-card" style={{ maxWidth: '32rem', width: '100%' }}>
        <div className="summary-lead-label"><AlertCircle size={20} /> الصفحة غير موجودة</div>
        <h1 className="summary-title">يبدو أننا ابتعدنا قليلاً.</h1>
        <p className="summary-subtitle">هذه الصفحة غير متاحة. عد إلى بداية عون لمتابعة إعداد ملخصك الطبي.</p>
        <a className="primary-btn" href="/" style={{ marginTop: '1.5rem', textDecoration: 'none' }}>العودة إلى البداية</a>
      </div>
    </div>
  );
}
