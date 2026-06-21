# Bolão Copa 2026 — Classificação

Site público com a classificação ao vivo do **Bolão da Copa do Mundo 2026**
(fase de grupos, 72 jogos, 38 apostadores). A classificação, os próximos jogos,
os palpites públicos e as métricas do bolão são recomputados a cada apuração de
resultado e republicados automaticamente.

- **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Vitest
- **Dados:** JSON estático em `data/` (sem planilha, sem banco, sem PII)
- **Automação:** GitHub Actions (cron) → commit → build estático → GitHub Pages

## Como funciona

```
Excel (uma vez)  ──import:excel──►  predictions.json + fixtures.json + team-map.json
openfootball ────fetch:results──►  results.json  (indexado por jogo 1..72)
                  calc:standings─►  standings.json  ◄── classificação + análises
```

O cálculo é uma **função pura** (`src/lib/scoring.ts`), portada 1:1 da fórmula
da própria planilha e validada por testes. Pontuação:

| Pontos | Critério |
|:-:|---|
| 10 | placar exato |
| 5 | vencedor certo **e** um dos placares exato (jogos decisivos) |
| 3 | resultado certo (vitória ou empate), sem placar exato |
| 0 | resultado errado, sem palpite, ou jogo não apurado |

Além da tabela, o `standings.json` inclui:

- próximo jogo com todos os palpites dos competidores;
- mapa dos jogos pendentes com consenso, médias e placares mais apostados;
- métricas como maior consenso, jogo mais dividido e maior média de gols prevista.

## Rodar localmente

```bash
npm install
npm run update      # busca resultados (openfootball) e recomputa a classificação
npm run dev         # http://localhost:3000
```

`data/` já vem com os palpites reais importados e os resultados apurados até o
momento, então `npm run dev` funciona direto.

## Reimportar os palpites do Excel

O `.xlsx` oficial **não** fica no repositório (contém telefone e Pix). Para reimportar:

```bash
npm run import:excel -- /caminho/para/Bolao_Copa_2026_preenchida.xlsx
```

Regenera `predictions.json`, `fixtures.json` e `team-map.json`. Telefone/Pix são
ignorados de propósito. Em seguida rode `npm run update` para manter resultados,
classificação e análises sincronizados.

## Fontes de resultado

Defina `RESULTS_SOURCE` (veja `.env.example`):

- `openfootball` *(padrão)* — JSON de domínio público, sem chave. ~1 atualização/dia.
- `football-data` — free tier, exige `FOOTBALL_DATA_TOKEN`; placares atrasados.
- `manual` — não busca nada; edite `data/results.json` à mão (por índice 1..72):

```json
{ "results": { "1": { "home": 2, "away": 0, "status": "finished" } } }
```

Se a fonte falhar, o último `results.json` válido é mantido — o site nunca quebra.

## Automação (GitHub Actions)

`.github/workflows/update-and-deploy.yml` roda a cada 30 min, executa
`npm run update`, **só** commita quando `results.json`/`standings.json` mudam,
gera `./out` e publica no GitHub Pages. Não precisa de segredos para a fonte
padrão.

## Publicar no GitHub Pages

O `next build` gera `./out` — um site estático completo, sem servidor.

1. Suba o projeto para o repositório `bolaocopa`.
2. Em **Settings → Pages**, selecione **Source: GitHub Actions**.
3. O workflow usa `NEXT_PUBLIC_BASE_PATH=/bolaocopa`, necessário para servir
   assets em `https://USUARIO.github.io/bolaocopa/`.
4. O push em `main` dispara o primeiro deploy; depois o cron republica sozinho
   quando houver novos resultados.

Para hosts servidos na raiz, deixe `NEXT_PUBLIC_BASE_PATH` vazio ao construir:

```bash
npm run build
```

## Testes

```bash
npm test      # valida a função de pontuação contra a tabela-verdade da planilha
```

## Privacidade

A planilha tem dados pessoais (telefone, Pix). Eles **nunca** são importados,
publicados ou versionados. Só nome de exibição e palpites entram nos JSON. O
`.xlsx` está no `.gitignore`.

Decisões de arquitetura e limitações: ver [`DECISIONS.md`](./DECISIONS.md).
