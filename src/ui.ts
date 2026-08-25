/** Utilitários de tela compartilhados pelas vistas. */

/** Cria um elemento já com suas propriedades e filhos, evitando a ladainha de createElement. */
export function criar<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  filhos: Array<Node | string> = []
): HTMLElementTagNameMap[K] {
  const elemento = Object.assign(document.createElement(tag), props);
  for (const filho of filhos) elemento.append(filho);
  return elemento;
}

export function definirAria(elemento: Element, atributos: Record<string, string>): void {
  for (const [nome, valor] of Object.entries(atributos)) elemento.setAttribute(nome, valor);
}

/** Busca um elemento obrigatório do HTML. Falhar cedo é melhor que um null silencioso. */
export function exigir<T extends HTMLElement>(id: string): T {
  const elemento = document.getElementById(id);
  if (!elemento) throw new Error(`Elemento #${id} não encontrado no HTML.`);
  return elemento as T;
}

/**
 * Confirmação via <dialog> nativo, no lugar do window.confirm padrão do navegador
 * (que em alguns navegadores mobile aparece com aviso extra de "Suppress dialogs").
 */
export function confirmar(
  mensagem: string,
  opcoes: { confirmarTexto?: string; cancelarTexto?: string } = {}
): Promise<boolean> {
  return new Promise((resolve) => {
    const botaoCancelar = criar("button", {
      type: "button",
      className: "btn-secundario",
      textContent: opcoes.cancelarTexto ?? "Cancelar"
    });
    const botaoConfirmar = criar("button", {
      type: "button",
      className: "btn-principal",
      textContent: opcoes.confirmarTexto ?? "Confirmar"
    });
    const dialogo = criar("dialog", { className: "dialogo-confirmar" }, [
      criar("p", { textContent: mensagem }),
      criar("div", { className: "dialogo-acoes" }, [botaoCancelar, botaoConfirmar])
    ]);

    const fechar = (valor: boolean) => {
      dialogo.close();
      dialogo.remove();
      resolve(valor);
    };
    botaoCancelar.addEventListener("click", () => fechar(false));
    botaoConfirmar.addEventListener("click", () => fechar(true));
    dialogo.addEventListener("cancel", () => fechar(false));
    dialogo.addEventListener("click", (evento) => {
      if (evento.target === dialogo) fechar(false);
    });

    document.body.append(dialogo);
    dialogo.showModal();
    botaoConfirmar.focus();
  });
}

/** Aviso via <dialog> nativo, no lugar do window.alert padrão do navegador. */
export function alertar(mensagem: string, opcoes: { botaoTexto?: string } = {}): Promise<void> {
  return new Promise((resolve) => {
    const botaoOk = criar("button", {
      type: "button",
      className: "btn-principal",
      textContent: opcoes.botaoTexto ?? "OK"
    });
    const dialogo = criar("dialog", { className: "dialogo-confirmar" }, [
      criar("p", { textContent: mensagem }),
      criar("div", { className: "dialogo-acoes" }, [botaoOk])
    ]);

    const fechar = () => {
      dialogo.close();
      dialogo.remove();
      resolve();
    };
    botaoOk.addEventListener("click", fechar);
    dialogo.addEventListener("cancel", fechar);
    dialogo.addEventListener("click", (evento) => {
      if (evento.target === dialogo) fechar();
    });

    document.body.append(dialogo);
    dialogo.showModal();
    botaoOk.focus();
  });
}

/** Toast de feedback temporário, com ação opcional (ex: "Ver histórico"). */
export function mostrarToast(
  mensagem: string,
  opcoes: { acaoTexto?: string; aoClicarAcao?: () => void; duracaoMs?: number } = {}
): void {
  const toast = criar("div", { className: "toast", role: "status" }, [
    criar("span", { textContent: mensagem })
  ]);
  const remover = () => toast.remove();

  if (opcoes.acaoTexto && opcoes.aoClicarAcao) {
    const aoClicarAcao = opcoes.aoClicarAcao;
    const botaoAcao = criar("button", { type: "button", className: "toast-acao", textContent: opcoes.acaoTexto });
    botaoAcao.addEventListener("click", () => {
      aoClicarAcao();
      remover();
    });
    toast.append(botaoAcao);
  }

  document.body.append(toast);
  requestAnimationFrame(() => toast.classList.add("toast-visivel"));
  setTimeout(remover, opcoes.duracaoMs ?? 4000);
}

/** aaaa-mm-dd → dd/mm/aaaa. */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : iso;
}

/**
 * As vistas redesenham por inteiro a cada mudança, o que é simples e mantém tela e estado
 * em sincronia — mas descartaria o campo em que a pessoa está digitando. Isto devolve o
 * foco, o texto e a posição do cursor depois do redesenho.
 */
export function preservandoFoco(redesenhar: () => void): void {
  const ativo = document.activeElement;
  const ehCampo = ativo instanceof HTMLInputElement && ativo.id !== "";
  const foco = ehCampo
    ? { id: ativo.id, valor: ativo.value, cursor: ativo.selectionStart }
    : null;

  redesenhar();

  if (!foco) return;
  const campo = document.getElementById(foco.id);
  if (!(campo instanceof HTMLInputElement)) return;
  campo.focus();
  if (campo.type === "text") {
    campo.value = foco.valor;
    campo.setSelectionRange(foco.cursor, foco.cursor);
  }
}
