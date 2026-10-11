import { describe, it, expect } from "vitest";
import { LANGS, lessons, plans } from "./content";
import {
  addDays,
  addMonths,
  CYCLE,
  currentLesson,
  cycleWeek,
  dueReviews,
  durationFor,
  finishSession,
  firstStudyDay,
  initialState,
  monday,
  nextDayForLanguage,
  nightTime,
  portions,
  schedule,
  todayKey,
  validateState,
  verifiedGoal,
  type Session,
} from "./model";
const start = "2026-10-12";
const makeState = () => ({
  ...initialState(),
  settings: { startDate: start, time: "20:30", duration: 25 as const },
});
const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: "s1",
  date: start,
  lang: "ja",
  lessonId: "ja-1",
  minutes: 20,
  target: 20,
  content: "Seu primeiro olá",
  difficulty: "okay",
  note: "",
  recall: "independent",
  mini: false,
  optional: false,
  completed: true,
  ...overrides,
});
const withActive = () => ({
  ...makeState(),
  active: {
    lang: "ja" as const,
    lessonId: "ja-1",
    date: start,
    duration: 20,
    remaining: 0,
    running: false,
    checked: [true, true, true],
    optional: false,
    reviewIds: [],
  },
});
describe("Rotina e calendário", () => {
  it("segue cada dia das três semanas e reinicia o ciclo", () => {
    for (let w = 0; w < 6; w++)
      for (let d = 0; d < 5; d++)
        expect(schedule(addDays(start, w * 7 + d), start)).toBe(
          CYCLE[w % 3][d],
        );
  });
  it("mantém sábado e domingo sem sessões obrigatórias", () => {
    for (let w = 0; w < 25; w++) {
      expect(schedule(addDays(start, w * 7 + 5), start)).toBeNull();
      expect(schedule(addDays(start, w * 7 + 6), start)).toBeNull();
    }
  });
  it("distribui cinco noites por língua em três semanas", () => {
    const dates = Array.from({ length: 21 }, (_, i) =>
      schedule(addDays(start, i), start),
    );
    for (const lang of LANGS)
      expect(dates.filter((l) => l === lang)).toHaveLength(5);
  });
  it("começa na próxima segunda quando a data inicial é fim de semana", () => {
    expect(firstStudyDay("2026-10-10")).toBe(start);
    expect(schedule(start, "2026-10-10")).toBe("ja");
    expect(cycleWeek("2026-10-10", "2026-10-10")).toBe(1);
  });
  it("não cria atividades antes do início ou depois dos seis meses", () => {
    expect(schedule("2026-10-09", start)).toBeNull();
    expect(schedule("2027-04-12", start)).toBeNull();
  });
  it("um dia perdido não modifica a língua do próximo dia", () => {
    const s = makeState();
    expect(s.sessions).toHaveLength(0);
    expect(schedule(addDays(start, 1), s.settings.startDate)).toBe("ko");
  });
  it("usa 20 minutos durante duas semanas e depois a duração escolhida", () => {
    const s = makeState();
    expect(durationFor("2026-10-23", s.settings)).toBe(20);
    expect(durationFor("2026-10-26", s.settings)).toBe(25);
    expect(durationFor("2026-10-26", { ...s.settings, duration: 30 })).toBe(30);
  });
  it("divide o tempo e omite conteúdo novo na sessão curta", () => {
    for (const d of [5, 20, 25, 30])
      expect(portions(d).reduce((a, b) => a + b, 0)).toBe(d);
    expect(portions(5)).toEqual([2, 3]);
  });
  it("lida com fim de mês sem pular para o mês seguinte", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(monday("2026-10-18")).toBe(start);
  });
  it("considera a data e o horário de Brasília, não UTC", () => {
    expect(todayKey(new Date("2026-10-13T01:00:00Z"))).toBe(start);
    expect(nightTime(new Date("2026-10-12T20:59:00Z"))).toBe(false);
    expect(nightTime(new Date("2026-10-12T21:00:00Z"))).toBe(true);
    expect(nightTime(new Date("2026-10-13T03:00:00Z"))).toBe(false);
  });
});
describe("Revisões e evidências", () => {
  it("agenda o conteúdo estudado na próxima noite da mesma língua", () => {
    const state = finishSession(withActive(), makeSession());
    expect(state.active).toBeNull();
    expect(state.reviews[0].due).toBe("2026-10-15");
    expect(schedule(state.reviews[0].due, start)).toBe("ja");
    expect(state.sessions[0].minutes).toBe(20);
  });
  it("só oferece revisões da língua de hoje e limita a dois conteúdos", () => {
    const state = makeState();
    state.reviews = [
      ...Array.from({ length: 4 }, (_, i) => ({
        id: `ja-${i + 1}`,
        lang: "ja" as const,
        lessonId: `ja-${i + 1}`,
        content: "revisão",
        due: start,
        stage: 0,
      })),
      {
        id: "ko-1",
        lang: "ko",
        lessonId: "ko-1",
        content: "coreano",
        due: start,
        stage: 0,
      },
    ];
    expect(dueReviews(state, "ja", start)).toHaveLength(2);
    expect(dueReviews(state, "ja", start).every((r) => r.lang === "ja")).toBe(
      true,
    );
  });
  it("aumenta o intervalo quando há lembrança independente e reduz quando precisa de apoio", () => {
    const original = finishSession(withActive(), makeSession());
    original.active = {
      ...withActive().active!,
      date: "2026-10-15",
      reviewIds: ["ja-1"],
    };
    const independent = finishSession(
      original,
      makeSession({ id: "s2", date: "2026-10-15" }),
    );
    expect(independent.reviews[0].stage).toBe(1);
    expect(independent.reviews[0].due).toBe("2026-10-20");
    const help = finishSession(
      {
        ...independent,
        active: {
          ...withActive().active!,
          date: "2026-10-20",
          reviewIds: ["ja-1"],
        },
      },
      makeSession({ id: "s3", date: "2026-10-20", recall: "help" }),
    );
    expect(help.reviews[0].stage).toBe(0);
    expect(schedule(help.reviews[0].due, start)).toBe("ja");
  });
  it("uma sessão curta não avança conteúdo novo", () => {
    const state = finishSession(
      withActive(),
      makeSession({ mini: true, target: 5, minutes: 5 }),
    );
    expect(state.reviews).toHaveLength(0);
    expect(currentLesson("ja", state, start).id).toBe("ja-1");
  });
  it("uma sessão parcial preserva minutos sem avançar a atividade", () => {
    const state = finishSession(
      {
        ...withActive(),
        active: { ...withActive().active!, checked: [true, false, false] },
      },
      makeSession({ minutes: 3, completed: false }),
    );
    expect(state.sessions[0].minutes).toBe(3);
    expect(state.reviews).toHaveLength(0);
    expect(currentLesson("ja", state, start).id).toBe("ja-1");
  });
  it("concluir uma atividade não verifica a meta mensal", () => {
    const state = finishSession(withActive(), makeSession());
    expect(verifiedGoal(state, "ja", 1, 0)).toBe(false);
  });
  it("exige duas noites diferentes e não duplica uma tentativa no mesmo dia", () => {
    const state = makeState();
    state.assessments = [
      { lang: "ja", month: 1, goal: 0, date: start, passed: true },
      { lang: "ja", month: 1, goal: 0, date: start, passed: true },
    ];
    expect(verifiedGoal(state, "ja", 1, 0)).toBe(false);
    state.assessments.push({
      lang: "ja",
      month: 1,
      goal: 0,
      date: "2026-10-15",
      passed: true,
    });
    expect(verifiedGoal(state, "ja", 1, 0)).toBe(true);
  });
  it("mantém lições anteriores disponíveis em meses posteriores", () => {
    expect(currentLesson("ja", makeState(), "2027-01-12").id).toBe("ja-1");
  });
  it("possui seis meses com duas metas verificáveis para cada língua", () => {
    for (const lang of LANGS) {
      expect(plans[lang]).toHaveLength(6);
      for (const plan of plans[lang]) {
        expect(plan.goals).toHaveLength(2);
        expect(plan.checks).toHaveLength(2);
        expect(lessons[lang].slice(...plan.range).length).toBeGreaterThan(0);
      }
    }
  });
  it("importa apenas dados válidos e preserva a regra de uma sessão por data", () => {
    const state = finishSession(withActive(), makeSession());
    expect(validateState(state)).toBe(true);
    expect(
      validateState({
        ...state,
        settings: { ...state.settings, time: "12:00" },
      }),
    ).toBe(false);
    expect(
      validateState({
        ...state,
        sessions: [state.sessions[0], makeSession({ lang: "ko" })],
      }),
    ).toBe(false);
    expect(
      validateState({
        ...state,
        reviews: [{ ...state.reviews[0], due: "2026-02-31" }],
      }),
    ).toBe(false);
    expect(validateState({ hello: "world" })).toBe(false);
  });
  it("não agenda revisão em um dia de outra língua", () => {
    for (const lang of LANGS)
      for (let i = 0; i < 120; i++) {
        const next = nextDayForLanguage(addDays(start, i), lang, start);
        expect(next).not.toBeNull();
        expect(schedule(next!, start)).toBe(lang);
      }
  });
});
