/** Modelo de dados da aplicação. Sem comportamento: só a forma dos dados. */

export interface Item {
  id: string;
  nome: string;
  marcado: boolean;
}

export interface Categoria {
  id: string;
  nome: string;
  emoji: string;
  itens: Item[];
}

/** A lista em edição. A data é o título dela. */
export interface Lista {
  data: string;
  categorias: Categoria[];
}

/** Uma compra finalizada: a lista congelada no momento em que foi registrada. */
export interface Compra {
  id: string;
  data: string;
  salvoEm: string;
  categorias: Categoria[];
}

export interface Estado {
  atual: Lista;
  historico: Compra[];
  abertas: string[];
}

/** Marcas gravadas pela primeira versão do app, migradas na primeira abertura. */
export interface EstadoLegado {
  marcados: string[];
  abertas: string[];
}
