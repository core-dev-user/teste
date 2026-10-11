import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  Coffee,
  Flame,
  Flower2,
  Headphones,
  Heart,
  LayoutDashboard,
  Leaf,
  Lightbulb,
  Menu,
  Moon,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  Sparkles,
  Sprout,
  Target,
  TrendingUp,
  Volume2,
  X,
} from "lucide-react";
import {
  LANGS,
  languages,
  lessons,
  plans,
  type Lang,
  type Lesson,
} from "./content";
import {
  CYCLE,
  STORAGE_KEY,
  TIMEZONE,
  addDays,
  addMonths,
  currentLesson,
  cycleWeek,
  dateKey,
  daysBetween,
  dueReviews,
  durationFor,
  finishSession,
  firstStudyDay,
  goalEvidence,
  loadState,
  monday,
  monthNumber,
  nextDayForLanguage,
  nightTime,
  parseDate,
  portions,
  schedule,
  todayKey,
  validateState,
  verifiedGoal,
  type Active,
  type AppState,
  type Recall,
  type Session,
  type Settings,
} from "./model";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/dm-serif-display/400.css";

type View =
  "home" | "calendar" | "journey" | "progress" | "journal" | "settings";
const navItems: { id: View; label: string; icon: typeof Leaf }[] = [
  { id: "home", label: "Minha rotina", icon: LayoutDashboard },
  { id: "calendar", label: "Calendário", icon: CalendarDays },
  { id: "journey", label: "Minha jornada", icon: Sprout },
  { id: "progress", label: "Meu progresso", icon: TrendingUp },
  { id: "journal", label: "Caderno de estudos", icon: BookOpen },
  { id: "settings", label: "Ajustes", icon: Settings2 },
];
const shortDays = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const fmtDate = (
  date: string,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" },
) => parseDate(date).toLocaleDateString("pt-BR", opts);
const formatMinutes = (n: number) =>
  n > 0 && n < 1
    ? "< 1"
    : Number.isInteger(n)
      ? String(n)
      : n.toFixed(1).replace(".", ",");
function LangBadge({ lang, small = false }: { lang: Lang; small?: boolean }) {
  return (
    <span
      className={`lang-badge ${languages[lang].color} ${small ? "small" : ""}`}
    >
      <span>{languages[lang].flag}</span>
      {languages[lang].name}
    </span>
  );
}
function PlantArt({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "plant-art small" : "plant-art"}
      viewBox="0 0 340 320"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="196" cy="157" r="119" fill="#E2EAD7" />
      <circle cx="196" cy="157" r="97" stroke="#C5D4BD" strokeDasharray="3 7" />
      <path
        d="M149 264C170 222 193 162 204 70"
        stroke="#356D53"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M190 157C146 162 122 136 119 99C155 102 189 116 190 157Z"
        fill="#85A78A"
      />
      <path
        d="M199 118C227 118 253 94 255 61C219 65 196 85 199 118Z"
        fill="#477D5D"
      />
      <path
        d="M173 204C139 204 110 185 98 153C135 153 165 167 173 204Z"
        fill="#628F70"
      />
      <path
        d="M185 177C222 183 251 164 266 135C231 129 198 143 185 177Z"
        fill="#A4B798"
      />
      <path
        d="M161 237C193 247 226 235 244 209C209 198 179 208 161 237Z"
        fill="#3E7357"
      />
      <path
        d="M203 91C182 74 180 45 193 24C214 44 215 70 203 91Z"
        fill="#71997A"
      />
      <path d="M145 256H197L186 301H156L145 256Z" fill="#DBC7AC" />
      <path d="M142 256H200V265H142V256Z" fill="#C5AC8A" />
      <path d="M60 261L118 242L146 257L90 279L60 261Z" fill="#F9F8EE" />
      <path d="M90 279V286L145 264V257" fill="#DEDAC7" />
      <path d="M60 261V268L90 286V279" fill="#E9E4D5" />
      <path
        d="M102 247L132 258M90 251L119 262"
        stroke="#C1CCB5"
        strokeWidth="2"
      />
      <path
        d="M248 265C247 276 252 283 263 283H278C287 283 292 276 291 265H248Z"
        fill="#F4EEE1"
      />
      <path
        d="M291 267H297C307 267 305 278 292 278"
        stroke="#F4EEE1"
        strokeWidth="4"
      />
      <path
        d="M259 254C253 246 269 246 263 237M276 254C270 246 286 246 280 237"
        stroke="#B6C6AB"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M65 95L69 106L80 110L69 114L65 125L61 114L50 110L61 106L65 95Z"
        fill="#B5BD91"
      />
      <circle cx="289" cy="191" r="4" fill="#B5BD91" />
      <circle cx="85" cy="197" r="3" fill="#B5BD91" />
    </svg>
  );
}
function Modal({
  children,
  title,
  onClose,
  wide = false,
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = ref.current;
    el?.focus();
    const handler = (e: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[role="dialog"]');
      if (dialogs[dialogs.length - 1] !== el) return;
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab" && el) {
        const nodes = Array.from(
          el.querySelectorAll<HTMLElement>(
            'button:not(:disabled),input,textarea,select,[tabindex="0"]',
          ),
        );
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === el)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", handler);
      old?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${wide ? "wide" : ""}`}
      >
        <button
          className="icon-button modal-close"
          aria-label="Fechar"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [loaded] = useState(loadState);
  const [state, setState] = useState<AppState>(loaded.state);
  const [storageError, setStorageError] = useState(loaded.error);
  const [saved, setSaved] = useState(!loaded.error);
  const [persistenceBlocked, setPersistenceBlocked] = useState(!!loaded.error);
  const [view, setView] = useState<View>("home");
  const [today, setToday] = useState(todayKey());
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [success, setSuccess] = useState<Session | null>(null);
  const [confirm, setConfirm] = useState<"discard" | "reset" | null>(null);
  const [assessment, setAssessment] = useState<{
    lang: Lang;
    month: number;
    goal: number;
  } | null>(null);
  const [preview, setPreview] = useState<Lesson | null>(null);
  const lastTick = useRef(Date.now());
  useEffect(() => {
    if (persistenceBlocked) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setSaved(true);
      setStorageError("");
    } catch {
      setSaved(false);
      setStorageError(
        "Não foi possível salvar neste navegador. Exporte seu progresso nos ajustes.",
      );
    }
  }, [state, persistenceBlocked]);
  useEffect(() => {
    const id = window.setInterval(() => setToday(todayKey()), 30000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!state.active?.running) return;
    lastTick.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastTick.current) / 1000;
      lastTick.current = now;
      setState((s) => {
        if (!s.active?.running) return s;
        const remaining = Math.max(0, s.active.remaining - elapsed);
        return {
          ...s,
          active: {
            ...s.active,
            remaining,
            running:
              remaining > 0 && s.active.date === todayKey() && nightTime(),
          },
        };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state.active?.running]);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 5500);
    return () => clearTimeout(id);
  }, [toast]);
  const navigate = (v: View) => {
    setView(v);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const notify = (msg: string) => setToast(msg);
  const todaySession = state.sessions.find((s) => s.date === today);
  const scheduled = schedule(today, state.settings.startDate);
  const ended = today >= addMonths(state.settings.startDate, 6);
  const weekend = parseDate(today).getDay() % 6 === 0;
  const beforeStart = today < state.settings.startDate;
  const activeLang =
    state.active?.lang ??
    todaySession?.lang ??
    scheduled ??
    schedule(
      addDays(today, parseDate(today).getDay() === 6 ? 2 : 1),
      state.settings.startDate,
    ) ??
    "ja";
  const start = (mini = false) => {
    if (state.active) {
      setSessionOpen(true);
      return;
    }
    if (todaySession) {
      notify("Seu passo de hoje já está registrado. Até a próxima noite!");
      return;
    }
    if (beforeStart || ended) {
      notify(
        beforeStart
          ? "Seu plano começa em " +
              fmtDate(state.settings.startDate) +
              ". Você pode alterar a data nos ajustes."
          : "Você concluiu o período do plano. Ajuste a data de início para abrir um novo ciclo, preservando seu histórico.",
      );
      return;
    }
    if (!scheduled) {
      notify(
        "Sábado e domingo ficam livres. A próxima sessão está pronta para uma noite de segunda a sexta.",
      );
      return;
    }
    if (!nightTime()) {
      notify(
        "Sua rotina é à noite: as sessões ficam disponíveis das 18h às 23h59, no horário de Brasília. O plano e o conteúdo estão disponíveis para consulta.",
      );
      return;
    }
    const lang = scheduled;
    const next = currentLesson(lang, state, today);
    const previous = [...state.sessions].reverse().find((s) => s.lang === lang);
    const lesson = mini
      ? (lessons[lang].find((l) => l.id === previous?.lessonId) ?? next)
      : next;
    const duration = mini ? 5 : durationFor(today, state.settings);
    const active: Active = {
      lang,
      lessonId: lesson.id,
      date: today,
      duration,
      remaining: duration * 60,
      running: true,
      checked: Array(mini ? 2 : 3).fill(false),
      optional: false,
      reviewIds: dueReviews(state, lang, today).map((r) => r.id),
    };
    setState((s) => ({ ...s, active }));
    setSessionOpen(true);
  };
  const complete = (
    details: Pick<Session, "content" | "difficulty" | "note" | "recall">,
  ) => {
    const a = state.active;
    if (!a) return;
    const elapsed = a.duration * 60 - a.remaining;
    if (elapsed < 1) {
      notify(
        "O cronômetro ainda não registrou tempo de estudo. Inicie a sessão antes de salvar.",
      );
      return;
    }
    const session: Session = {
      id: crypto.randomUUID(),
      date: a.date,
      lang: a.lang,
      lessonId: a.lessonId,
      minutes: Math.round((elapsed / 60) * 100) / 100,
      target: a.duration,
      mini: a.duration === 5,
      completed: a.checked.every(Boolean),
      optional: a.optional,
      ...details,
    };
    setState((s) => finishSession(s, session));
    setSessionOpen(false);
    setSuccess(session);
  };
  const totalMinutes = state.sessions.reduce((sum, s) => sum + s.minutes, 0);
  const currentMonth = monthNumber(today, state.settings.startDate);
  const verified = LANGS.reduce(
    (sum, l) =>
      sum +
      plans[l].reduce(
        (n, p, m) =>
          n + p.goals.filter((_, g) => verifiedGoal(state, l, m + 1, g)).length,
        0,
      ),
    0,
  );
  const closeSession = () => {
    setState((s) =>
      s.active ? { ...s, active: { ...s.active, running: false } } : s,
    );
    setSessionOpen(false);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  };
  const titles: Record<View, string> = {
    home: "Minha rotina",
    calendar: "Calendário",
    journey: "Minha jornada",
    progress: "Meu progresso",
    journal: "Caderno de estudos",
    settings: "Ajustes",
  };
  return (
    <div className="app-shell">
      {menu && <div className="mobile-scrim" onClick={() => setMenu(false)} />}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <button
          className="brand"
          onClick={() => navigate("home")}
          aria-label="Passo, início"
        >
          <span className="brand-mark">
            <Sprout size={25} />
          </span>
          <span>
            passo<span className="brand-dot">.</span>
          </span>
        </button>
        <div className="brand-tagline">Um pouco, todos os dias.</div>
        <div className="nav-label">SEU CAMINHO</div>
        <nav aria-label="Navegação principal">
          {navItems.slice(0, 4).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${view === id ? "active" : ""}`}
              onClick={() => navigate(id)}
              aria-current={view === id ? "page" : undefined}
            >
              <Icon size={19} />
              {label}
              {view === id && <span className="nav-dot" />}
            </button>
          ))}
          <div className="nav-divider" />
          {navItems.slice(4).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${view === id ? "active" : ""}`}
              onClick={() => navigate(id)}
              aria-current={view === id ? "page" : undefined}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-icon">
            <Flower2 size={23} />
          </span>
          <p>
            Devagar também
            <br />é uma direção.
          </p>
          <span>
            Você não precisa dar conta
            <br />
            de tudo hoje.
          </span>
          <div className="note-line" />
        </div>
        <div className="sidebar-user">
          <span className="avatar">V</span>
          <div>
            <strong>Seu espaço</strong>
            <span>Uma noite de cada vez</span>
          </div>
          <Heart size={17} />
        </div>
      </aside>
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenu(true)}
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>
            <span>{titles[view]}</span>
          </div>
          <div className="topbar-right">
            <span className="save-status">
              <span className={saved ? "status-dot" : "status-dot warning"} />
              {saved ? "Progresso salvo" : "Salvamento pendente"}
            </span>
            <span className="topbar-separator" />
            <Moon size={17} />
            <span className="topbar-time">
              Seu horário: {state.settings.time.replace(":", "h")}
            </span>
          </div>
        </header>
        <main>
          {storageError && (
            <div className="storage-banner" role="alert">
              {storageError}
            </div>
          )}
          {view === "home" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    <Moon size={15} /> NO SEU TEMPO, NO SEU RITMO
                  </div>
                  <h1>
                    Pequenos passos, novos mundos<span>.</span>
                  </h1>
                  <p>Um pouquinho hoje já faz diferença. Vamos com calma?</p>
                </div>
                <div className="date-chip">
                  <CalendarDays size={17} />
                  {fmtDate(today, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  }).replaceAll(".", "")}
                </div>
              </div>
              <div className="home-top-grid">
                <section className="today-card">
                  <div className="today-card-content">
                    <div className="eyebrow">
                      <span className="soft-dot" />
                      {todaySession
                        ? "SEU PASSO ESTÁ REGISTRADO"
                        : weekend
                          ? "SEU FIM DE SEMANA É LIVRE"
                          : beforeStart
                            ? "UM NOVO COMEÇO TE ESPERA"
                            : ended
                              ? "SEIS MESES DE CAMINHO"
                              : "SEU PEQUENO PASSO DE HOJE"}
                    </div>
                    <div className="hero-language">
                      {todaySession ? (
                        <CircleCheck size={29} />
                      ) : weekend ? (
                        <Coffee size={29} />
                      ) : (
                        <span className="hero-flag">
                          {languages[activeLang].flag}
                        </span>
                      )}
                      <h2>
                        {todaySession
                          ? "Você apareceu por você."
                          : weekend
                            ? "Uma pausa também faz bem."
                            : beforeStart
                              ? "Tudo pronto para começar."
                              : ended
                                ? "Olha só o seu caminho."
                                : languages[activeLang].name}
                      </h2>
                    </div>
                    <p className="hero-description">
                      {todaySession
                        ? "Seu estudo de hoje já está guardado. Aproveite o resto da noite."
                        : weekend
                          ? "Sábado e domingo sem tarefas. Descanse, viva e volte no seu ritmo."
                          : beforeStart
                            ? `A primeira sessão está prevista para ${fmtDate(firstStudyDay(state.settings.startDate))}.`
                            : ended
                              ? "Seu histórico continua aqui. As conquistas não têm prazo de validade."
                              : currentLesson(activeLang, state, today).title +
                                " · um começo possível, sem pressa."}
                    </p>
                    <div className="hero-meta">
                      <span>
                        <Clock3 size={16} />
                        {!state.active &&
                        !todaySession &&
                        !beforeStart &&
                        !ended &&
                        daysBetween(
                          firstStudyDay(state.settings.startDate),
                          today,
                        ) >= 14 ? (
                          <select
                            className="duration-select"
                            aria-label="Duração da sessão"
                            value={state.settings.duration}
                            onChange={(e) =>
                              setState((s) => ({
                                ...s,
                                settings: {
                                  ...s.settings,
                                  duration: Number(
                                    e.target.value,
                                  ) as Settings["duration"],
                                },
                              }))
                            }
                          >
                            <option value="20">20 minutos</option>
                            <option value="25">25 minutos</option>
                            <option value="30">30 minutos</option>
                          </select>
                        ) : (
                          <>
                            {state.active
                              ? state.active.duration
                              : durationFor(today, state.settings)}{" "}
                            minutos
                          </>
                        )}
                      </span>
                      <span className="meta-dot" />{" "}
                      <span>
                        <Moon size={16} />
                        {state.settings.time.replace(":", "h")}
                      </span>
                      <span className="level-tag">Iniciante</span>
                    </div>
                    <div className="hero-actions">
                      <button
                        className="button primary"
                        onClick={() =>
                          todaySession
                            ? navigate("journal")
                            : ended || beforeStart
                              ? navigate("settings")
                              : weekend
                                ? setPreview(
                                    currentLesson(activeLang, state, today),
                                  )
                                : start()
                        }
                      >
                        <span>
                          {todaySession
                            ? "Ver meu registro"
                            : state.active
                              ? "Continuar sessão"
                              : weekend
                                ? "Conhecer a próxima sessão"
                                : beforeStart
                                  ? "Ajustar início"
                                  : ended
                                    ? "Ajustar meu plano"
                                    : "Começar"}
                        </span>
                        {todaySession ? (
                          <BookOpen size={17} />
                        ) : (
                          <ArrowRight size={18} />
                        )}
                      </button>
                      <button
                        className="hero-more"
                        onClick={() =>
                          setPreview(currentLesson(activeLang, state, today))
                        }
                        aria-label="Ver conteúdo da próxima sessão"
                      >
                        <BookOpen size={19} />
                      </button>
                    </div>
                    {weekend && !todaySession && (
                      <div className="hero-footnote">
                        Só uma consulta · sua próxima sessão será em uma noite
                        útil
                      </div>
                    )}
                  </div>
                  <PlantArt />
                </section>
                <section className="gentle-card">
                  <span className="gentle-icon">
                    <Heart size={22} />
                  </span>
                  <div className="eyebrow">TEM DIAS E DIAS</div>
                  <h2>
                    Pouco também
                    <br />é progresso.
                  </h2>
                  <p>
                    Se hoje estiver difícil, cinco minutos são um ótimo começo.
                  </p>
                  <button
                    className="button light"
                    onClick={() => start(true)}
                    disabled={
                      !!todaySession ||
                      beforeStart ||
                      ended ||
                      (weekend && !state.active)
                    }
                  >
                    <Clock3 size={17} />
                    {state.active
                      ? "Retomar minha sessão"
                      : "Hoje só tenho 5 minutos"}
                    <ArrowRight size={16} />
                  </button>
                  <div className="gentle-bottom">
                    <Leaf size={14} />
                    {weekend
                      ? "Disponível nas noites de segunda a sexta."
                      : "Sem cobrança. Sem tarefas acumuladas."}
                  </div>
                </section>
              </div>
              <section className="week-section">
                <div className="section-heading">
                  <div>
                    <h2>
                      {today < firstStudyDay(state.settings.startDate)
                        ? "Sua primeira semana, sem pressa"
                        : "Sua semana, com espaço para viver"}{" "}
                      <span className="count-chip">
                        Semana {cycleWeek(today, state.settings.startDate)} de 3
                      </span>
                    </h2>
                    <p>Uma língua por noite. O fim de semana é seu.</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("calendar")}
                  >
                    Ver calendário
                    <ArrowRight size={16} />
                  </button>
                </div>
                <WeekStrip
                  state={state}
                  today={today}
                  onToday={() => start()}
                  onDay={() => navigate("calendar")}
                />
              </section>
              <div className="home-bottom-grid">
                <section className="card journey-overview">
                  <div className="section-heading">
                    <h2>Três línguas. Uma jornada.</h2>
                    <span className="soft-icon">
                      <Sprout size={19} />
                    </span>
                  </div>
                  <p className="muted">
                    Seis meses para construir suas primeiras bases.
                  </p>
                  <div className="language-progress-list">
                    {LANGS.map((lang) => {
                      const goalCount = plans[lang].reduce(
                        (n, p, m) =>
                          n +
                          p.goals.filter((_, g) =>
                            verifiedGoal(state, lang, m + 1, g),
                          ).length,
                        0,
                      );
                      return (
                        <button
                          className="language-progress-row"
                          key={lang}
                          onClick={() => navigate("journey")}
                        >
                          <span
                            className={`language-square ${languages[lang].color}`}
                          >
                            {languages[lang].flag}
                          </span>
                          <div className="language-row-content">
                            <div>
                              <strong>{languages[lang].name}</strong>
                              <span>{languages[lang].native}</span>
                            </div>
                            <div className="progress-track">
                              <span
                                style={{ width: `${(goalCount / 12) * 100}%` }}
                                className={languages[lang].color}
                              />
                            </div>
                          </div>
                          <span className="language-percent">
                            {goalCount}/12<small>metas verificadas</small>
                          </span>
                          <ChevronRight size={15} />
                        </button>
                      );
                    })}
                  </div>
                  <div className="journey-card-footer">
                    <span>
                      <span className="status-dot" />
                      Mês {currentMonth} de 6
                    </span>
                    <button
                      className="text-button"
                      onClick={() => navigate("journey")}
                    >
                      Conhecer meu plano
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </section>
                <section className="card weekly-overview">
                  <div className="section-heading">
                    <h2>Seu ritmo nesta semana</h2>
                    <span className="soft-icon">
                      <TrendingUp size={19} />
                    </span>
                  </div>
                  <p className="muted">
                    Cada minuto é um investimento em você.
                  </p>
                  <div className="weekly-stats">
                    <div>
                      <strong>
                        {
                          state.sessions.filter(
                            (s) =>
                              s.date >= monday(today) &&
                              s.date <= addDays(monday(today), 6),
                          ).length
                        }
                        <span>/ 5</span>
                      </strong>
                      <p>noites de estudo</p>
                    </div>
                    <div>
                      <strong>
                        {formatMinutes(
                          state.sessions
                            .filter(
                              (s) =>
                                s.date >= monday(today) &&
                                s.date <= addDays(monday(today), 6),
                            )
                            .reduce((n, s) => n + s.minutes, 0),
                        )}
                        <span>min</span>
                      </strong>
                      <p>no seu próprio ritmo</p>
                    </div>
                  </div>
                  <MiniBars state={state} today={today} />
                  <div className="encouragement">
                    <Sparkles size={16} />
                    {state.sessions.length
                      ? "Seu caminho fica com você, mesmo nos dias de pausa."
                      : "Seu primeiro passo não precisa ser grande. Só seu."}
                  </div>
                </section>
              </div>
              <footer className="home-footer">
                <Flower2 size={15} />
                Consistência é voltar. Você não precisa ser perfeito.
              </footer>
            </>
          )}
          {view === "calendar" && (
            <CalendarView state={state} today={today} start={() => start()} />
          )}
          {view === "journey" && (
            <Journey
              state={state}
              today={today}
              assess={setAssessment}
              preview={setPreview}
            />
          )}
          {view === "progress" && (
            <Progress
              state={state}
              today={today}
              verified={verified}
              total={totalMinutes}
            />
          )}
          {view === "journal" && (
            <Journal state={state} setState={setState} notify={notify} />
          )}
          {view === "settings" && (
            <SettingsView
              state={state}
              setState={setState}
              notify={notify}
              reset={() => setConfirm("reset")}
              storageError={storageError}
              recoverStorage={() => setPersistenceBlocked(false)}
            />
          )}
        </main>
      </div>
      {state.active && !sessionOpen && (
        <button className="resume-pill" onClick={() => setSessionOpen(true)}>
          <Pause size={16} />
          {languages[state.active.lang].name} · sessão em pausa
          <ArrowRight size={16} />
        </button>
      )}
      {toast && (
        <div className="toast" role="status">
          <Leaf size={19} />
          <span>{toast}</span>
          <button
            className="icon-button"
            onClick={() => setToast("")}
            aria-label="Fechar aviso"
          >
            <X size={17} />
          </button>
        </div>
      )}
      {sessionOpen && state.active && (
        <SessionModal
          state={state}
          setState={setState}
          close={closeSession}
          finish={complete}
          discard={() => setConfirm("discard")}
          notify={notify}
        />
      )}
      {success && (
        <Modal title="Sessão registrada" onClose={() => setSuccess(null)}>
          <div className="success-content">
            <span className="success-icon">
              <Sprout size={38} />
            </span>
            <div className="eyebrow">UM PASSO QUE É SEU</div>
            <h2>
              Hoje você cultivou
              <br />
              um novo começo.
            </h2>
            <p>
              {formatMinutes(success.minutes)} minutos de{" "}
              {languages[success.lang].name.toLowerCase()} registrados.{" "}
              {success.completed === false
                ? "Você guardou o que coube hoje. O conteúdo continua disponível."
                : success.mini
                  ? "Cinco minutos também contam."
                  : "A revisão vai aparecer em outra noite desta mesma língua."}
            </p>
            <div className="success-note">
              <Heart size={18} />
              Suas conquistas ficam. Se faltar um dia, é só voltar no próximo.
            </div>
            <button
              className="button primary"
              onClick={() => {
                setSuccess(null);
                navigate("journal");
              }}
            >
              Ver meu registro
              <ArrowRight size={17} />
            </button>
            <button className="text-button" onClick={() => setSuccess(null)}>
              Voltar à minha rotina
            </button>
          </div>
        </Modal>
      )}
      {assessment && (
        <Modal
          title="Verificar aprendizado"
          onClose={() => setAssessment(null)}
        >
          <div className="eyebrow">
            <Target size={15} />
            LEMBRAR É DIFERENTE DE CONCLUIR
          </div>
          <h2>
            {
              plans[assessment.lang][assessment.month - 1].goals[
                assessment.goal
              ]
            }
          </h2>
          <LangBadge lang={assessment.lang} />
          <p className="assessment-prompt">
            {
              plans[assessment.lang][assessment.month - 1].checks[
                assessment.goal
              ]
            }
          </p>
          <p className="muted">
            Faça a tentativa antes de consultar o conteúdo. Uma meta é
            verificada com duas demonstrações em noites diferentes da mesma
            língua. O resultado é uma autoavaliação.
          </p>
          <div className="assessment-actions">
            <button
              className="button primary"
              onClick={() => {
                setState((s) => ({
                  ...s,
                  assessments: [
                    ...s.assessments,
                    { ...assessment, date: today, passed: true },
                  ],
                }));
                setAssessment(null);
                notify(
                  "Tentativa sem consulta registrada. Duas noites diferentes verificam esta meta.",
                );
              }}
            >
              Consegui sem consultar
              <Check size={17} />
            </button>
            <button
              className="button secondary"
              onClick={() => {
                setState((s) => ({
                  ...s,
                  assessments: [
                    ...s.assessments,
                    { ...assessment, date: today, passed: false },
                  ],
                }));
                setAssessment(null);
                notify(
                  "Tudo bem. Retome esse conteúdo em uma próxima noite da mesma língua.",
                );
              }}
            >
              Ainda preciso de apoio
            </button>
          </div>
        </Modal>
      )}
      {preview && (
        <Modal wide title={preview.title} onClose={() => setPreview(null)}>
          <div className="eyebrow">
            <BookOpen size={15} />
            CONTEÚDO PARA CONSULTA
          </div>
          <h2>{preview.title}</h2>
          <p>{preview.concept}</p>
          <WordList lesson={preview} notify={notify} />
          <div className="tip-box">
            <Lightbulb size={18} />
            <p>{preview.tip}</p>
          </div>
          <p className="muted small-text">
            Consultar não registra minutos nem verifica aprendizado. As sessões
            e revisões seguem uma língua por noite.
          </p>
        </Modal>
      )}
      {confirm && (
        <Modal
          title={confirm === "reset" ? "Apagar progresso" : "Encerrar sessão"}
          onClose={() => setConfirm(null)}
        >
          <h2>
            {confirm === "reset"
              ? "Apagar todo o progresso?"
              : "Encerrar sem registrar?"}
          </h2>
          <p>
            {confirm === "reset"
              ? "Isso apaga sessões, revisões e verificações deste navegador. Exporte uma cópia nos ajustes antes de continuar."
              : "O tempo e as tarefas desta sessão serão descartados. Você poderá começar novamente hoje."}
          </p>
          <div className="confirm-actions">
            <button
              className="button secondary"
              onClick={() => setConfirm(null)}
            >
              Cancelar
            </button>
            <button
              className="button danger"
              onClick={() => {
                if (confirm === "reset") {
                  setPersistenceBlocked(false);
                  setState({
                    ...state,
                    sessions: [],
                    reviews: [],
                    assessments: [],
                    active: null,
                  });
                  notify("Progresso apagado. Seus ajustes foram mantidos.");
                } else {
                  setState((s) => ({ ...s, active: null }));
                  setSessionOpen(false);
                }
                setConfirm(null);
              }}
            >
              {confirm === "reset" ? "Apagar progresso" : "Encerrar sessão"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function WeekStrip({
  state,
  today,
  onToday,
  onDay,
}: {
  state: AppState;
  today: string;
  onToday: () => void;
  onDay: () => void;
}) {
  const start = monday(
    today < firstStudyDay(state.settings.startDate)
      ? firstStudyDay(state.settings.startDate)
      : today,
  );
  return (
    <div className="week-strip">
      {shortDays.map((day, i) => {
        const date = addDays(start, i);
        const lang = schedule(date, state.settings.startDate);
        const done = state.sessions.find((s) => s.date === date);
        const isToday = date === today;
        return (
          <button
            key={day}
            className={`day-card ${isToday ? "is-today" : ""} ${i > 4 ? "day-free" : ""} ${done ? "is-done" : ""}`}
            onClick={isToday ? onToday : onDay}
            aria-label={`${day}, ${fmtDate(date)}: ${done ? "sessão realizada" : lang ? languages[lang].name : "livre"}`}
          >
            <div className="day-card-top">
              <span>{day}</span>
              <span>{isToday ? "Hoje" : parseDate(date).getDate()}</span>
            </div>
            {done ? (
              <span className="day-icon done">
                <Check size={21} />
              </span>
            ) : lang ? (
              <span className={`day-icon ${languages[lang].color}`}>
                {languages[lang].flag}
              </span>
            ) : (
              <span className="day-icon free">
                <Coffee size={22} />
              </span>
            )}
            <strong>
              {done
                ? languages[done.lang].name
                : lang
                  ? languages[lang].name
                  : "Livre"}
            </strong>
            <small>
              {done
                ? `${formatMinutes(done.minutes)} min · realizado`
                : lang
                  ? `${durationFor(date, state.settings)} min · ${state.settings.time.replace(":", "h")}`
                  : i > 4
                    ? "Tempo para você"
                    : "Sem sessão"}
            </small>
            {isToday && <span className="today-underline" />}
          </button>
        );
      })}
    </div>
  );
}
function MiniBars({ state, today }: { state: AppState; today: string }) {
  const dates = Array.from({ length: 7 }, (_, i) => addDays(monday(today), i));
  return (
    <div className="mini-bars">
      {dates.map((d, i) => {
        const s = state.sessions.find((s) => s.date === d);
        return (
          <div className="mini-bar-item" key={d}>
            <div className="bar-column">
              <div
                className={`bar-fill ${s ? languages[s.lang].color : ""}`}
                style={{
                  height: s ? `${Math.max(8, (s.minutes / 30) * 100)}%` : "4px",
                }}
              />
            </div>
            <span className={d === today ? "bar-today" : ""}>
              {["S", "T", "Q", "Q", "S", "S", "D"][i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>
          {title}
          <span>.</span>
        </h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
function CalendarView({
  state,
  today,
  start,
}: {
  state: AppState;
  today: string;
  start: () => void;
}) {
  const [month, setMonth] = useState(today.slice(0, 7) + "-01");
  const [selected, setSelected] = useState(today);
  const [cycle, setCycle] = useState(false);
  const first = monday(month);
  const days = Array.from({ length: 42 }, (_, i) => addDays(first, i));
  const chosen = state.sessions.find((s) => s.date === selected);
  const lang = schedule(selected, state.settings.startDate);
  return (
    <>
      <PageHeading
        eyebrow="CADA NOITE TEM SEU ESPAÇO"
        title="Um ritmo que cabe na vida"
        description="Uma língua por dia, de segunda a sexta. Sem compensar dias perdidos."
      />
      <div className="calendar-layout">
        <section className="card calendar-card">
          <div className="section-heading">
            <h2 className="capitalize">
              {fmtDate(month, { month: "long", year: "numeric" })}
            </h2>
            <div className="calendar-controls">
              <button
                className="text-button"
                onClick={() => {
                  setMonth(today.slice(0, 7) + "-01");
                  setSelected(today);
                }}
              >
                Hoje
              </button>
              <button
                className="icon-button"
                aria-label="Mês anterior"
                onClick={() => setMonth(addMonths(month, -1))}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="icon-button"
                aria-label="Próximo mês"
                onClick={() => setMonth(addMonths(month, 1))}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className="calendar-days-heading">
            {shortDays.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {days.map((date) => {
              const l = schedule(date, state.settings.startDate);
              const done = state.sessions.find((s) => s.date === date);
              const outside = date.slice(0, 7) !== month.slice(0, 7);
              return (
                <button
                  className={`calendar-cell ${outside ? "outside" : ""} ${date === today ? "today" : ""} ${date === selected ? "selected" : ""}`}
                  key={date}
                  onClick={() => setSelected(date)}
                  aria-label={`${fmtDate(date)}, ${done ? "realizado" : l ? languages[l].name : "livre"}`}
                  aria-pressed={date === selected}
                >
                  <span>{parseDate(date).getDate()}</span>
                  {done ? (
                    <span
                      className={`calendar-session ${languages[done.lang].color}`}
                    >
                      <Check size={13} />
                      <span>{languages[done.lang].name}</span>
                    </span>
                  ) : l ? (
                    <span className={`calendar-session ${languages[l].color}`}>
                      <span className="calendar-dot" />
                      <span>{languages[l].name}</span>
                    </span>
                  ) : (
                    <span className="calendar-free">Livre</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="calendar-legend">
            {LANGS.map((l) => (
              <span key={l}>
                <i className={languages[l].color} />
                {languages[l].name}
              </span>
            ))}
            <span>
              <CircleCheck size={14} />
              Realizado
            </span>
          </div>
        </section>
        <section className="card selected-day">
          <div className="eyebrow">
            {fmtDate(selected, { weekday: "long" })}
          </div>
          <h2>{fmtDate(selected)}</h2>
          {chosen ? (
            <>
              <LangBadge lang={chosen.lang} />
              <div className="selected-big-icon">
                <CircleCheck size={40} />
              </div>
              <h3>Um passo registrado</h3>
              <p>
                {formatMinutes(chosen.minutes)} minutos · {chosen.content}
              </p>
              <div className="tip-box">
                <Heart size={18} />
                <p>
                  {chosen.note ||
                    "Você reservou um tempo para aprender. Esse passo é seu."}
                </p>
              </div>
            </>
          ) : lang ? (
            <>
              <LangBadge lang={lang} />
              <div className="selected-big-icon">
                <Moon size={40} />
              </div>
              <h3>
                {state.settings.time.replace(":", "h")} ·{" "}
                {durationFor(selected, state.settings)} minutos
              </h3>
              <p>{currentLesson(lang, state, selected).title}</p>
              <p className="muted">
                Revisão curta, um conteúdo pequeno e prática ativa. Se faltar,
                siga no próximo dia.
              </p>
              {selected === today && (
                <button className="button primary" onClick={start}>
                  Começar
                  <ArrowRight size={17} />
                </button>
              )}
              {selected < today && (
                <p className="soft-message">
                  Essa noite passou. Nenhuma tarefa foi acumulada.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="selected-big-icon">
                <Coffee size={42} />
              </div>
              <h3>Espaço para viver</h3>
              <p>Não há atividades obrigatórias. Aproveite seu tempo livre.</p>
            </>
          )}
        </section>
      </div>
      <section className="card cycle-card">
        <button
          className="section-heading full-button"
          onClick={() => setCycle(!cycle)}
          aria-expanded={cycle}
        >
          <div>
            <h2>Seu ciclo de três semanas</h2>
            <p className="muted">
              Repetido ao longo de seis meses. As três línguas recebem o mesmo
              espaço.
            </p>
          </div>
          <ChevronDown size={20} className={cycle ? "rotated" : ""} />
        </button>
        {cycle && (
          <div className="cycle-table-wrap">
            <table className="cycle-table">
              <thead>
                <tr>
                  <th>Semana</th>
                  {shortDays.slice(0, 5).map((d) => (
                    <th key={d}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CYCLE.map((week, i) => (
                  <tr key={i}>
                    <th>{i + 1}</th>
                    {week.map((l, j) => (
                      <td key={j}>
                        <LangBadge lang={l} small />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
function Journey({
  state,
  today,
  assess,
  preview,
}: {
  state: AppState;
  today: string;
  assess: (a: { lang: Lang; month: number; goal: number }) => void;
  preview: (l: Lesson) => void;
}) {
  const [lang, setLang] = useState<Lang>("ja");
  const [month, setMonth] = useState(
    monthNumber(today, state.settings.startDate),
  );
  const plan = plans[lang][month - 1];
  const actual = schedule(today, state.settings.startDate);
  const allowed =
    nightTime() &&
    (actual === lang ||
      state.sessions.find((s) => s.date === today)?.lang === lang) &&
    (!state.active || state.active.lang === lang);
  return (
    <>
      <PageHeading
        eyebrow="SEIS MESES, MUITOS PEQUENOS PASSOS"
        title="Sua jornada começa nas bases"
        description="Um plano possível para iniciantes. Sem promessa de fluência, com aprendizado que dá para perceber."
      />
      <div
        className="tabs language-tabs"
        role="tablist"
        aria-label="Língua do plano"
      >
        {LANGS.map((l) => (
          <button
            role="tab"
            aria-selected={lang === l}
            key={l}
            className={lang === l ? "selected" : ""}
            onClick={() => setLang(l)}
          >
            <span>{languages[l].flag}</span>
            {languages[l].name}
            <span className="tab-native">{languages[l].native}</span>
          </button>
        ))}
      </div>
      <div className="month-timeline">
        {plans[lang].map((_, i) => (
          <button
            key={i}
            className={`${month === i + 1 ? "selected" : ""} ${i + 1 === monthNumber(today, state.settings.startDate) ? "current" : ""}`}
            onClick={() => setMonth(i + 1)}
          >
            <span>
              {i + 1 === monthNumber(today, state.settings.startDate) ? (
                <Sprout size={17} />
              ) : (
                <span>{i + 1}</span>
              )}
            </span>
            <strong>Mês {i + 1}</strong>
            <small>
              {fmtDate(addMonths(state.settings.startDate, i), {
                month: "short",
              })}
            </small>
          </button>
        ))}
      </div>
      <section className="card month-plan">
        <div className="month-plan-heading">
          <div>
            <div className="eyebrow">
              MÊS {month} ·{" "}
              {fmtDate(addMonths(state.settings.startDate, month - 1))} A{" "}
              {fmtDate(addDays(addMonths(state.settings.startDate, month), -1))}
            </div>
            <h2>{plan.title}</h2>
            <p>{plan.focus}</p>
          </div>
          <span className={`plan-symbol ${languages[lang].color}`}>
            <Sprout size={35} />
          </span>
        </div>
        <div className="plan-columns">
          <div>
            <h3>
              <Target size={18} />
              Duas metas pequenas
            </h3>
            {plan.goals.map((goal, g) => {
              const achieved = verifiedGoal(state, lang, month, g);
              const count = goalEvidence(state, lang, month, g);
              return (
                <div className="goal-row" key={goal}>
                  <span className={achieved ? "goal-check done" : "goal-check"}>
                    {achieved ? <Check size={17} /> : g + 1}
                  </span>
                  <div>
                    <strong>{goal}</strong>
                    <p>
                      {achieved
                        ? "Verificada em duas noites diferentes"
                        : `${Math.min(count, 2)}/2 demonstrações sem consulta`}
                    </p>
                    <button
                      className="text-button"
                      disabled={!allowed}
                      onClick={() => assess({ lang, month, goal: g })}
                    >
                      {achieved
                        ? "Verificar novamente"
                        : "Fazer uma verificação"}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            {!allowed && (
              <p className="small-text muted">
                Verificações ficam disponíveis à noite, em um dia de{" "}
                {languages[lang].name.toLowerCase()}. Assim, você mantém uma
                língua por dia.
              </p>
            )}
          </div>
          <div className="learning-note">
            <Lightbulb size={23} />
            <h3>Concluir não é o mesmo que aprender.</h3>
            <p>
              Uma sessão registra seu tempo e esforço. Uma verificação mostra o
              que você consegue lembrar e usar sem consultar.
            </p>
            <p>
              Faça o exercício curto e volte em outra noite da mesma língua.
              Duas tentativas independentes verificam a meta.
            </p>
          </div>
        </div>
        <div className="plan-lessons">
          <h3>
            <BookOpen size={18} />
            Conteúdo para suas noites
          </h3>
          <div>
            {lessons[lang].slice(...plan.range).map((l) => (
              <button key={l.id} onClick={() => preview(l)}>
                <span>
                  {state.sessions.some(
                    (s) =>
                      s.lessonId === l.id && !s.mini && s.completed !== false,
                  ) ? (
                    <Check size={17} />
                  ) : (
                    <BookOpen size={17} />
                  )}
                </span>
                <strong>{l.title}</strong>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        </div>
      </section>
      <div className="info-line">
        <Leaf size={17} />O mês orienta o ritmo, não cria uma corrida. O
        conteúdo anterior segue disponível se você precisar de mais tempo.
      </div>
    </>
  );
}
function Progress({
  state,
  today,
  total,
  verified,
}: {
  state: AppState;
  today: string;
  total: number;
  verified: number;
}) {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [anchor, setAnchor] = useState(today);
  const start = period === "week" ? monday(anchor) : anchor.slice(0, 7) + "-01";
  const end =
    period === "week" ? addDays(start, 6) : addDays(addMonths(start, 1), -1);
  const sessions = state.sessions.filter(
    (s) => s.date >= start && s.date <= end,
  );
  const minutes = sessions.reduce((n, s) => n + s.minutes, 0);
  const displayDays = Array.from(
    { length: period === "week" ? 7 : daysBetween(start, end) + 1 },
    (_, i) => addDays(start, i),
  );
  return (
    <>
      <PageHeading
        eyebrow="O QUE VOCÊ CULTIVOU ATÉ AQUI"
        title="Seu progresso tem muitas formas"
        description="Seu histórico continua com você. Uma pausa não zera suas conquistas."
      />
      <div className="stats-grid">
        <Stat
          icon={<Clock3 size={22} />}
          value={formatMinutes(total)}
          unit="min"
          label="de tempo investido"
        />
        <Stat
          icon={<Moon size={22} />}
          value={String(state.sessions.length)}
          unit="noites"
          label="em que você estudou"
        />
        <Stat
          icon={<Target size={22} />}
          value={String(verified)}
          unit="/ 36"
          label="metas verificadas sem consulta"
        />
      </div>
      <section className="card progress-chart-card">
        <div className="section-heading">
          <div>
            <h2>Minutos no seu ritmo</h2>
            <p className="muted">Tempo real de estudo, sem contar pausas.</p>
          </div>
          <div className="segmented">
            <button
              className={period === "week" ? "selected" : ""}
              onClick={() => setPeriod("week")}
            >
              Semana
            </button>
            <button
              className={period === "month" ? "selected" : ""}
              onClick={() => setPeriod("month")}
            >
              Mês
            </button>
          </div>
        </div>
        <div className="period-controls">
          <button
            className="icon-button"
            aria-label="Período anterior"
            onClick={() =>
              setAnchor(
                period === "week" ? addDays(anchor, -7) : addMonths(anchor, -1),
              )
            }
          >
            <ChevronLeft size={19} />
          </button>
          <strong>
            {period === "week"
              ? `${fmtDate(start, { day: "numeric", month: "short" })} — ${fmtDate(end, { day: "numeric", month: "short", year: "numeric" })}`
              : fmtDate(start, { month: "long", year: "numeric" })}
          </strong>
          <button
            className="icon-button"
            aria-label="Próximo período"
            onClick={() =>
              setAnchor(
                period === "week" ? addDays(anchor, 7) : addMonths(anchor, 1),
              )
            }
          >
            <ChevronRight size={19} />
          </button>
          <button className="text-button" onClick={() => setAnchor(today)}>
            Atual
          </button>
        </div>
        <div
          className={`large-chart ${period === "month" ? "monthly-chart" : ""}`}
          role="img"
          aria-label={`${formatMinutes(minutes)} minutos de estudo no período`}
        >
          <div className="chart-axis">
            <span>30 min</span>
            <span>20 min</span>
            <span>10 min</span>
            <span>0</span>
          </div>
          <div className="chart-data">
            {displayDays.map((d, i) => {
              const s = sessions.find((x) => x.date === d);
              return (
                <div className="chart-column" key={d}>
                  <div
                    className="chart-bar-space"
                    title={`${fmtDate(d)}: ${s ? `${formatMinutes(s.minutes)} min de ${languages[s.lang].name}` : "sem sessão"}`}
                  >
                    <div
                      className={`chart-bar ${s ? languages[s.lang].color : ""}`}
                      style={{
                        height: s ? `${(s.minutes / 30) * 100}%` : "2px",
                      }}
                    />
                  </div>
                  <span>
                    {period === "week" ? shortDays[i] : parseDate(d).getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="chart-language-totals">
          {LANGS.map((l) => (
            <div key={l}>
              <LangBadge lang={l} small />
              <strong>
                {formatMinutes(
                  sessions
                    .filter((s) => s.lang === l)
                    .reduce((n, s) => n + s.minutes, 0),
                )}
                <span> min</span>
              </strong>
            </div>
          ))}
        </div>
        {!sessions.length && (
          <p className="soft-message">
            Um espaço esperando seus primeiros passos. Comece com o que couber
            hoje.
          </p>
        )}
      </section>
      <div className="home-bottom-grid">
        <section className="card">
          <h2>Atividade e aprendizado</h2>
          <div className="learning-metric">
            <span className="soft-icon">
              <CircleCheck size={19} />
            </span>
            <div>
              <strong>{state.sessions.length} atividades registradas</strong>
              <p>Você dedicou tempo, mesmo quando precisou de apoio.</p>
            </div>
          </div>
          <div className="learning-metric">
            <span className="soft-icon">
              <Target size={19} />
            </span>
            <div>
              <strong>{verified} metas verificadas</strong>
              <p>Duas demonstrações sem consulta em noites diferentes.</p>
            </div>
          </div>
        </section>
        <section className="card warm-note">
          <Flower2 size={28} />
          <h2>A constância não é uma sequência perfeita.</h2>
          <p>
            É encontrar seu caminho de volta. Nenhum contador é zerado por
            faltar. Não há tarefas para recuperar.
          </p>
        </section>
      </div>
    </>
  );
}
function Stat({
  icon,
  value,
  unit,
  label,
}: {
  icon: ReactNode;
  value: string;
  unit: string;
  label: string;
}) {
  return (
    <section className="card stat">
      <span className="soft-icon">{icon}</span>
      <div>
        <strong>
          {value}
          <span>{unit}</span>
        </strong>
        <p>{label}</p>
      </div>
    </section>
  );
}
function Journal({
  state,
  setState,
  notify,
}: {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  notify: (m: string) => void;
}) {
  const [filter, setFilter] = useState<Lang | "all">("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const sessions = [...state.sessions]
    .reverse()
    .filter((s) => filter === "all" || s.lang === filter);
  return (
    <>
      <PageHeading
        eyebrow="MEMÓRIAS DO SEU CAMINHO"
        title="Seu caderno de estudos"
        description="O que estudou, como se sentiu e o que vale revisitar. Tudo em um lugar."
      />
      <div className="filter-row">
        <button
          className={filter === "all" ? "selected" : ""}
          onClick={() => setFilter("all")}
        >
          Todas as línguas
        </button>
        {LANGS.map((l) => (
          <button
            key={l}
            className={filter === l ? "selected" : ""}
            onClick={() => setFilter(l)}
          >
            {languages[l].flag} {languages[l].name}
          </button>
        ))}
      </div>
      {!sessions.length ? (
        <section className="card empty-state">
          <span className="empty-icon">
            <BookOpen size={37} />
          </span>
          <h2>Uma página em branco, cheia de possibilidades.</h2>
          <p>
            Seu primeiro registro aparecerá aqui ao concluir uma sessão.
            <br />
            Uma palavra nova já é um começo.
          </p>
        </section>
      ) : (
        <div className="journal-list">
          {sessions.map((s) => (
            <article key={s.id} className="card journal-entry">
              <div className="section-heading">
                <LangBadge lang={s.lang} />
                <span className="muted small-text">
                  {fmtDate(s.date, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h2>{s.content}</h2>
              <div className="entry-meta">
                <span>
                  <Clock3 size={15} />
                  {formatMinutes(s.minutes)} minutos reais
                </span>
                <span>
                  {s.mini
                    ? "Versão de 5 minutos"
                    : "Sessão de " + s.target + " minutos"}
                </span>
                <span className="difficulty-pill">
                  {s.difficulty === "easy"
                    ? "Leve"
                    : s.difficulty === "okay"
                      ? "Na medida"
                      : "Desafiador"}
                </span>
                {s.optional && <span>Prática opcional</span>}
                {s.completed === false && (
                  <span>Etapas parcialmente praticadas</span>
                )}
              </div>
              <div className="recall-note">
                <Target size={16} />
                {s.recall === "independent"
                  ? "Lembrei e usei sem consultar"
                  : s.recall === "help"
                    ? "Consegui com um pouco de apoio"
                    : "Quero praticar novamente"}
                <span>· autoavaliação desta sessão</span>
              </div>
              {editing === s.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setState((old) => ({
                      ...old,
                      sessions: old.sessions.map((x) =>
                        x.id === s.id ? { ...x, note: note.trim() } : x,
                      ),
                    }));
                    setEditing(null);
                    notify("Anotação atualizada.");
                  }}
                >
                  <label className="field-label" htmlFor={`note-${s.id}`}>
                    Sua anotação
                  </label>
                  <textarea
                    id={`note-${s.id}`}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={1000}
                    rows={3}
                  />
                  <div className="confirm-actions">
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setEditing(null)}
                    >
                      Cancelar
                    </button>
                    <button className="button primary" type="submit">
                      Salvar anotação
                      <Check size={16} />
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {s.note && <p className="journal-note">“{s.note}”</p>}
                  <button
                    className="text-button"
                    onClick={() => {
                      setEditing(s.id);
                      setNote(s.note);
                    }}
                  >
                    {s.note ? "Editar anotação" : "Adicionar uma anotação"}
                    <Plus size={14} />
                  </button>
                </>
              )}
            </article>
          ))}
        </div>
      )}
      <section className="card review-card">
        <div className="section-heading">
          <h2>
            <RotateCcw size={19} />
            Revisões espaçadas
          </h2>
          <span className="count-chip">Até 2 conteúdos por sessão</span>
        </div>
        <p className="muted">
          Intervalos de 1, 3, 7, 14 e 30 dias, ajustados para a próxima noite da
          mesma língua. Se precisar de apoio, a revisão volta mais cedo. Você
          não precisa recuperar uma fila de tarefas.
        </p>
        {state.reviews.length ? (
          <div className="review-list">
            {state.reviews.map((r) => (
              <div key={r.id}>
                <LangBadge lang={r.lang} small />
                <strong>{r.content}</strong>
                <span>
                  {r.due >= addMonths(state.settings.startDate, 6)
                    ? "Após o plano"
                    : `A partir de ${fmtDate(r.due)}`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="soft-message">
            As primeiras revisões são preparadas depois de uma sessão completa.
          </div>
        )}
      </section>
    </>
  );
}
function SettingsView({
  state,
  setState,
  notify,
  reset,
  storageError,
  recoverStorage,
}: {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  notify: (m: string) => void;
  reset: () => void;
  storageError: string;
  recoverStorage: () => void;
}) {
  const [form, setForm] = useState<Settings>(state.settings);
  const importRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<AppState | null>(null);
  const download = () => {
    try {
      const content = storageError
        ? (localStorage.getItem(STORAGE_KEY) ?? JSON.stringify(state))
        : JSON.stringify(state, null, 2);
      const url = URL.createObjectURL(
        new Blob([content], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `passo-progresso-${todayKey()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify("Cópia exportada. Guarde esse arquivo em um lugar seguro.");
    } catch {
      notify("Não foi possível exportar o arquivo neste navegador.");
    }
  };
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.time < "18:00" || form.time > "23:59") {
      notify("Escolha um horário à noite, entre 18h e 23h59.");
      return;
    }
    if (state.active) {
      notify(
        "Encerre ou conclua a sessão em andamento antes de alterar sua rotina.",
      );
      return;
    }
    setState((s) => ({
      ...s,
      settings: form,
      reviews: s.reviews.map((r) => ({
        ...r,
        due:
          nextDayForLanguage(r.due, r.lang, form.startDate) ??
          addMonths(form.startDate, 6),
      })),
    }));
    notify("Sua rotina foi ajustada. Seu histórico continua com você.");
  };
  return (
    <>
      <PageHeading
        eyebrow="SUA ROTINA, SUAS ESCOLHAS"
        title="Faça caber no seu dia"
        description="Pequenos ajustes para uma rotina possível. Suas conquistas são preservadas."
      />
      <div className="settings-layout">
        <form className="card settings-card" onSubmit={save}>
          <h2>
            <Settings2 size={21} />
            Sua rotina
          </h2>
          <label className="field-label" htmlFor="start-date">
            Data de início
          </label>
          <input
            id="start-date"
            type="date"
            min="2000-01-01"
            max="2100-12-31"
            required
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <p className="field-help">
            Se começar no fim de semana, a primeira noite será na segunda-feira.
            Alterar a data reorganiza o plano, sem apagar registros.
          </p>
          <label className="field-label" htmlFor="start-time">
            Seu horário à noite
          </label>
          <div className="input-icon">
            <Moon size={18} />
            <input
              id="start-time"
              type="time"
              min="18:00"
              max="23:59"
              required
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </div>
          <p className="field-help">
            Horário de Brasília ({TIMEZONE}). Você pode começar em qualquer
            horário entre 18h e 23h59; este é seu horário de referência.
          </p>
          <label className="field-label" htmlFor="duration">
            Duração após as primeiras duas semanas
          </label>
          <select
            id="duration"
            value={form.duration}
            onChange={(e) =>
              setForm({
                ...form,
                duration: Number(e.target.value) as Settings["duration"],
              })
            }
          >
            <option value="20">20 minutos · manter leve</option>
            <option value="25">25 minutos · um pouco mais</option>
            <option value="30">30 minutos · quando houver disposição</option>
          </select>
          <div className="tip-box">
            <Leaf size={18} />
            <p>
              Nas duas primeiras semanas, suas sessões têm 20 minutos. A versão
              de 5 minutos está sempre disponível, sem obrigação de recuperar
              tempo.
            </p>
          </div>
          <button type="submit" className="button primary">
            Salvar meus ajustes
            <Check size={17} />
          </button>
        </form>
        <div className="settings-side">
          <section className="card">
            <span className="soft-icon">
              <Heart size={22} />
            </span>
            <h2>Algumas coisas já estão cuidadas.</h2>
            <ul className="check-list">
              <li>
                <Check size={16} />
                Uma língua por noite, inclusive nas revisões
              </li>
              <li>
                <Check size={16} />
                Sábado e domingo livres
              </li>
              <li>
                <Check size={16} />
                Sem tarefas acumuladas
              </li>
              <li>
                <Check size={16} />
                Conquistas preservadas quando você faltar
              </li>
            </ul>
          </section>
          <section className="card backup-card">
            <h2>
              <ArrowDownToLine size={21} />
              Seu progresso, com você
            </h2>
            <p className="muted">
              Os dados ficam neste navegador e neste dispositivo. Limpar os
              dados do site pode apagá-los. Não há conta nem sincronização na
              nuvem.
            </p>
            <div className="backup-actions">
              <button className="button secondary" onClick={download}>
                <ArrowDownToLine size={16} />
                Exportar cópia
              </button>
              <button
                className="button secondary"
                onClick={() => importRef.current?.click()}
              >
                Importar cópia
              </button>
            </div>
            <input
              ref={importRef}
              hidden
              type="file"
              accept="application/json,.json"
              aria-label="Importar progresso"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  if (file.size > 5_000_000) throw new Error();
                  const parsed: unknown = JSON.parse(await file.text());
                  if (!validateState(parsed)) throw new Error();
                  setPendingImport({
                    ...parsed,
                    active: parsed.active
                      ? { ...parsed.active, running: false }
                      : null,
                  });
                } catch {
                  notify(
                    "Essa cópia não é um arquivo válido do Passo. Seus dados atuais foram mantidos.",
                  );
                }
                e.target.value = "";
              }}
            />
            <button className="text-button danger-text" onClick={reset}>
              Apagar progresso deste navegador
            </button>
          </section>
          <section className="card limitations">
            <h3>
              <Headphones size={18} />
              Áudio e lembretes
            </h3>
            <p>
              O áudio usa as vozes instaladas no aparelho. Só ativamos uma voz
              compatível com a língua escolhida. A disponibilidade e a pronúncia
              variam.
            </p>
            <p>
              O horário é uma referência visual. Esta versão não envia
              notificações; você pode criar um lembrete no celular.
            </p>
          </section>
        </div>
      </div>
      {pendingImport && (
        <Modal
          title="Importar progresso"
          onClose={() => setPendingImport(null)}
        >
          <h2>Substituir pelo progresso da cópia?</h2>
          <p>
            A cópia tem {pendingImport.sessions.length} sessões. Ela substituirá
            os dados atuais deste navegador. Exporte os dados atuais antes se
            quiser preservá-los.
          </p>
          <div className="confirm-actions">
            <button
              className="button secondary"
              onClick={() => setPendingImport(null)}
            >
              Cancelar
            </button>
            <button
              className="button primary"
              onClick={() => {
                if (state.active) {
                  notify(
                    "Encerre a sessão em andamento antes de importar outra cópia.",
                  );
                  return;
                }
                setState(pendingImport);
                recoverStorage();
                setForm(pendingImport.settings);
                setPendingImport(null);
                notify(
                  "Cópia importada. Seu progresso está disponível neste navegador.",
                );
              }}
            >
              Importar e substituir
              <Check size={16} />
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function WordList({
  lesson,
  notify,
  words = lesson.words,
  hide = false,
}: {
  lesson: Lesson;
  notify: (m: string) => void;
  words?: Lesson["words"];
  hide?: boolean;
}) {
  const lang = lesson.id.split("-")[0] as Lang;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState("");
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const update = () => setVoices(window.speechSynthesis.getVoices());
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);
  const voice = voices.find((v) =>
    v.lang
      .toLowerCase()
      .startsWith(lang === "ja" ? "ja" : lang === "ko" ? "ko" : "fr"),
  );
  const speak = (text: string) => {
    if (!voice) {
      notify(
        `Não há uma voz de ${languages[lang].name.toLowerCase()} instalada neste aparelho. A leitura e a prática escrita continuam disponíveis.`,
      );
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = languages[lang].locale;
    u.voice = voice;
    u.rate = 0.75;
    u.onend = () => setSpeaking("");
    u.onerror = () => {
      setSpeaking("");
      notify(
        "O áudio não pôde ser reproduzido. Confira as vozes disponíveis no aparelho.",
      );
    };
    setSpeaking(text);
    window.speechSynthesis.speak(u);
  };
  return (
    <div className={`word-list ${hide ? "words-hidden" : ""}`}>
      {words.map((w, i) => (
        <div className="word-row" key={`${w.text}-${i}`}>
          <span className="word-index">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <strong>{hide ? "••••••" : w.text}</strong>
            {!hide && w.reading && <small>{w.reading}</small>}
          </div>
          <span className="word-meaning">{w.meaning}</span>
          <button
            className={`icon-button audio-button ${speaking === w.text ? "playing" : ""}`}
            disabled={hide || !voice}
            title={
              voice
                ? "Ouvir pronúncia"
                : "Voz desta língua indisponível neste aparelho"
            }
            aria-label={`Ouvir ${w.text}`}
            onClick={() => speak(w.text)}
          >
            <Volume2 size={18} />
          </button>
        </div>
      ))}
      {!voice && (
        <p className="small-text muted audio-hint">
          <Volume2 size={14} />
          Áudio indisponível: nenhuma voz desta língua instalada. Você pode
          praticar lendo e escrevendo.
        </p>
      )}
    </div>
  );
}
function SessionModal({
  state,
  setState,
  close,
  finish,
  discard,
  notify,
}: {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  close: () => void;
  finish: (
    details: Pick<Session, "content" | "difficulty" | "note" | "recall">,
  ) => void;
  discard: () => void;
  notify: (m: string) => void;
}) {
  const active = state.active!;
  const lang = active.lang;
  const lesson = lessons[lang].find((l) => l.id === active.lessonId)!;
  const [step, setStep] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [answer, setAnswer] = useState(false);
  const [logging, setLogging] = useState(false);
  const [content, setContent] = useState(lesson.title);
  const [difficulty, setDifficulty] = useState<Session["difficulty"]>("okay");
  const [note, setNote] = useState("");
  const [recall, setRecall] = useState<Recall | null>(null);
  const mini = active.duration === 5;
  const times = portions(active.duration);
  const tasks = mini
    ? ["Uma revisão bem curtinha", "Uma pequena prática"]
    : [
        "Revisar o que já conhece",
        "Aprender um pedacinho novo",
        "Praticar sem consultar",
      ];
  const reviews = state.reviews.filter((r) => active.reviewIds.includes(r.id));
  const previous = [...state.sessions].reverse().find((s) => s.lang === lang);
  const reviewLessons = reviews
    .map((r) => lessons[lang].find((l) => l.id === r.lessonId)!)
    .filter(Boolean);
  const revision = reviewLessons.length
    ? reviewLessons
    : [lessons[lang].find((l) => l.id === previous?.lessonId) ?? lesson];
  const words = revision
    .flatMap((l) => l.words.slice(0, reviewLessons.length > 1 ? 3 : 5))
    .slice(0, 5);
  const remaining = Math.ceil(active.remaining);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const toggle = () => {
    if (!nightTime() || active.date !== todayKey()) {
      notify(
        "Esta sessão só pode continuar na noite em que começou, no horário de Brasília. Você pode registrar o tempo já estudado ou encerrar sem registrar.",
      );
      return;
    }
    if (active.remaining <= 0) {
      notify(
        "O tempo terminou. Marque as tarefas praticadas e registre sua sessão.",
      );
      return;
    }
    setState((s) => ({
      ...s,
      active: s.active ? { ...s.active, running: !s.active.running } : null,
    }));
  };
  const updateCheck = (i: number) =>
    setState((s) => ({
      ...s,
      active: s.active
        ? {
            ...s.active,
            checked: s.active.checked.map((x, j) => (j === i ? !x : x)),
          }
        : null,
    }));
  const isPractice = step === tasks.length - 1;
  return (
    <Modal wide title={`Sessão de ${languages[lang].name}`} onClose={close}>
      <div className="session-header">
        <div className="eyebrow">
          {mini ? "UM PASSO DE CINCO MINUTOS" : "SEU MOMENTO DE APRENDER"}
        </div>
        <LangBadge lang={lang} />
      </div>
      <h2 className="session-title">
        {logging ? "Guarde o seu passo." : lesson.title}
      </h2>
      {!mini && !logging && (
        <div className="session-lesson-picker">
          <label htmlFor="session-lesson">Conteúdo desta noite</label>
          <select
            id="session-lesson"
            value={active.lessonId}
            onChange={(e) => {
              const id = e.target.value;
              setState((s) =>
                s.active
                  ? {
                      ...s,
                      active: {
                        ...s.active,
                        lessonId: id,
                        checked: [false, false, false],
                      },
                    }
                  : s,
              );
              setContent(lessons[lang].find((l) => l.id === id)!.title);
              setStep(0);
              setHidden(false);
              setAnswer(false);
            }}
          >
            {lessons[lang]
              .slice(
                0,
                plans[lang][
                  monthNumber(active.date, state.settings.startDate) - 1
                ].range[1],
              )
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
          </select>
          <span>
            Você pode repetir uma atividade. A língua continua a mesma.
          </span>
        </div>
      )}
      <div className="session-layout">
        <aside className="session-timer-panel">
          <div
            className="timer-ring"
            style={{
              background: `conic-gradient(#42765e ${((active.duration * 60 - active.remaining) / (active.duration * 60)) * 360}deg, #e0e9de 0deg)`,
            }}
          >
            <div>
              <span className="timer-caption">
                {active.remaining <= 0
                  ? "TEMPO CONCLUÍDO"
                  : active.running
                    ? "UM PASSO POR VEZ"
                    : "EM PAUSA"}
              </span>
              <strong aria-label="Tempo restante" role="timer">
                {mm}
                <span>:</span>
                {ss}
              </strong>
              <span>{active.duration} minutos para você</span>
            </div>
          </div>
          <button
            className="button secondary timer-toggle"
            onClick={toggle}
            disabled={logging || active.remaining <= 0}
          >
            {active.running ? <Pause size={17} /> : <Play size={17} />}{" "}
            {active.running ? "Pausar" : "Continuar"}
          </button>
          <p className="timer-helper">
            Pausas não contam como tempo de estudo. Ao fechar, a sessão fica em
            pausa.
          </p>
          {active.optional && (
            <p className="soft-message">
              Prática opcional. Seu fim de semana continua livre.
            </p>
          )}
          <div className="session-task-list">
            {tasks.map((task, i) => (
              <div key={task} className={step === i ? "selected" : ""}>
                <button
                  className={`task-checkbox ${active.checked[i] ? "checked" : ""}`}
                  aria-label={`Marcar ${task}`}
                  aria-pressed={active.checked[i]}
                  onClick={() => updateCheck(i)}
                >
                  {active.checked[i] ? <Check size={15} /> : i + 1}
                </button>
                <button
                  className="task-name"
                  onClick={() => {
                    setStep(i);
                    setHidden(false);
                    setAnswer(false);
                    setLogging(false);
                  }}
                >
                  <strong>{task}</strong>
                  <span>{times[i]} minutos</span>
                </button>
              </div>
            ))}
          </div>
          <button className="text-button discard-button" onClick={discard}>
            Encerrar sem registrar
          </button>
        </aside>
        <div className="session-content">
          {logging ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (recall)
                  finish({
                    content: content.trim() || lesson.title,
                    difficulty,
                    note: note.trim(),
                    recall,
                  });
              }}
            >
              <div className="eyebrow">
                TEMPO REAL:{" "}
                {formatMinutes(
                  Math.round(
                    ((active.duration * 60 - active.remaining) / 60) * 100,
                  ) / 100,
                )}{" "}
                MIN
              </div>
              <label className="field-label" htmlFor="studied-content">
                O que você estudou?
              </label>
              <input
                id="studied-content"
                required
                maxLength={150}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <label className="field-label">Como foi a dificuldade?</label>
              <div className="choice-row">
                {(["easy", "okay", "hard"] as const).map((d) => (
                  <button
                    type="button"
                    key={d}
                    className={difficulty === d ? "selected" : ""}
                    onClick={() => setDifficulty(d)}
                  >
                    {d === "easy"
                      ? "Leve"
                      : d === "okay"
                        ? "Na medida"
                        : "Desafiador"}
                  </button>
                ))}
              </div>
              <label className="field-label">Na prática sem consultar…</label>
              <div className="recall-choices">
                {(["independent", "help", "again"] as const).map((r) => (
                  <button
                    type="button"
                    className={recall === r ? "selected" : ""}
                    key={r}
                    onClick={() => setRecall(r)}
                  >
                    <span>{recall === r ? <Check size={15} /> : <span />}</span>
                    {r === "independent"
                      ? "Lembrei e usei sozinho(a)"
                      : r === "help"
                        ? "Precisei de um pouco de apoio"
                        : "Quero tentar de novo em outra noite"}
                  </button>
                ))}
              </div>
              <p className="field-help">
                Isso orienta a próxima revisão. Qualquer resultado pode ser
                registrado; as metas mensais têm suas próprias verificações.
              </p>
              <label className="field-label" htmlFor="session-note">
                Uma anotação, se quiser <span>(opcional)</span>
              </label>
              <textarea
                id="session-note"
                maxLength={1000}
                rows={3}
                placeholder="O que ficou mais fácil? O que gostaria de rever?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="session-bottom">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setLogging(false)}
                >
                  <ArrowLeft size={16} />
                  Voltar à prática
                </button>
                <button
                  type="submit"
                  className="button primary"
                  disabled={!recall}
                >
                  Salvar meu passo
                  <Check size={17} />
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="task-heading">
                <span className="task-step">
                  {String(step + 1).padStart(2, "0")} /{" "}
                  {String(tasks.length).padStart(2, "0")}
                </span>
                <span>
                  <Clock3 size={14} />
                  {times[step]} minutos sugeridos
                </span>
              </div>
              <h3>{tasks[step]}</h3>
              {step === 0 ? (
                <>
                  <p>
                    {previous || reviews.length
                      ? "Revise estas cinco palavras. Leia uma vez, esconda a escrita e tente lembrar a partir do significado."
                      : "Esta é sua primeira noite nesta língua. Conheça estas cinco expressões ou símbolos. Depois esconda a escrita e tente lembrar dois."}
                  </p>
                  {reviews.map((r) => (
                    <span key={r.id} className="review-content-tag">
                      <RotateCcw size={13} />
                      {r.content}
                    </span>
                  ))}
                  <button
                    className="text-button hide-button"
                    onClick={() => setHidden(!hidden)}
                  >
                    {hidden
                      ? "Mostrar palavras"
                      : "Esconder para tentar lembrar"}
                    <RotateCcw size={14} />
                  </button>
                  <WordList
                    lesson={revision[0]}
                    words={words}
                    hide={hidden}
                    notify={notify}
                  />
                </>
              ) : isPractice ? (
                <>
                  <p>
                    {mini
                      ? "Escolha duas das palavras da revisão. Tente dizer ou escrever cada uma a partir do significado, sem consultar."
                      : lesson.prompt}
                  </p>
                  <div className="practice-card">
                    <span className="soft-icon">
                      <Sparkles size={22} />
                    </span>
                    <h4>Primeiro tente. Depois confira.</h4>
                    <p>
                      Fale em voz alta ou escreva em um papel. Não precisa
                      acertar tudo.
                    </p>
                    <button
                      className="button secondary"
                      onClick={() => setAnswer(!answer)}
                    >
                      {answer
                        ? "Esconder resposta"
                        : "Conferir uma resposta possível"}
                      <ChevronDown size={16} />
                    </button>
                    {answer && (
                      <p className="practice-answer">
                        {mini
                          ? words
                              .slice(0, 2)
                              .map(
                                (w) =>
                                  `${w.text}${w.reading ? ` (${w.reading})` : ""} = ${w.meaning}`,
                              )
                              .join(" · ")
                          : lesson.answer}
                      </p>
                    )}
                  </div>
                  <div className="tip-box">
                    <Lightbulb size={18} />
                    <p>
                      {mini
                        ? "Lembrar uma parte já conta. Escolha um item para revisitar na próxima noite desta língua."
                        : lesson.tip}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p>{lesson.concept}</p>
                  <WordList lesson={lesson} notify={notify} />
                  <div className="tip-box">
                    <Lightbulb size={18} />
                    <p>{lesson.tip}</p>
                  </div>
                  <p className="small-text muted">
                    Se o grupo estiver grande, escolha dois ou três itens. Você
                    pode repetir o conteúdo em outra noite desta língua.
                  </p>
                </>
              )}
              <div className="task-complete">
                <button
                  className={`task-checkbox ${active.checked[step] ? "checked" : ""}`}
                  aria-pressed={active.checked[step]}
                  onClick={() => updateCheck(step)}
                  aria-label="Marcar esta etapa como praticada"
                >
                  {active.checked[step] ? <Check size={15} /> : null}
                </button>
                <span>
                  Pratiquei esta etapa{" "}
                  <small>(mesmo que tenha precisado de apoio)</small>
                </span>
              </div>
              <div className="session-bottom">
                <button
                  className="text-button"
                  disabled={step === 0}
                  onClick={() => {
                    setStep(step - 1);
                    setHidden(false);
                    setAnswer(false);
                  }}
                >
                  <ArrowLeft size={16} />
                  Anterior
                </button>
                {step < tasks.length - 1 ? (
                  <button
                    className="button primary"
                    onClick={() => {
                      setStep(step + 1);
                      setHidden(false);
                      setAnswer(false);
                    }}
                  >
                    Próxima etapa
                    <ArrowRight size={17} />
                  </button>
                ) : (
                  <button
                    className="button primary"
                    disabled={!active.checked.some(Boolean)}
                    onClick={() => {
                      setState((s) =>
                        s.active
                          ? { ...s, active: { ...s.active, running: false } }
                          : s,
                      );
                      setLogging(true);
                    }}
                  >
                    {active.checked.every(Boolean)
                      ? "Registrar sessão"
                      : "Registrar o que consegui"}
                    <Check size={17} />
                  </button>
                )}
              </div>
              {isPractice && !active.checked.every(Boolean) && (
                <p className="small-text muted">
                  Marque as etapas que praticou para registrar a sessão.
                </p>
              )}
              {active.remaining <= 0 && (
                <p className="soft-message">
                  Seu tempo terminou. Você pode encerrar com o que conseguiu
                  praticar hoje.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
