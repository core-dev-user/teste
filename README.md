# Passo — um pouco, todos os dias

Aplicativo de rotina de estudos em português do Brasil, feito com React, TypeScript e Vite. Não exige conta, servidor de dados, credenciais ou serviços externos. Fontes e ilustração são incluídas no aplicativo.

## Executar

Use Node.js 20.19+ ou 22.12+ (validado com Node 24).

```sh
cd /workspace/teste
npm ci --cache /tmp/passo-npm-cache
npm run dev
```

O servidor de desenvolvimento usa a porta 5173. Para distribuição estática, execute `npm run build` e publique a pasta `dist` em uma hospedagem HTTPS. `npm run preview` serve a compilação local para verificação; não é um servidor de produção.

## Como usar

1. Abra **Minha rotina**. Nas noites de segunda a sexta, clique em **Começar**, ou use **Hoje só tenho 5 minutos**.
2. Faça as duas ou três etapas. O cronômetro pode ser pausado; fechar a janela ou recarregar deixa a sessão em pausa. Marque o que praticou, mesmo com apoio. É possível registrar uma sessão parcial.
3. Registre dificuldade, lembrança independente e uma anotação opcional. Os minutos contabilizados são os realmente estudados, excluindo pausas. Há um registro por dia e uma língua por noite.
4. Consulte **Calendário**, **Meu progresso** e **Caderno de estudos**. Em **Minha jornada**, veja os seis meses de cada língua e faça verificações curtas. Uma atividade concluída não verifica uma meta: são necessárias duas demonstrações sem consulta em noites diferentes da mesma língua.
5. Em **Ajustes**, mude a data de início, o horário ou a duração, e exporte uma cópia do progresso. Após as primeiras duas semanas, a duração também pode ser escolhida na tela inicial.

O ciclo é exatamente o de três semanas solicitado, repetido por seis meses. As primeiras duas semanas têm sessões de 20 minutos; depois, é possível escolher 20, 25 ou 30. A versão de cinco minutos inclui só revisão e prática. Falta não altera o calendário e não acumula tarefas.

Sábado e domingo ficam livres, sem sessões cronometradas. A primeira atividade pode ser consultada nesse período. As sessões começam em noites úteis, das 18h às 23h59. O horário padrão é 20h30, no fuso **America/Sao_Paulo** (Brasília); o relógio do aparelho precisa estar correto. A data inicial em um fim de semana desloca a primeira noite para segunda-feira.

O conteúdo inclui 50 atividades reutilizáveis (18 de japonês, 16 de coreano, 16 de francês), 18 módulos mensais e 36 metas verificáveis. Os grupos maiores de escrita podem ser divididos ou repetidos; use **Conteúdo desta noite** para escolher uma atividade da mesma língua. O mês limita o conteúdo novo disponível, mas lições anteriores continuam acessíveis. O plano desenvolve bases, não promete fluência.

As revisões usam os conteúdos das atividades registradas. Intervalos de 1, 3, 7, 14 e 30 dias são deslocados para a próxima noite da mesma língua, até o término do plano. São oferecidos no máximo dois conteúdos por sessão; precisar de apoio encurta o intervalo. A autoavaliação é feita pela pessoa, sem correção automática de escrita ou pronúncia.

## Salvamento, áudio e notificações

- O progresso é salvo em `localStorage`, no navegador, dispositivo e endereço em uso. Não há sincronização entre dispositivos. Limpar dados do site, usar navegação privada ou mudar o endereço pode tornar o histórico indisponível. **Exportar cópia** e **Importar cópia** permitem guardar e transferir os dados; a importação valida o arquivo e pede confirmação antes de substituir o histórico.
- Dados inválidos preexistentes são preservados até exportação e importação de uma cópia válida, ou exclusão explícita nos ajustes. Se o armazenamento estiver bloqueado, um aviso informa a limitação.
- O áudio usa `speechSynthesis` e vozes compatíveis instaladas no aparelho. Sem uma voz da língua escolhida, os controles de áudio ficam desativados com explicação. Algumas vozes do sistema podem depender de conexão; não há gravação de voz ou avaliação de pronúncia.
- Não há notificações push, alarmes em segundo plano ou sincronização de cronômetro entre abas. O horário escolhido é uma referência visual. Use um lembrete do celular se desejar.

## Validação

```sh
npm test
npm run build
npm run test:e2e
```

`npm test` cobre calendário, duração, distribuição das línguas, revisões espaçadas, sessões parciais, distinção entre atividade e aprendizado e validação de cópias. Os testes de navegador executam a versão compilada, iniciam um servidor temporário na porta 4175 e verificam sessões, pausa, retomada, registro, metas, exportação/importação, dias e horários permitidos e telas de celular. Usam Chromium do sistema; `CHROMIUM_PATH` permite escolher outro executável. Se nenhum navegador de sistema estiver disponível, instale o Chromium do Playwright (`npx playwright install chromium`).
