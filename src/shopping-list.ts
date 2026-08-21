import { CATALOGO } from "./catalog.js";
import type { RepositorioEstado } from "./storage.js";
import type { Categoria, Compra, Estado, EstadoLegado, Lista } from "./types.js";

export function novoId(): string {
  return "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Data de hoje em ISO (aaaa-mm-dd), no fuso do aparelho — o formato do <input type="date">. */
export function hoje(): string {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

export function contarItens(categorias: readonly Categoria[]): number {
  return categorias.reduce((total, categoria) => total + categoria.itens.length, 0);
}

export function contarMarcados(categorias: readonly Categoria[]): number {
  return categorias.reduce(
    (total, categoria) => total + categoria.itens.filter((item) => item.marcado).length,
    0
  );
}

export function listaPadrao(): Lista {
  return {
    data: hoje(),
    categorias: CATALOGO.map((semente) => ({
      id: semente.id,
      nome: semente.nome,
      emoji: semente.emoji,
      itens: semente.itens.map((nome) => ({ id: novoId(), nome, marcado: false }))
    }))
  };
}

/**
 * Estado de quem abre o app pela primeira vez nesta versão. As marcas da versão anterior,
 * quando existirem, são reaplicadas sobre a lista padrão — lá os itens eram identificados
 * pela posição no array ("categoria:indice").
 */
export function criarEstadoInicial(legado: EstadoLegado | null): Estado {
  const atual = listaPadrao();
  const primeira = CATALOGO[0];
  const estado: Estado = {
    atual,
    historico: [],
    abertas: primeira ? [primeira.id] : []
  };
  if (!legado) return estado;

  for (const referencia of legado.marcados) {
    const [idCategoria, posicao] = String(referencia).split(":");
    const categoria = atual.categorias.find((candidata) => candidata.id === idCategoria);
    const item = categoria?.itens[Number(posicao)];
    if (item) item.marcado = true;
  }
  if (legado.abertas.length) estado.abertas = legado.abertas;

  return estado;
}

function desmarcar(categorias: readonly Categoria[]): void {
  for (const categoria of categorias) {
    for (const item of categoria.itens) item.marcado = false;
  }
}

/**
 * Regras da lista de compras. Não conhece o DOM nem o localStorage: recebe o repositório
 * pronto e avisa os interessados a cada mudança.
 */
export class ListaDeCompras {
  private readonly ouvintes: Array<() => void> = [];

  constructor(
    private readonly repositorio: RepositorioEstado,
    private estado: Estado
  ) {}

  static carregar(repositorio: RepositorioEstado, legado: EstadoLegado | null): ListaDeCompras {
    return new ListaDeCompras(repositorio, repositorio.ler() ?? criarEstadoInicial(legado));
  }

  get lista(): Lista {
    return this.estado.atual;
  }

  get historico(): readonly Compra[] {
    return this.estado.historico;
  }

  get totalItens(): number {
    return contarItens(this.estado.atual.categorias);
  }

  get totalMarcados(): number {
    return contarMarcados(this.estado.atual.categorias);
  }

  assinar(ouvinte: () => void): void {
    this.ouvintes.push(ouvinte);
  }

  estaAberta(idCategoria: string): boolean {
    return this.estado.abertas.includes(idCategoria);
  }

  alternarCategoria(idCategoria: string, aberta: boolean): void {
    const abertas = this.estado.abertas.filter((id) => id !== idCategoria);
    this.aplicar(() => {
      this.estado.abertas = aberta ? [...abertas, idCategoria] : abertas;
    });
  }

  definirData(data: string): void {
    this.aplicar(() => {
      this.estado.atual.data = data || hoje();
    });
  }

  marcar(idItem: string, marcado: boolean): void {
    const item = this.estado.atual.categorias
      .flatMap((categoria) => categoria.itens)
      .find((candidato) => candidato.id === idItem);
    if (!item) return;
    this.aplicar(() => {
      item.marcado = marcado;
    });
  }

  adicionarItem(idCategoria: string, nome: string): void {
    const rotulo = nome.trim();
    const categoria = this.estado.atual.categorias.find((candidata) => candidata.id === idCategoria);
    if (!rotulo || !categoria) return;
    this.aplicar(() => {
      categoria.itens.push({ id: novoId(), nome: rotulo, marcado: false });
    });
  }

  removerItem(idItem: string): void {
    this.aplicar(() => {
      for (const categoria of this.estado.atual.categorias) {
        categoria.itens = categoria.itens.filter((item) => item.id !== idItem);
      }
    });
  }

  desmarcarTudo(): void {
    this.aplicar(() => desmarcar(this.estado.atual.categorias));
  }

  /** Registra a lista atual no histórico e recomeça com os mesmos itens desmarcados. */
  finalizarCompra(): void {
    this.aplicar(() => {
      this.estado.historico.unshift({
        id: novoId(),
        data: this.estado.atual.data,
        salvoEm: new Date().toISOString(),
        categorias: structuredClone(this.estado.atual.categorias)
      });
      this.estado.atual.data = hoje();
      desmarcar(this.estado.atual.categorias);
    });
  }

  /** Traz os itens de uma compra anterior como lista nova, tudo desmarcado e com a data de hoje. */
  usarCompraComoNovaLista(idCompra: string): void {
    const compra = this.estado.historico.find((candidata) => candidata.id === idCompra);
    if (!compra) return;
    this.aplicar(() => {
      const categorias = structuredClone(compra.categorias);
      desmarcar(categorias);
      this.estado.atual = { data: hoje(), categorias };
    });
  }

  excluirCompra(idCompra: string): void {
    this.aplicar(() => {
      this.estado.historico = this.estado.historico.filter((compra) => compra.id !== idCompra);
    });
  }

  /** Caminho único de escrita: toda mudança grava e avisa. */
  private aplicar(mudanca: () => void): void {
    mudanca();
    this.repositorio.gravar(this.estado);
    for (const ouvinte of this.ouvintes) ouvinte();
  }
}
