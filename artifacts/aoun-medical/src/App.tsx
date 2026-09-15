import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Brain,
  Check,
  CheckCircle2,
  Clipboard,
  Clock3,
  Copy,
  Hand,
  HeartPulse,
  HelpCircle,
  Info,
  LifeBuoy,
  MessageCircle,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Wind,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Route, Router as WouterRouter, Switch } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

type Answer = 'yes' | 'no' | 'unknown';
type Step = 'welcome' | 'conditions' | 'questions' | 'summary';
type ConditionId = 'breathing' | 'fever' | 'headache' | 'skin' | 'dizziness' | 'stomach';

type Question = {
  id: string;
  text: string;
  help: string;
};

type Condition = {
  id: ConditionId;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  tint: string;
  questions: Question[];
};

const conditions: Condition[] = [
  {
    id: 'breathing',
    name: 'ضيق التنفس',
    description: 'صعوبة أو ثقل في أخذ النفس',
    icon: Wind,
    color: '#286b62',
    tint: '#dcece5',
    questions: [
      { id: 'start', text: 'هل بدأت الأعراض خلال آخر 24 ساعة؟', help: 'اختر الإجابة الأقرب لما تشعر به الآن.' },
      { id: 'effort', text: 'هل يزداد ضيق التنفس مع الحركة؟', help: 'مثل المشي أو صعود الدرج.' },
      { id: 'chest', text: 'هل تشعر بألم أو ضغط في الصدر؟', help: 'لا تحتاج إلى وصف الألم بالتفصيل في هذه الخطوة.' },
    ],
  },
  {
    id: 'fever',
    name: 'الحمى',
    description: 'ارتفاع في حرارة الجسم أو شعور بالحمى',
    icon: Thermometer,
    color: '#a45f3f',
    tint: '#f4e3d8',
    questions: [
      { id: 'start', text: 'هل بدأت الأعراض خلال آخر 24 ساعة؟', help: 'اختر الإجابة الأقرب لما تعرفه.' },
      { id: 'measure', text: 'هل قست درجة حرارتك؟', help: 'يمكنك اختيار «لا أعلم» إذا لم تكن متأكداً.' },
      { id: 'chills', text: 'هل تشعر بقشعريرة أو تعرّق غير معتاد؟', help: 'فكّر بما حدث منذ بداية الأعراض.' },
    ],
  },
  {
    id: 'headache',
    name: 'الصداع',
    description: 'ألم أو ضغط في الرأس',
    icon: Brain,
    color: '#6b5c82',
    tint: '#ebe4f2',
    questions: [
      { id: 'start', text: 'هل بدأ الصداع خلال آخر 24 ساعة؟', help: 'الوقت التقريبي مفيد للطبيب.' },
      { id: 'sudden', text: 'هل بدأ الصداع بشكل مفاجئ جداً؟', help: 'اختر «نعم» إذا ظهر بسرعة خلال دقائق.' },
      { id: 'vision', text: 'هل ترافق الصداع مع تغير في النظر؟', help: 'مثل تشوش أو رؤية مزدوجة.' },
    ],
  },
  {
    id: 'skin',
    name: 'حساسية الجلد',
    description: 'حكة أو احمرار أو طفح على الجلد',
    icon: Hand,
    color: '#ad684f',
    tint: '#f3e0da',
    questions: [
      { id: 'start', text: 'هل ظهرت العلامات خلال آخر 24 ساعة؟', help: 'يمكنك تقدير الوقت إن لم تكن متأكداً.' },
      { id: 'spread', text: 'هل ينتشر الطفح بسرعة؟', help: 'قارن مكانه الآن بما كان عليه في البداية.' },
      { id: 'swelling', text: 'هل يوجد تورم في الوجه أو الشفتين؟', help: 'هذه المعلومة مهمة عند التواصل مع الطبيب.' },
    ],
  },
  {
    id: 'dizziness',
    name: 'دوخة',
    description: 'إحساس بعدم التوازن أو دوران',
    icon: Activity,
    color: '#4c7180',
    tint: '#dcebf0',
    questions: [
      { id: 'start', text: 'هل بدأت الدوخة خلال آخر 24 ساعة؟', help: 'اختر الإجابة الأقرب لما تتذكره.' },
      { id: 'standing', text: 'هل تزداد الدوخة عند الوقوف؟', help: 'فكّر في آخر مرة انتقلت فيها من الجلوس للوقوف.' },
      { id: 'fall', text: 'هل سقطت أو فقدت توازنك؟', help: 'اختر «لا أعلم» إذا لم تتذكر بوضوح.' },
    ],
  },
  {
    id: 'stomach',
    name: 'ألم في البطن',
    description: 'ألم أو انزعاج في منطقة البطن',
    icon: HeartPulse,
    color: '#9b6350',
    tint: '#f1e3d9',
    questions: [
      { id: 'start', text: 'هل بدأ الألم خلال آخر 24 ساعة؟', help: 'الوقت يساعد على تكوين صورة أوضح.' },
      { id: 'severe', text: 'هل الألم شديد أو يزداد بسرعة؟', help: 'لا تقلق بشأن اختيار الإجابة المثالية.' },
      { id: 'vomit', text: 'هل تشعر بالغثيان أو تقيأت؟', help: 'اختر «نعم» إن حدث أي منهما.' },
    ],
  },
];

const answersLabel: Record<Answer, string> = {
  yes: 'نعم',
  no: 'لا',
  unknown: 'لا أعلم',
};
const answerClass: Record<Answer, string> = { yes: 'yes', no: 'no', unknown: 'unknown' };
const storageKey = 'aoun-demo-progress-v1';
const queryClient = new QueryClient();

function getStoredState(): { conditionId: ConditionId | null; answers: Record<string, Answer> } {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return { conditionId: null, answers: {} };
    const parsed = JSON.parse(stored) as { conditionId?: ConditionId; answers?: Record<string, Answer> };
    return { conditionId: parsed.conditionId ?? null, answers: parsed.answers ?? {} };
  } catch {
    return { conditionId: null, answers: {} };
  }
}

function AppLogo({ onClick }: { onClick: () => void }) {
  return (
    <button className="brand" onClick={onClick} aria-label="العودة إلى بداية عون" data-testid="button-brand-home">
      <span className="brand-mark"><LifeBuoy size={20} strokeWidth={1.8} /></span>
      <span>
        <span className="brand-name">عون</span>
        <span className="brand-subtitle">التواصل الطبي بوضوح</span>
      </span>
    </button>
  );
}

function Header({ onRestart }: { onRestart: () => void }) {
  return (
    <header className="topbar">
      <AppLogo onClick={onRestart} />
      <div className="topbar-note" aria-label="تجربة بدون صوت">
        <MessageCircle size={16} />
        <span>مصمم ليكون واضحاً من دون صوت</span>
      </div>
    </header>
  );
}

function Welcome({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="main-wrap view-enter">
      <section className="welcome-grid" aria-labelledby="welcome-title">
        <div>
          <div className="eyebrow">مساحة آمنة للتعبير عن شعورك</div>
          <h1 id="welcome-title" className="hero-title">
            قل ما تشعر به،<br /><em>بوضوح واطمئنان.</em>
          </h1>
          <p className="hero-copy">
            يساعدك عون على إعداد ملخص مكتوب لما تشعر به لتشاركه مع الطبيب بسهولة، من دون الحاجة إلى الكلام أو الاعتماد على السمع.
          </p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={onBegin} data-testid="button-start">
              ابدأ الآن <ArrowLeft size={18} />
            </button>
            <span className="demo-badge"><Sparkles size={13} /> نسخة تجريبية تعليمية</span>
          </div>
          <div className="disclaimer" role="note" data-testid="text-disclaimer">
            <ShieldCheck size={18} />
            <span>عون لا يشخّص الحالات ولا يستبدل الطبيب. إذا كانت حالتك طارئة، اطلب المساعدة الطبية فوراً.</span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="visual-orbit" />
          <div className="floating-note one"><BadgeCheck size={16} /> إجاباتك تبقى بين يديك</div>
          <div className="floating-note two"><Clipboard size={16} /> ملخص جاهز للمشاركة</div>
          <div className="visual-card">
            <div className="visual-header">
              <span>مساحة عون</span>
              <span className="visual-pulse"><i /> واضح ومطمئن</span>
            </div>
            <div className="visual-center">
              <div className="heart-disc"><HeartPulse /></div>
            </div>
            <div className="visual-message">
              <strong>صوتك مكتوب هنا</strong>
              اختر ما ينطبق عليك، وسنرتبه في ملخص مفهوم للطبيب.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Conditions({
  onBack,
  onSelect,
}: {
  onBack: () => void;
  onSelect: (condition: Condition) => void;
}) {
  return (
    <div className="main-wrap view-enter">
      <div className="page-heading">
        <div>
          <div className="step-kicker">الخطوة ١ من ٣</div>
          <h1>ما أكثر ما يزعجك الآن؟</h1>
          <p>اختر الحالة الأقرب لشعورك. يمكنك تعديل إجاباتك لاحقاً.</p>
        </div>
        <span className="demo-badge"><Sparkles size={13} /> أسئلة توضيحية تجريبية</span>
      </div>
      <div className="progress-wrap" aria-label="التقدم">
        <div className="progress-label"><span>اختيار الحالة</span><span>٣٣٪</span></div>
        <div className="progress-track"><div className="progress-value" style={{ width: '33%' }} /></div>
      </div>
      <div className="condition-grid" role="list" aria-label="الحالات المتاحة">
        {conditions.map((condition) => {
          const Icon = condition.icon;
          return (
            <button
              key={condition.id}
              className="condition-card"
              style={{ '--condition-color': condition.color, '--condition-tint': condition.tint } as CSSProperties}
              onClick={() => onSelect(condition)}
              data-testid={`button-condition-${condition.id}`}
              role="listitem"
            >
              <span className="condition-icon"><Icon /></span>
              <h2>{condition.name}</h2>
              <p>{condition.description}</p>
              <ArrowLeft className="condition-arrow" size={17} />
            </button>
          );
        })}
      </div>
      <div className="helper-panel">
        <Info size={19} />
        <span>لا توجد إجابة صحيحة أو خاطئة. اختر «لا أعلم» عندما لا تكون متأكداً؛ الدقة تبدأ من الصراحة.</span>
      </div>
      <button className="back-link" onClick={onBack} data-testid="button-back-welcome">
        <ArrowRight size={17} /> العودة
      </button>
    </div>
  );
}

function QuestionStep({
  condition,
  questionIndex,
  answers,
  onAnswer,
  onBack,
  onNext,
}: {
  condition: Condition;
  questionIndex: number;
  answers: Record<string, Answer>;
  onAnswer: (answer: Answer) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const question = condition.questions[questionIndex];
  const selected = answers[`${condition.id}-${question.id}`];
  const Icon = condition.icon;
  const isLast = questionIndex === condition.questions.length - 1;
  const progress = Math.round(((questionIndex + 1) / condition.questions.length) * 100);

  return (
    <div className="main-wrap view-enter">
      <div className="question-shell">
        <div className="progress-wrap">
          <div className="progress-label"><span>الخطوة ٢ من ٣ · أسئلة توضيحية</span><span>{progress}٪</span></div>
          <div className="progress-track"><div className="progress-value" style={{ width: `${progress}%` }} /></div>
        </div>
        <section className="question-card" aria-labelledby="question-title">
          <div className="question-card-top">
            <div className="condition-mini"><span className="condition-mini-icon"><Icon size={17} /></span>{condition.name}</div>
            <span className="question-count" data-testid="text-question-count">السؤال {questionIndex + 1} من {condition.questions.length}</span>
          </div>
          <h1 className="question-title" id="question-title">{question.text}</h1>
          <p className="question-help">{question.help}</p>
          <div className="answer-grid" role="group" aria-label="اختيارات الإجابة">
            {(Object.keys(answersLabel) as Answer[]).map((answer) => {
              const AnswerIcon = answer === 'yes' ? CheckCircle2 : answer === 'no' ? XCircle : HelpCircle;
              return (
                <button
                  key={answer}
                  className={`answer-btn ${selected === answer ? `selected ${answerClass[answer]}` : ''}`}
                  onClick={() => onAnswer(answer)}
                  aria-pressed={selected === answer}
                  data-testid={`button-answer-${answer}`}
                >
                  <span className="answer-mark"><AnswerIcon size={14} /></span>
                  {answersLabel[answer]}
                </button>
              );
            })}
          </div>
          <div className="question-nav">
            <button className="back-link" onClick={onBack} data-testid="button-back-question">
              <ArrowRight size={17} /> السابق
            </button>
            <button className="primary-btn" onClick={onNext} disabled={!selected} data-testid="button-next-question">
              {isLast ? 'عرض الملخص' : 'التالي'} <ArrowLeft size={18} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Summary({
  condition,
  answers,
  onEdit,
  onRestart,
}: {
  condition: Condition;
  answers: Record<string, Answer>;
  onEdit: () => void;
  onRestart: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [sharedMessage, setSharedMessage] = useState('');
  const grouped = useMemo(() => {
    const result: Record<Answer, string[]> = { yes: [], no: [], unknown: [] };
    condition.questions.forEach((question) => {
      const answer = answers[`${condition.id}-${question.id}`];
      if (answer) result[answer].push(question.text);
    });
    return result;
  }, [answers, condition]);

  const summaryText = useMemo(() => {
    const lines = [`أنا من ذوي الإعاقة السمعية، أعاني من ${condition.name}.`, ''];
    (Object.keys(answersLabel) as Answer[]).forEach((answer) => {
      lines.push(`${answersLabel[answer]}:`);
      lines.push(...(grouped[answer].length ? grouped[answer].map((item) => `• ${item}`) : ['لا توجد إجابات ضمن هذه الفئة.']));
      lines.push('');
    });
    return lines.join('\n');
  }, [condition.name, grouped]);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = summaryText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 3000);
  };

  const shareText = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'ملخص عون الطبي', text: summaryText });
        setSharedMessage('تم فتح خيارات المشاركة على جهازك.');
        return;
      } catch {
        return;
      }
    }
    await copyText();
    setSharedMessage('لا تتوفر المشاركة المباشرة؛ تم نسخ الملخص لتشاركه بالطريقة التي تناسبك.');
    window.setTimeout(() => setSharedMessage(''), 4500);
  };

  const statusData: { key: Answer; title: string; icon: LucideIcon }[] = [
    { key: 'yes', title: 'نعم · مؤكد', icon: CheckCircle2 },
    { key: 'no', title: 'لا · غير موجود', icon: XCircle },
    { key: 'unknown', title: 'لا أعلم · يحتاج توضيحاً', icon: HelpCircle },
  ];

  return (
    <div className="main-wrap view-enter">
      <div className="summary-header">
        <div>
          <div className="step-kicker">الخطوة ٣ من ٣ · جاهز للمشاركة</div>
          <h1 className="summary-title">هذا ما تريد قوله للطبيب</h1>
          <p className="summary-subtitle">راجع الملخص وعدّل أي إجابة قبل مشاركته.</p>
        </div>
        <button className="quiet-btn" onClick={onEdit} data-testid="button-edit-summary"><RotateCcw size={16} /> تعديل الإجابات</button>
      </div>
      <section className="summary-surface" aria-labelledby="summary-title">
        <div className="summary-lead">
          <div className="summary-lead-label"><Clipboard size={17} /> ملخص مكتوب · نسخة تجريبية</div>
          <p className="summary-quote" id="summary-title" data-testid="text-summary-lead">
            أنا من ذوي الإعاقة السمعية، أعاني من <strong>{condition.name}</strong>.
          </p>
        </div>
        <div className="summary-columns">
          {statusData.map(({ key, title, icon: StatusIcon }) => (
            <section className="status-section" key={key} aria-labelledby={`status-${key}`}>
              <h2 className={`status-heading ${answerClass[key]}`} id={`status-${key}`}>
                <StatusIcon size={18} /> {title}
              </h2>
              {grouped[key].length ? (
                <ul className="status-list">
                  {grouped[key].map((item) => <li key={item} data-testid={`text-answer-${key}`}>{item}</li>)}
                </ul>
              ) : <p className="empty-status">لم تسجل إجابات في هذه الفئة.</p>}
            </section>
          ))}
        </div>
      </section>
      <div className="summary-actions">
        <button className="primary-btn" onClick={copyText} data-testid="button-copy-summary"><Copy size={17} /> نسخ الملخص</button>
        <button className="ghost-btn" onClick={shareText} data-testid="button-share-summary"><Share2 size={17} /> مشاركة من الجهاز</button>
        {copied && <span className="confirmation" role="status" data-testid="status-copy-confirmation"><Check size={16} /> تم نسخ الملخص بنجاح</span>}
      </div>
      {sharedMessage && <div className="summary-notice" role="status" data-testid="status-share-message"><Info size={17} /><span>{sharedMessage}</span></div>}
      <div className="summary-notice">
        <AlertCircle size={17} />
        <span>هذا الملخص يصف إجاباتك فقط ولا يقدم تشخيصاً طبياً. إذا شعرت بخطر فوري، توجّه إلى الطوارئ أو اطلب المساعدة من شخص قريب.</span>
      </div>
      <button className="back-link" onClick={onRestart} data-testid="button-restart"><RotateCcw size={17} /> بدء ملخص جديد</button>
    </div>
  );
}

function LoadingSafe() {
  return (
    <div className="main-wrap" style={{ minHeight: '70dvh', display: 'grid', placeItems: 'center' }}>
      <div className="helper-panel" role="status"><Clock3 size={18} /> لحظة، نجهز لك مساحة عون...</div>
    </div>
  );
}

function Home() {
  const stored = useMemo(getStoredState, []);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<Step>('welcome');
  const [selectedConditionId, setSelectedConditionId] = useState<ConditionId | null>(stored.conditionId);
  const [answers, setAnswers] = useState<Record<string, Answer>>(stored.answers);
  const [questionIndex, setQuestionIndex] = useState(0);
  const selectedCondition = conditions.find((condition) => condition.id === selectedConditionId) ?? null;

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 180);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ conditionId: selectedConditionId, answers }));
    } catch {
      // The flow remains usable when browser storage is unavailable.
    }
  }, [answers, selectedConditionId]);

  const restart = () => {
    setStep('welcome');
    setSelectedConditionId(null);
    setAnswers({});
    setQuestionIndex(0);
    try { window.localStorage.removeItem(storageKey); } catch { /* no-op */ }
  };

  const chooseCondition = (condition: Condition) => {
    setSelectedConditionId(condition.id);
    setQuestionIndex(0);
    setStep('questions');
  };

  const answerQuestion = (answer: Answer) => {
    if (!selectedCondition) return;
    const question = selectedCondition.questions[questionIndex];
    setAnswers((current) => ({ ...current, [`${selectedCondition.id}-${question.id}`]: answer }));
  };

  if (!ready) return <LoadingSafe />;

  return (
    <>
      <Header onRestart={restart} />
      {step === 'welcome' && <Welcome onBegin={() => setStep('conditions')} />}
      {step === 'conditions' && <Conditions onBack={() => setStep('welcome')} onSelect={chooseCondition} />}
      {step === 'questions' && selectedCondition && (
        <QuestionStep
          condition={selectedCondition}
          questionIndex={questionIndex}
          answers={answers}
          onAnswer={answerQuestion}
          onBack={() => questionIndex > 0 ? setQuestionIndex((current) => current - 1) : setStep('conditions')}
          onNext={() => questionIndex < selectedCondition.questions.length - 1 ? setQuestionIndex((current) => current + 1) : setStep('summary')}
        />
      )}
      {step === 'summary' && selectedCondition && (
        <Summary
          condition={selectedCondition}
          answers={answers}
          onEdit={() => { setQuestionIndex(0); setStep('questions'); }}
          onRestart={restart}
        />
      )}
      <footer className="footer-note">
        <span><ShieldCheck size={14} /> بياناتك محفوظة على هذا الجهاز فقط</span>
        <span>عون · نسخة تجريبية</span>
      </footer>
    </>
  );
}

function Router() {
  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <div className="aoun-app" dir="rtl"><div className="aoun-shell"><Router /></div></div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;