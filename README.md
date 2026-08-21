# 🛒 Lista de Compras

Web app mobile-first para gerenciar a lista de compras do supermercado.
HTML, CSS e JavaScript puros — sem build, sem dependências, sem requisições externas.

## Funcionalidades

- **Data como título** da lista, editável pelo seletor nativo do aparelho.
- **Seis categorias em accordion**: Hortifruti & Temperos, Açougue & Peixaria, Laticínios &
  Frios, Mercearia & Bebidas, Suplementos & Lanches, Limpeza & Casa.
- **Itens editáveis**: adicionar item em qualquer categoria e remover qualquer item, inclusive
  os que vêm de fábrica.
- **Checkbox por item**, com contagem por categoria e barra de progresso geral.
- **Finalizar compra**: registra a lista no histórico e já começa uma lista nova, com os mesmos
  itens desmarcados e a data de hoje.
- **Histórico de compras**: cada compra guardada com data e resumo do que foi comprado, com
  opção de excluir ou de **usar como nova lista** (traz os itens daquela compra, desmarcados).
- Tudo salvo no `localStorage` — lista atual, categorias abertas e histórico sobrevivem ao
  refresh e ao fechar o navegador.
- Tema claro/escuro automático conforme a preferência do sistema.

## Rodar localmente

Basta abrir `index.html` no navegador. Para servir via HTTP:

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```

## Deploy

Hospedado na Vercel, conectada a este repositório: todo push na branch `main` republica o site
automaticamente. Site estático puro — sem build step, sem configuração.

## Como os dados ficam guardados

Uma única chave no `localStorage`, `supermercado:v2`:

```js
{
  atual:     { data: "2026-08-21", categorias: [ { id, nome, emoji, itens: [ { id, nome, marcado } ] } ] },
  historico: [ { id, data, salvoEm, categorias: [ ... ] } ],
  abertas:   ["hortifruti"]
}
```

Cada item tem `id` próprio, então adicionar e remover não embaralha as marcações dos outros.
Marcações da versão anterior do app (chave `supermercado:marcados`) são migradas na primeira
abertura.

A constante `CATALOGO`, no topo de `app.js`, é só a **semente**: define a lista de quem abre o
app pela primeira vez. Depois disso a lista vive no `localStorage` e é editada pela interface —
mudar o `CATALOGO` não altera listas já existentes.
