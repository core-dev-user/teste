import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
const port = 4175;
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  { stdio: "pipe" },
);
let serverLog = "";
server.stdout.on("data", (x) => (serverLog += x));
server.stderr.on("data", (x) => (serverLog += x));
let browser;
let passed = 0;
const check = (name) => {
  passed++;
  console.log(`✓ ${name}`);
};
const url = `http://127.0.0.1:${port}`;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(ready, `Servidor indisponível: ${serverLog}`);
  browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ??
      (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    args: ["--no-sandbox"],
  });
  const errors = [];
  const create = async (time = "2026-10-12T23:30:00Z", width = 1440) => {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      timezoneId: "America/Sao_Paulo",
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.clock.install({ time: new Date(time) });
    await page.goto(url);
    await page
      .getByRole("heading", { name: "Pequenos passos, novos mundos." })
      .waitFor();
    return { page, context };
  };
  const { page, context } = await create();
  await page.getByRole("button", { name: "Começar", exact: true }).click();
  await page.getByRole("dialog", { name: "Sessão de Japonês" }).waitFor();
  assert.equal(await page.getByRole("timer").innerText(), "20:00");
  await page.clock.runFor(12_000);
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  const paused = await page.getByRole("timer").innerText();
  await page.clock.runFor(20_000);
  assert.equal(await page.getByRole("timer").innerText(), paused);
  check(
    "sessão guiada em japonês, duração inicial e pausa sem acumular minutos",
  );
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Continuar sessão", exact: true })
    .click();
  assert.equal(await page.getByRole("timer").innerText(), paused);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.clock.runFor(48_000);
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  check("sessão persistida e retomada em pausa após recarregar");
  for (const task of [
    "Revisar o que já conhece",
    "Aprender um pedacinho novo",
    "Praticar sem consultar",
  ])
    await page
      .getByRole("button", { name: `Marcar ${task}`, exact: true })
      .click();
  await page
    .getByRole("button", { name: "Praticar sem consultar", exact: false })
    .filter({ hasNot: page.locator(".task-checkbox") })
    .last()
    .click();
  await page
    .getByRole("button", {
      name: "Conferir uma resposta possível",
      exact: true,
    })
    .click();
  assert.ok(
    (await page.locator(".practice-answer").innerText()).includes("こんにちは"),
  );
  await page
    .getByRole("button", { name: "Registrar sessão", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Lembrei e usei sozinho(a)", exact: true })
    .click();
  await page
    .getByLabel("Uma anotação, se quiser")
    .fill("Lembrei de olá e obrigado sem consultar.");
  await page
    .getByRole("button", { name: "Salvar meu passo", exact: true })
    .click();
  await page.getByRole("dialog", { name: "Sessão registrada" }).waitFor();
  await page
    .getByRole("button", { name: "Ver meu registro", exact: true })
    .last()
    .click();
  assert.ok(
    (await page.locator("main").innerText()).includes(
      "Lembrei de olá e obrigado sem consultar.",
    ),
  );
  let saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("passo-v1")),
  );
  assert.equal(saved.sessions.length, 1);
  assert.ok(
    saved.sessions[0].minutes >= 0.95 && saved.sessions[0].minutes <= 1.1,
  );
  assert.equal(saved.reviews[0].due, "2026-10-15");
  check(
    "prática, registro do tempo real, anotação e revisão na próxima noite de japonês",
  );
  await page
    .getByRole("button", { name: "Minha jornada", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Fazer uma verificação", exact: false })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Consegui sem consultar", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Fazer uma verificação", exact: false })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Consegui sem consultar", exact: false })
    .click();
  assert.ok(
    (await page.locator("main").innerText()).includes("1/2 demonstrações"),
  );
  check("duas tentativas na mesma noite não verificam uma meta");
  await page.getByRole("button", { name: "Ajustes", exact: true }).click();
  await page.getByLabel("Seu horário à noite").fill("21:00");
  await page
    .getByRole("button", { name: "Salvar meus ajustes", exact: true })
    .click();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar cópia", exact: true })
    .click();
  const download = await downloadPromise;
  const exportText = readFileSync(await download.path(), "utf8");
  assert.equal(JSON.parse(exportText).sessions.length, 1);
  await page
    .getByRole("button", {
      name: "Apagar progresso deste navegador",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Apagar progresso", exact: true })
    .click();
  assert.equal(
    (await page.evaluate(() => JSON.parse(localStorage.getItem("passo-v1"))))
      .sessions.length,
    0,
  );
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "passo.json",
      mimeType: "application/json",
      buffer: Buffer.from(exportText),
    });
  await page
    .getByRole("button", { name: "Importar e substituir", exact: false })
    .click();
  saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("passo-v1")),
  );
  assert.equal(saved.sessions.length, 1);
  assert.equal(saved.settings.time, "21:00");
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "invalido.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"errado":true}'),
    });
  assert.equal(
    (await page.evaluate(() => JSON.parse(localStorage.getItem("passo-v1"))))
      .sessions.length,
    1,
  );
  check(
    "ajustes, exportação, importação confirmada e rejeição de cópia inválida",
  );
  await context.close();
  const mini = await create("2026-10-13T23:30:00Z");
  await mini.page
    .getByRole("button", { name: "Hoje só tenho 5 minutos", exact: false })
    .click();
  await mini.page.getByRole("dialog", { name: "Sessão de Coreano" }).waitFor();
  assert.equal(await mini.page.getByRole("timer").innerText(), "05:00");
  assert.equal(
    await mini.page.locator(".session-task-list .task-name").count(),
    2,
  );
  assert.equal(
    await mini.page
      .locator(".session-task-list")
      .getByText("Aprender um pedacinho novo")
      .count(),
    0,
  );
  await mini.page.clock.runFor(300_000);
  assert.equal(await mini.page.getByRole("timer").innerText(), "00:00");
  check(
    "versão de cinco minutos com revisão e prática, sem conteúdo novo, e término automático",
  );
  await mini.context.close();
  const weekend = await create("2026-10-10T23:30:00Z", 390);
  assert.ok(
    (await weekend.page.locator("main").innerText()).includes(
      "Sábado e domingo sem tarefas",
    ),
  );
  assert.ok(
    await weekend.page
      .getByRole("button", { name: "Hoje só tenho 5 minutos" })
      .isDisabled(),
  );
  await weekend.page
    .getByRole("button", { name: "Conhecer a próxima sessão", exact: false })
    .click();
  await weekend.page.getByRole("dialog").waitFor();
  assert.equal(
    (
      await weekend.page.evaluate(() =>
        JSON.parse(localStorage.getItem("passo-v1")),
      )
    ).active,
    null,
  );
  await weekend.page
    .getByRole("button", { name: "Fechar", exact: true })
    .click();
  assert.equal(
    await weekend.page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  for (const nav of [
    "Calendário",
    "Minha jornada",
    "Meu progresso",
    "Caderno de estudos",
    "Ajustes",
  ]) {
    await weekend.page
      .getByRole("button", { name: "Abrir menu", exact: true })
      .click();
    await weekend.page.getByRole("button", { name: nav, exact: true }).click();
    assert.equal(
      await weekend.page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `Overflow em ${nav}`,
    );
  }
  check(
    "fins de semana livres, consulta sem registro e cinco telas sem overflow no celular",
  );
  await weekend.context.close();
  const daytime = await create("2026-10-12T16:00:00Z");
  await daytime.page
    .getByRole("button", { name: "Começar", exact: true })
    .click();
  assert.equal(
    (
      await daytime.page.evaluate(() =>
        JSON.parse(localStorage.getItem("passo-v1")),
      )
    ).active,
    null,
  );
  assert.ok(
    (await daytime.page.getByRole("status").innerText()).includes("18h"),
  );
  check("sessões disponíveis somente à noite");
  await daytime.context.close();
  const later = await create("2026-10-26T23:30:00Z");
  await later.page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("passo-v1"));
    s.settings.startDate = "2026-10-12";
    localStorage.setItem("passo-v1", JSON.stringify(s));
  });
  await later.page.reload();
  await later.page.getByLabel("Duração da sessão").selectOption("30");
  await later.page
    .getByRole("button", { name: "Começar", exact: true })
    .click();
  assert.equal(await later.page.getByRole("timer").innerText(), "30:00");
  await later.page.getByLabel("Conteúdo desta noite").selectOption("ko-2");
  assert.ok(
    (await later.page.locator(".session-title").innerText()).includes("Hangul"),
  );
  check(
    "escolha de 30 minutos após duas semanas e repetição de conteúdo da mesma língua",
  );
  await later.context.close();
  assert.deepEqual(errors, []);
  console.log(
    `\n${passed} fluxos de navegador passaram. Nenhum erro JavaScript.`,
  );
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
