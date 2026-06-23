# Decisões de arquitetura

Contexto: o bolão já era um **motor de pontuação completo em fórmulas Excel**
(uma aba por apostador, `Matriz` com resultados oficiais, `Classificação`
computada). Este projeto reimplementa essa lógica em código e a publica.

1. **Portar a lógica (não exportar a planilha).** O site recalcula a partir de
   `predictions.json` + `results.json`. Desacopla o front da planilha e permite
   automação real. O workbook foi usado como *oráculo de teste* — a função de
   pontuação (`src/lib/scoring.ts`) reproduz 1:1 as flags O–V da planilha.

2. **Fonte de resultados padrão no CI: modo `fast`.** O robô tenta usar
   API-Football quando o segredo `API_FOOTBALL_KEY` está configurado, porque ela
   tende a publicar status final mais rápido. Em seguida mescla com
   `openfootball/worldcup.json` como fallback público e gratuito. Overrides
   manuais em `data/result-overrides.json` têm prioridade final para casos de
   atraso ou correção pontual. Adapters alternativos: `openfootball`,
   `api-football`, `football-data` e `manual`.

3. **`results.json` é indexado por jogo (1..72).** Desacopla a entrada manual da
   reconciliação de nomes — em modo manual basta editar `home`/`away` por índice.

4. **Reconciliação de nomes restrita ao grupo.** "Astrália" no grupo D = Austrália;
   no grupo J = Áustria (mesma string, seleções diferentes). A resolução usa o
   conjunto de 4 seleções do grupo, eliminando a ambiguidade.

5. **Desempate alfabético por nome** (rótulo "Desempate Alfabético" da planilha).
   Trocável para ordem de inscrição em `src/lib/standings.ts`.

6. **Palpite ausente/inválido = 0 naquele jogo.** Determinístico. Caso real:
   Elias tem 46/72 palpites válidos; os 26 ausentes pontuam 0.

7. **PII nunca entra.** Telefone e Pix (presentes na planilha) não são importados,
   publicados nem versionados. O `.xlsx` é git-ignored.

8. **Publicação por rebuild-on-commit.** A Action apura, recomputa, commita os
   JSON, gera o export estático e publica no GitHub Pages. Sem servidor dedicado.
   O agendamento roda a cada 5 minutos e só faz build/deploy em execução
   agendada quando os dados mudam.

## Limitações conhecidas
- Escopo = 72 jogos da fase de grupos (a planilha não tem mata-mata).
- Cron do GitHub é best-effort; mesmo a cada 5 minutos pode atrasar alguns
  minutos por fila da plataforma.
- Deploy inicial no GitHub Pages exige selecionar **Source: GitHub Actions** uma
  vez no repositório — ver README.
