import { Lang, LANGS, Lesson, lessons, plans } from "./content";
export const STORAGE_KEY = "passo-v1";
export const TIMEZONE = "America/Sao_Paulo";
export function todayKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function nightTime(now = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TIMEZONE,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now),
  );
  return hour >= 18;
}
export function parseDate(key: string) {
  return new Date(`${key}T12:00:00`);
}
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function addDays(key: string, days: number): string {
  const d = parseDate(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}
export function addMonths(key: string, months: number): string {
  const d = parseDate(key);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return dateKey(d);
}
export function daysBetween(a: string, b: string): number {
  return Math.round(
    (Date.UTC(...utcParts(b)) - Date.UTC(...utcParts(a))) / 86400000,
  );
}
function utcParts(key: string): [number, number, number] {
  const [y, m, d] = key.split("-").map(Number);
  return [y, m - 1, d];
}
export function monday(key: string): string {
  return addDays(key, -((parseDate(key).getDay() + 6) % 7));
}
export function firstStudyDay(start: string): string {
  const d = parseDate(start).getDay();
  return d === 6 ? addDays(start, 2) : d === 0 ? addDays(start, 1) : start;
}
export const CYCLE: Lang[][] = [
  ["ja", "ko", "fr", "ja", "ko"],
  ["fr", "ja", "ko", "fr", "ja"],
  ["ko", "fr", "ja", "ko", "fr"],
];
export function schedule(date: string, start: string): Lang | null {
  if (date < start || date >= addMonths(start, 6)) return null;
  const day = (parseDate(date).getDay() + 6) % 7;
  if (day > 4) return null;
  const week = Math.floor(daysBetween(monday(firstStudyDay(start)), date) / 7);
  return CYCLE[((week % 3) + 3) % 3][day];
}
export function cycleWeek(date: string, start: string): number {
  const week = Math.max(
    0,
    Math.floor(daysBetween(monday(firstStudyDay(start)), date) / 7),
  );
  return (week % 3) + 1;
}
export function nextDayForLanguage(
  date: string,
  lang: Lang,
  start: string,
): string | null {
  for (let i = 0; i < 190; i++) {
    const next = addDays(date, i);
    if (schedule(next, start) === lang) return next;
  }
  return null;
}
export function monthNumber(date: string, start: string): number {
  let m = 1;
  while (m < 6 && date >= addMonths(start, m)) m++;
  return m;
}
export type Settings = {
  startDate: string;
  time: string;
  duration: 20 | 25 | 30;
};
export type Recall = "independent" | "help" | "again";
export type Session = {
  id: string;
  date: string;
  lang: Lang;
  lessonId: string;
  minutes: number;
  target: number;
  content: string;
  difficulty: "easy" | "okay" | "hard";
  note: string;
  recall: Recall;
  mini: boolean;
  optional: boolean;
  completed?: boolean;
};
export type Review = {
  id: string;
  lang: Lang;
  lessonId: string;
  content: string;
  due: string;
  stage: number;
};
export type Assessment = {
  lang: Lang;
  month: number;
  goal: number;
  date: string;
  passed: boolean;
};
export type Active = {
  lang: Lang;
  lessonId: string;
  date: string;
  duration: number;
  remaining: number;
  running: boolean;
  checked: boolean[];
  optional: boolean;
  reviewIds: string[];
};
export type AppState = {
  version: 1;
  settings: Settings;
  sessions: Session[];
  reviews: Review[];
  assessments: Assessment[];
  active: Active | null;
};
export function initialState(): AppState {
  return {
    version: 1,
    settings: { startDate: todayKey(), time: "20:30", duration: 25 },
    sessions: [],
    reviews: [],
    assessments: [],
    active: null,
  };
}
export function durationFor(date: string, settings: Settings): number {
  return daysBetween(firstStudyDay(settings.startDate), date) < 14
    ? 20
    : settings.duration;
}
export function portions(duration: number): number[] {
  return duration === 5
    ? [2, 3]
    : [
        Math.round(duration * 0.2),
        Math.round(duration * 0.4),
        duration - Math.round(duration * 0.2) - Math.round(duration * 0.4),
      ];
}
export function currentLesson(
  lang: Lang,
  state: AppState,
  date: string,
): Lesson {
  const plan = plans[lang][monthNumber(date, state.settings.startDate) - 1];
  const done = new Set(
    state.sessions
      .filter((s) => s.lang === lang && !s.mini && s.completed !== false)
      .map((s) => s.lessonId),
  );
  // The month sets a gentle ceiling. Missed lessons remain available without a backlog of tasks.
  const first = lessons[lang]
    .slice(0, plan.range[1])
    .find((l) => !done.has(l.id));
  if (first) return first;
  const pool = lessons[lang].slice(...plan.range);
  const n = state.sessions.filter((s) => s.lang === lang).length;
  return pool[n % pool.length];
}
export function dueReviews(
  state: AppState,
  lang: Lang,
  date: string,
): Review[] {
  return state.reviews
    .filter((r) => r.lang === lang && r.due <= date)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 2);
}
export function finishSession(state: AppState, session: Session): AppState {
  const active = state.active!;
  const nextReviews = state.reviews.map((r) => {
    if (!active.reviewIds.includes(r.id)) return r;
    const stage =
      session.recall === "independent" ? Math.min(r.stage + 1, 4) : 0;
    const interval = [1, 3, 7, 14, 30][stage];
    return {
      ...r,
      stage,
      due:
        nextDayForLanguage(
          addDays(session.date, interval),
          r.lang,
          state.settings.startDate,
        ) ?? addMonths(state.settings.startDate, 6),
    };
  });
  if (
    !session.mini &&
    active.checked[1] &&
    !nextReviews.some((r) => r.lessonId === session.lessonId)
  ) {
    nextReviews.push({
      id: session.lessonId,
      lang: session.lang,
      lessonId: session.lessonId,
      content: session.content,
      stage: 0,
      due:
        nextDayForLanguage(
          addDays(session.date, 1),
          session.lang,
          state.settings.startDate,
        ) ?? addMonths(state.settings.startDate, 6),
    });
  }
  return {
    ...state,
    sessions: [...state.sessions, session],
    reviews: nextReviews,
    active: null,
  };
}
export function verifiedGoal(
  state: AppState,
  lang: Lang,
  month: number,
  goal: number,
): boolean {
  return goalEvidence(state, lang, month, goal) >= 2;
}
export function goalEvidence(
  state: AppState,
  lang: Lang,
  month: number,
  goal: number,
): number {
  const attempts = state.assessments.filter(
    (a) => a.lang === lang && a.month === month && a.goal === goal,
  );
  const latestByDay = new Map(attempts.map((a) => [a.date, a.passed]));
  return [...latestByDay.values()].filter(Boolean).length;
}
export function validateState(data: unknown): data is AppState {
  if (!data || typeof data !== "object") return false;
  const s = data as AppState;
  const validDate = (v: unknown) =>
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    !isNaN(parseDate(v).valueOf()) &&
    dateKey(parseDate(v)) === v;
  const validLang = (v: unknown) => LANGS.includes(v as Lang);
  const lessonExists = (lang: Lang, id: string) =>
    lessons[lang]?.some((l) => l.id === id);
  if (
    s.version !== 1 ||
    !s.settings ||
    !validDate(s.settings.startDate) ||
    !/^\d{2}:\d{2}$/.test(s.settings.time) ||
    s.settings.time < "18:00" ||
    s.settings.time > "23:59" ||
    ![20, 25, 30].includes(s.settings.duration)
  )
    return false;
  if (
    !Array.isArray(s.sessions) ||
    !Array.isArray(s.reviews) ||
    !Array.isArray(s.assessments)
  )
    return false;
  if (
    !s.sessions.every(
      (x) =>
        x &&
        typeof x.id === "string" &&
        validLang(x.lang) &&
        validDate(x.date) &&
        lessonExists(x.lang, x.lessonId) &&
        Number.isFinite(x.minutes) &&
        x.minutes >= 0 &&
        [5, 20, 25, 30].includes(x.target) &&
        x.minutes <= x.target &&
        ["easy", "okay", "hard"].includes(x.difficulty) &&
        ["independent", "help", "again"].includes(x.recall) &&
        typeof x.content === "string" &&
        typeof x.note === "string" &&
        typeof x.mini === "boolean" &&
        typeof x.optional === "boolean" &&
        (x.completed === undefined || typeof x.completed === "boolean"),
    )
  )
    return false;
  if (
    !s.reviews.every(
      (x) =>
        x &&
        typeof x.id === "string" &&
        validLang(x.lang) &&
        validDate(x.due) &&
        lessonExists(x.lang, x.lessonId) &&
        typeof x.content === "string" &&
        Number.isInteger(x.stage) &&
        x.stage >= 0 &&
        x.stage <= 4,
    )
  )
    return false;
  if (
    !s.assessments.every(
      (x) =>
        x &&
        validLang(x.lang) &&
        validDate(x.date) &&
        Number.isInteger(x.month) &&
        x.month >= 1 &&
        x.month <= 6 &&
        [0, 1].includes(x.goal) &&
        typeof x.passed === "boolean",
    )
  )
    return false;
  if (new Set(s.sessions.map((x) => x.date)).size !== s.sessions.length)
    return false;
  if (s.active) {
    const a = s.active;
    if (
      !validLang(a.lang) ||
      !lessonExists(a.lang, a.lessonId) ||
      !validDate(a.date) ||
      ![5, 20, 25, 30].includes(a.duration) ||
      !Number.isFinite(a.remaining) ||
      a.remaining < 0 ||
      a.remaining > a.duration * 60 ||
      typeof a.running !== "boolean" ||
      typeof a.optional !== "boolean" ||
      !Array.isArray(a.checked) ||
      a.checked.length !== (a.duration === 5 ? 2 : 3) ||
      !a.checked.every((x) => typeof x === "boolean") ||
      !Array.isArray(a.reviewIds) ||
      !a.reviewIds.every(
        (x) =>
          typeof x === "string" &&
          s.reviews.some((r) => r.id === x && r.lang === a.lang),
      )
    )
      return false;
  }
  return true;
}
export function loadState(): { state: AppState; error: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: initialState(), error: "" };
    const data: unknown = JSON.parse(raw);
    if (!validateState(data))
      return {
        state: initialState(),
        error:
          "O progresso salvo não pôde ser lido. O arquivo original foi preservado; exporte-o nos ajustes antes de salvar novos dados.",
      };
    if (data.active) data.active = { ...data.active, running: false };
    return { state: data, error: "" };
  } catch {
    return {
      state: initialState(),
      error:
        "O armazenamento deste navegador está indisponível. Exporte uma cópia para guardar seu progresso.",
    };
  }
}
