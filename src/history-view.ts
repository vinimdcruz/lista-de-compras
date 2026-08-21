import { contarItens, contarMarcados, type ListaDeCompras } from "./shopping-list.js";
import type { Compra } from "./types.js";
import { criar, formatarData } from "./ui.js";

export interface ElementosHistorico {
  painel: HTMLElement;
  total: HTMLElement;
}

/** Desenha as compras registradas e as ações de cada uma. */
export class VistaHistorico {
  constructor(
    private readonly app: ListaDeCompras,
    private readonly elementos: ElementosHistorico,
    /** Chamado ao reaproveitar uma compra, para a tela voltar à lista. */
    private readonly aoUsarCompra: () => void
  ) {}

  renderizar(): void {
    const compras = this.app.historico;
    this.elementos.total.textContent = String(compras.length);
    this.elementos.painel.replaceChildren(
      compras.length
        ? criar("div", {}, compras.map((compra) => this.criarCartao(compra)))
        : criar("p", {
            className: "vazio",
            textContent: "Nenhuma compra registrada ainda. Ao terminar uma lista, toque em “Finalizar compra”."
          })
    );
  }

  private criarCartao(compra: Compra): HTMLElement {
    const data = formatarData(compra.data);

    const usar = criar("button", {
      type: "button",
      className: "btn-secundario",
      textContent: "Usar como nova lista"
    });
    usar.addEventListener("click", () => {
      if (!window.confirm(`Substituir a lista atual pelos itens da compra de ${data}?`)) return;
      this.app.usarCompraComoNovaLista(compra.id);
      this.aoUsarCompra();
    });

    const excluir = criar("button", {
      type: "button",
      className: "btn-secundario perigo",
      textContent: "Excluir"
    });
    excluir.addEventListener("click", () => {
      if (!window.confirm(`Excluir a compra de ${data} do histórico?`)) return;
      this.app.excluirCompra(compra.id);
    });

    return criar("article", { className: "compra" }, [
      criar("h3", { textContent: data }),
      criar("p", {
        className: "compra-resumo",
        textContent: `${contarMarcados(compra.categorias)} de ${contarItens(compra.categorias)} itens comprados`
      }),
      criar("div", { className: "compra-acoes" }, [usar, excluir])
    ]);
  }
}
