/** Composição: monta as peças concretas e liga a tela ao domínio. */
import { VistaHistorico } from "./history-view.js";
import { VistaLista } from "./list-view.js";
import { ListaDeCompras } from "./shopping-list.js";
import { lerEstadoLegado, RepositorioLocalStorage } from "./storage.js";
import { exigir } from "./ui.js";

const app = ListaDeCompras.carregar(new RepositorioLocalStorage(), lerEstadoLegado());

const campoData = exigir<HTMLInputElement>("data-lista");
const painelLista = exigir("vista-lista");
const painelHistorico = exigir("vista-historico");
const progresso = exigir("progresso");

const vistaLista = new VistaLista(app, {
  lista: exigir("lista"),
  contador: exigir("contador"),
  barra: exigir("barra-preenchida"),
  finalizar: exigir<HTMLButtonElement>("finalizar"),
  limpar: exigir<HTMLButtonElement>("limpar")
});

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

app.assinar(renderizar);

campoData.addEventListener("change", () => app.definirData(campoData.value));
exigir("ver-historico").addEventListener("click", () => mostrar("historico"));
exigir("voltar").addEventListener("click", () => mostrar("lista"));

renderizar();
