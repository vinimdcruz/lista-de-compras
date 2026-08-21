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
