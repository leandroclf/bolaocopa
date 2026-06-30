# AGENTS.md

## Regras do Projeto
- A classificação do bolão deve considerar apenas o placar final do tempo normal somado à prorrogação.
- Disputa por pênaltis não entra na pontuação da classificação; serve apenas para definir o classificado no mata-mata.
- Quando houver atualização de jogo finalizado, manter `data/results.json` e `data/standings.json` sincronizados.
- Se um resultado precisar ser corrigido ou consolidado manualmente, registrar a alteração em `data/result-overrides.json`; não editar apenas `data/results.json`, porque esse arquivo pode ser regenerado pelo fluxo de atualização e perder a correção.
- Em jogos de mata-mata com prorrogação, validar sempre se o placar oficial do tempo normal + prorrogação foi aplicado antes do push.
- Se o jogo terminar empatado após a prorrogação, preencher também `winner` com o vencedor dos pênaltis no `data/result-overrides.json`; empate sem `winner` quebra a validação do bracket e impede o avanço correto.
- Após qualquer ajuste de resultado, executar o fluxo de atualização do projeto e conferir se a contagem de jogos e a classificação ficaram consistentes antes de publicar.
