/** Semente da primeira lista. Depois disso a lista vive no armazenamento e é editada pela tela. */

export interface CategoriaSemente {
  readonly id: string;
  readonly nome: string;
  readonly emoji: string;
  readonly itens: readonly string[];
}

export const CATALOGO: readonly CategoriaSemente[] = [
  {
    id: "hortifruti",
    nome: "Hortifruti & Temperos",
    emoji: "🥬",
    itens: ["Banana", "Limão", "Tomate", "Cebola", "Alho", "Batata", "Alface", "Cheiro-verde"]
  },
  {
    id: "acougue",
    nome: "Açougue & Peixaria",
    emoji: "🥩",
    itens: ["Peito de frango", "Patinho moído", "Bife de alcatra", "Filé de tilápia", "Linguiça toscana", "Ovos"]
  },
  {
    id: "laticinios",
    nome: "Laticínios & Frios",
    emoji: "🧀",
    itens: ["Leite integral", "Queijo mussarela", "Requeijão", "Iogurte natural", "Manteiga", "Presunto"]
  },
  {
    id: "mercearia",
    nome: "Mercearia & Bebidas",
    emoji: "🛍️",
    itens: ["Pão", "Café", "Arroz", "Feijão", "Macarrão", "Açúcar", "Óleo de soja", "Água mineral", "Suco de laranja"]
  },
  {
    id: "suplementos",
    nome: "Suplementos & Lanches",
    emoji: "🥤",
    itens: ["Whey protein", "Creatina", "Barra de cereal", "Castanha de caju", "Pasta de amendoim", "Biscoito integral"]
  },
  {
    id: "limpeza",
    nome: "Limpeza & Casa",
    emoji: "🧴",
    itens: ["Detergente", "Sabão em pó", "Amaciante", "Papel higiênico", "Saco de lixo", "Esponja", "Desinfetante"]
  }
];
