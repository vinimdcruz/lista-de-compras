/** Composição: monta as peças concretas e liga a tela ao domínio. */
import { VistaHistorico } from "./history-view.js";
import { lerListaDoLink, resumirEsboco } from "./import-link.js";
import { abrirImportacao } from "./import-view.js";
import { VistaLista } from "./list-view.js";
import { ListaDeCompras } from "./shopping-list.js";
import { lerEstadoLegado, RepositorioLocalStorage } from "./storage.js";
import type { ListaEsboco } from "./types.js";
import { confirmar, exigir, mostrarToast } from "./ui.js";

const app = ListaDeCompras.carregar(new RepositorioLocalStorage(), lerEstadoLegado());

const campoData = exigir<HTMLInputElement>("data-lista");
const painelLista = exigir("vista-lista");
const painelHistorico = exigir("vista-historico");
const progresso = exigir("progresso");

const vistaLista = new VistaLista(
  app,
  {
    lista: exigir("lista"),
    contador: exigir("contador"),
    barra: exigir("barra-preenchida"),
    finalizar: exigir<HTMLButtonElement>("finalizar"),
    limpar: exigir<HTMLButtonElement>("limpar")
  },
  () => mostrar("historico")
);

const vistaHistorico = new VistaHistorico(
  app,
  { painel: exigir("historico"), total: exigir("historico-total") },
  () => mostrar("lista")
);

function mostrar(qual: "lista" | "historico"): void {
  const ehHistorico = qual === "historico";
  painelHistorico.hidden = !ehHistorico;
  painelLista.hidden = ehHistorico;
  progresso.hidden = ehHistorico;
}

function renderizar(): void {
  campoData.value = app.lista.data;
  vistaLista.renderizar();
  vistaHistorico.renderizar();
}

/** Substituir a lista atual exige confirmação, venha o esboço do link ou do campo de colar. */
async function importar(esboco: ListaEsboco): Promise<void> {
  const confirmado = await confirmar(
    `Importar esta lista (${resumirEsboco(esboco)})? A lista atual será substituída.`,
    { confirmarTexto: "Importar" }
  );
  if (!confirmado) return;

  app.importarLista(esboco);
  mostrarToast("✓ Lista importada.");
}

/** Importa a lista embutida no link, quando houver. */
async function importarDoLink(): Promise<void> {
  const esboco = lerListaDoLink(location.hash);
  if (!esboco) return;

  /* Limpa a URL antes de perguntar: recarregar a página não deve repetir a importação. */
  history.replaceState(null, "", location.pathname + location.search);

  await importar(esboco);
}

app.assinar(renderizar);

campoData.addEventListener("change", () => app.definirData(campoData.value));
exigir("ver-historico").addEventListener("click", () => mostrar("historico"));
exigir("voltar").addEventListener("click", () => mostrar("lista"));
exigir("montar-ia").addEventListener("click", () => abrirImportacao(importar));

renderizar();
void importarDoLink();
