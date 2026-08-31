/** Diálogo "Montar com IA": entrega o prompt pronto e recebe o link de volta. */
import { lerListaDoLink, montarPrompt } from "./import-link.js";
import type { ListaEsboco } from "./types.js";
import { criar, mostrarToast } from "./ui.js";

/**
 * Abre o diálogo. `aoReceber` cuida da confirmação e da importação — é o mesmo caminho do
 * link tocado, e a decisão de substituir a lista mora num lugar só.
 */
export function abrirImportacao(aoReceber: (esboco: ListaEsboco) => Promise<void>): void {
  const prompt = montarPrompt(location.origin + location.pathname);

  const campoPrompt = criar("textarea", {
    className: "campo-importar",
    readOnly: true,
    rows: 4,
    value: prompt,
    hidden: true
  });
  const campoLink = criar("textarea", {
    className: "campo-importar",
    rows: 3,
    placeholder: "Cole aqui o link que a IA devolveu"
  });

  const botaoCopiar = criar("button", {
    type: "button",
    className: "btn-secundario",
    textContent: "📋 Copiar prompt"
  });
  const botaoFechar = criar("button", {
    type: "button",
    className: "btn-secundario",
    textContent: "Fechar"
  });
  const botaoImportar = criar("button", {
    type: "button",
    className: "btn-principal",
    textContent: "Importar"
  });

  const dialogo = criar("dialog", { className: "dialogo-confirmar" }, [
    criar("p", {
      textContent:
        "Copie o prompt, cole numa conversa com a IA e peça a lista. Depois cole aqui o link que ela devolver."
    }),
    botaoCopiar,
    campoPrompt,
    campoLink,
    criar("div", { className: "dialogo-acoes" }, [botaoFechar, botaoImportar])
  ]);

  const fechar = () => {
    dialogo.close();
    dialogo.remove();
  };

  botaoCopiar.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      mostrarToast("✓ Prompt copiado.");
    } catch {
      /* Sem clipboard (contexto não seguro, navegador antigo): dá o texto para copiar à mão. */
      campoPrompt.hidden = false;
      campoPrompt.select();
    }
  });

  botaoImportar.addEventListener("click", async () => {
    const esboco = lerListaDoLink(campoLink.value);
    if (!esboco) {
      mostrarToast("Link não reconhecido. Confira se veio inteiro.");
      campoLink.focus();
      return;
    }
    fechar();
    await aoReceber(esboco);
  });

  botaoFechar.addEventListener("click", fechar);
  dialogo.addEventListener("cancel", fechar);
  dialogo.addEventListener("click", (evento) => {
    if (evento.target === dialogo) fechar();
  });

  document.body.append(dialogo);
  dialogo.showModal();
  campoLink.focus();
}
