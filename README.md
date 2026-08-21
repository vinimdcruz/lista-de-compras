# 🛒 Lista de Compras

Web app mobile-first para gerenciar a lista de compras do supermercado.
HTML, CSS e JavaScript puros — sem build, sem dependências, sem requisições externas.

## Funcionalidades

- Seis categorias em accordion: Hortifruti & Temperos, Açougue & Peixaria, Laticínios & Frios,
  Mercearia & Bebidas, Suplementos & Lanches, Limpeza & Casa.
- Checkbox por item, com contagem por categoria e barra de progresso geral.
- Estado salvo no `localStorage`: itens marcados e categorias abertas sobrevivem ao refresh.
- Botão "Limpar" para desmarcar tudo (com confirmação).
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

## Editar os itens

A lista fica na constante `CATEGORIAS`, no topo de `app.js`. Cada categoria tem `id`, `nome`,
`emoji` e um array `itens`.

> O `id` de cada item é derivado da posição no array (`categoria:indice`). Ao reordenar ou
> remover itens, as marcações já salvas passam a apontar para outros itens — se isso incomodar,
> acrescente novos itens ao final do array.
