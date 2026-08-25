import type { ListaDeCompras } from "./shopping-list.js";
import type { Categoria, Item } from "./types.js";
import { alertar, confirmar, criar, definirAria, mostrarToast, preservandoFoco } from "./ui.js";

export interface ElementosLista {
  lista: HTMLElement;
  contador: HTMLElement;
  barra: HTMLElement;
  finalizar: HTMLButtonElement;
  limpar: HTMLButtonElement;
}

/** Desenha a lista em edição: categorias, itens, adição, remoção e as ações do rodapé. */
export class VistaLista {
  constructor(
    private readonly app: ListaDeCompras,
    private readonly elementos: ElementosLista,
    private readonly aoVerHistorico?: () => void
  ) {
    elementos.finalizar.addEventListener("click", () => this.finalizar());
    elementos.limpar.addEventListener("click", () => this.limpar());
  }

  renderizar(): void {
    preservandoFoco(() => {
      const categorias = this.app.lista.categorias.map((categoria) => this.criarCategoria(categoria));
      const conteudo = categorias.length
        ? categorias
        : [criar("p", { className: "vazio", textContent: "Nenhuma categoria. Crie a primeira abaixo." })];
      this.elementos.lista.replaceChildren(...conteudo, this.criarNovaCategoria());
    });
    this.atualizarProgresso();
  }

  private atualizarProgresso(): void {
    const total = this.app.totalItens;
    const marcados = this.app.totalMarcados;
    this.elementos.contador.textContent = `${marcados} de ${total} itens`;
    this.elementos.barra.style.width = total ? `${(marcados / total) * 100}%` : "0%";
  }

  private criarCategoria(categoria: Categoria): HTMLElement {
    const aberta = this.app.estaAberta(categoria.id);
    const idItens = `itens-${categoria.id}`;

    const itens = criar("ul", { className: "itens", id: idItens, hidden: !aberta }, [
      ...categoria.itens.map((item) => this.criarItem(item)),
      this.criarLinhaAdicionar(categoria)
    ]);

    const alternar = criar("button", { type: "button", className: "categoria-botao" }, [
      criar("span", { className: "categoria-emoji", textContent: categoria.emoji, ariaHidden: "true" }),
      criar("span", { className: "categoria-nome", textContent: categoria.nome }),
      criar("span", {
        className: "categoria-contagem",
        textContent: `${categoria.itens.filter((item) => item.marcado).length}/${categoria.itens.length}`
      }),
      criar("span", { className: "seta", textContent: "▶", ariaHidden: "true" })
    ]);
    definirAria(alternar, { "aria-expanded": String(aberta), "aria-controls": idItens });
    alternar.addEventListener("click", () => {
      this.app.alternarCategoria(categoria.id, itens.hidden);
    });

    const excluir = criar("button", {
      type: "button",
      className: "remover remover-categoria",
      textContent: "×"
    });
    definirAria(excluir, { "aria-label": `Excluir categoria ${categoria.nome}` });
    excluir.addEventListener("click", () => this.excluirCategoria(categoria));

    const cabecalho = criar("div", { className: "categoria-cabecalho" }, [alternar, excluir]);
    return criar("section", { className: "categoria" }, [cabecalho, itens]);
  }

  /** Excluir uma categoria leva os itens junto, então aqui a confirmação diz quantos são. */
  private async excluirCategoria(categoria: Categoria): Promise<void> {
    const total = categoria.itens.length;
    const itens = total ? ` e os seus ${total} itens` : "";
    const confirmado = await confirmar(`Excluir a categoria “${categoria.nome}”${itens}?`, {
      confirmarTexto: "Excluir"
    });
    if (!confirmado) return;
    this.app.removerCategoria(categoria.id);
  }

  private criarNovaCategoria(): HTMLElement {
    const campo = criar("input", {
      type: "text",
      id: "nova-categoria",
      placeholder: "Nova categoria…",
      autocomplete: "off"
    });
    definirAria(campo, { "aria-label": "Nome da nova categoria" });

    const botao = criar("button", { type: "submit", className: "btn-adicionar", textContent: "+" });
    definirAria(botao, { "aria-label": "Criar categoria" });

    const form = criar("form", { className: "nova-categoria" }, [campo, botao]);
    form.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const nome = campo.value.trim();
      if (!nome) return;
      campo.value = "";
      this.app.adicionarCategoria(nome);
      campo.focus();
    });

    return form;
  }

  private criarItem(item: Item): HTMLElement {
    const caixa = criar("input", { type: "checkbox", checked: item.marcado });
    caixa.addEventListener("change", () => this.app.marcar(item.id, caixa.checked));

    const remover = criar("button", { type: "button", className: "remover", textContent: "×" });
    definirAria(remover, { "aria-label": `Remover ${item.nome}` });
    remover.addEventListener("click", () => this.app.removerItem(item.id));

    const rotulo = criar("label", {}, [caixa, criar("span", { textContent: item.nome })]);
    return criar("li", { className: "item" }, [rotulo, remover]);
  }

  private criarLinhaAdicionar(categoria: Categoria): HTMLElement {
    const campo = criar("input", {
      type: "text",
      id: `adicionar-${categoria.id}`,
      placeholder: "Adicionar item…",
      autocomplete: "off"
    });
    definirAria(campo, { "aria-label": `Adicionar item em ${categoria.nome}` });

    const botao = criar("button", { type: "submit", className: "btn-adicionar", textContent: "+" });
    definirAria(botao, { "aria-label": `Adicionar em ${categoria.nome}` });

    const form = criar("form", {}, [campo, botao]);
    form.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const nome = campo.value.trim();
      if (!nome) return;
      campo.value = "";
      this.app.adicionarItem(categoria.id, nome);
      campo.focus();
    });

    return criar("li", { className: "item adicionar" }, [form]);
  }

  private async finalizar(): Promise<void> {
    if (!this.app.totalMarcados) {
      await alertar("Marque ao menos um item antes de finalizar a compra.");
      return;
    }
    const confirmado = await confirmar("Registrar esta compra no histórico e começar uma lista nova?", {
      confirmarTexto: "Finalizar"
    });
    if (!confirmado) return;

    this.app.finalizarCompra();
    mostrarToast("✓ Compra finalizada e salva no histórico.", {
      acaoTexto: "Ver histórico",
      aoClicarAcao: this.aoVerHistorico
    });
  }

  private async limpar(): Promise<void> {
    if (!this.app.totalMarcados) return;
    const confirmado = await confirmar("Desmarcar todos os itens da lista?", { confirmarTexto: "Desmarcar" });
    if (!confirmado) return;
    this.app.desmarcarTudo();
  }
}
