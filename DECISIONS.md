# Decisões de arquitetura

Contexto: o bolão já era um **motor de pontuação completo em fórmulas Excel**
(uma aba por apostador, `Matriz` com resultados oficiais, `Classificação`
computada). Este projeto reimplementa essa lógica em código e a publica.

1. **Portar a lógica (não exportar a planilha).** O site recalcula a partir de
   `predictions.json` + `results.json`. Desacopla o front da planilha e permite
   automação real. O workbook foi usado como *oráculo de teste* — a função de
   pontuação (`src/lib/scoring.ts`) reproduz 1:1 as flags O–V da planilha.

2. **Fonte de resultados padrão: openfootball/worldcup.json** (domínio público,
   sem API key, `raw.githubusercontent.com`, ~1 atualização/dia). O sorteio dele
   coincide exatamente com os 72 jogos do bolão. Adapters alternativos:
   `football-data` (free tier, token, placares atrasados) e `manual`.

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

## Limitações conhecidas
- Escopo = 72 jogos da fase de grupos (a planilha não tem mata-mata).
- Cron do GitHub é best-effort e estático (não varia por dia de jogo).
- Deploy inicial no GitHub Pages exige selecionar **Source: GitHub Actions** uma
  vez no repositório — ver README.
