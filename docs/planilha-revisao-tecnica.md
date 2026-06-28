# Planilha revisada

Arquivo-alvo: `public/bolao_copa2026_final_envio.xlsx`

## Base funcional

- Formato oficial da Copa do Mundo FIFA 2026.
- 48 seleções.
- 12 grupos.
- Classificação dos 2 primeiros e dos 8 melhores terceiros.
- Mata-mata com início nos 32 avos de final.
- Chaveamento preservado conforme a árvore oficial da FIFA.

## Estrutura da planilha

### `Palpites 32-avos`

- Área de identificação reorganizada.
- Identificador único do apostador.
- Campo para data/hora de envio.
- Controle de pagamento:
  - PIX
  - valor de inscrição
  - status
  - confirmação
- Aviso explícito de que a pontuação considera o placar final após o tempo normal e a prorrogação.
- Lista dos confrontos com os nomes corretos das seleções.
- Validação de placares com inteiros de 0 a 20.

### `Chaveamento Oficial`

- Exibe o chaveamento da fase atual.
- Inclui data, horário, estádio e cidade quando disponíveis.
- Inclui colunas para classificado e decisão.
- Preparada para receber atualização de resultados futuros.

### `Regulamento e Pontuação`

- Consolida pontuação, regras operacionais, premiação e responsabilidades.
- Destaca a regra de tempo normal + prorrogação para pontuação.
- Explica que a premiação vem da soma das inscrições.

### `Configurações`

- Aba oculta de parametrização.
- Centraliza:
  - versão da planilha
  - fonte oficial
  - taxa de inscrição
  - listas de validação
  - limites de placar

## Proteções e validações

- Bloqueio de células não editáveis.
- Lista suspensa para status de pagamento.
- Lista suspensa para status dos jogos.
- Lista suspensa para decisão da partida.
- Proteção contra exclusão acidental.

## Compatibilidade

- Excel Desktop.
- Excel Online.
- Google Sheets, com observação de que algumas proteções e fórmulas podem ter comportamento diferente entre plataformas.

## Automatização preparada

- Estrutura pronta para consolidação de muitos apostadores.
- Base compatível com atualização automática de resultados oficiais.
- Colunas e validações preparadas para leitura por script externo.

## Fonte oficial

- FIFA: `https://www.fifa.com/pt/tournaments/mens/worldcup/canadamexicousa2026/articles/copa-mundo-2026-tabela-jogos`
