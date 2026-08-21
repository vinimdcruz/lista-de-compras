# 🛒 Lista de Compras

Web app mobile-first para gerenciar a lista de compras do supermercado.
TypeScript compilado para módulos ES nativos — sem framework, sem bundler e sem nenhuma
dependência de runtime.

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

## Estrutura

```
src/
├── types.ts          ← modelo de dados (só a forma, sem comportamento)
├── catalog.ts        ← semente da primeira lista
├── storage.ts        ← persistência: porta RepositorioEstado + implementação em localStorage
├── shopping-list.ts  ← regras da lista (não conhece DOM nem localStorage)
├── ui.ts             ← utilitários de tela reaproveitados pelas vistas
├── list-view.ts      ← desenha a lista em edição
├── history-view.ts   ← desenha o histórico
└── main.ts           ← composição: monta as peças e liga tela e domínio

public/               ← o que é publicado (index.html, styles.css e js/ compilado)
tests/                ← testes do domínio, rodam sem navegador
```

O domínio depende da **interface** `RepositorioEstado`, não do `localStorage`. É o que permite
testar as regras no Node injetando um repositório em memória, e o que deixa trocar a
persistência sem tocar nas regras.

Toda mudança de estado passa por um único caminho de escrita (`ListaDeCompras.aplicar`), que
grava e avisa os assinantes. As vistas só desenham e escutam: nenhuma delas altera o estado
por conta própria.

## Rodar localmente

```bash
npm install
npm start     # compila e serve em http://localhost:8000
npm test      # compila e roda os testes do domínio
npm run build # só compila (src → public/js)
```

## Deploy

Hospedado na Vercel, conectada a este repositório: todo push na branch `main` republica o site
automaticamente. O `vercel.json` define o build (`npm run build`) e a pasta publicada
(`public`) — nada precisa ser configurado no painel.

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

A constante `CATALOGO`, em `src/catalog.ts`, é só a **semente**: define a lista de quem abre o
app pela primeira vez. Depois disso a lista vive no `localStorage` e é editada pela interface —
mudar o `CATALOGO` não altera listas já existentes.
