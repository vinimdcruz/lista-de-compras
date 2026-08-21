import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  ListaDeCompras,
  contarItens,
  contarMarcados,
  criarEstadoInicial,
  hoje
} from "../public/js/shopping-list.js";

/** Repositório em memória: o domínio não sabe que o localStorage existe. */
class RepositorioMemoria {
  constructor(estado = null) {
    this.estado = estado;
    this.gravacoes = 0;
  }
  ler() {
    return this.estado;
  }
  gravar(estado) {
    this.estado = structuredClone(estado);
    this.gravacoes++;
  }
}

const idsDosItens = (app, idCategoria) =>
  app.lista.categorias.find((c) => c.id === idCategoria).itens;

describe("ListaDeCompras", () => {
  let repositorio;
  let app;

  beforeEach(() => {
    repositorio = new RepositorioMemoria();
    app = ListaDeCompras.carregar(repositorio, null);
  });

  it("começa pelo catálogo padrão, com a data de hoje e nada marcado", () => {
    assert.equal(app.lista.categorias.length, 6);
    assert.equal(app.totalItens, 42);
    assert.equal(app.totalMarcados, 0);
    assert.equal(app.lista.data, hoje());
  });

  it("adiciona um item na categoria pedida e ignora nome em branco", () => {
    app.adicionarItem("hortifruti", "  Abacate  ");
    app.adicionarItem("hortifruti", "   ");

    const nomes = idsDosItens(app, "hortifruti").map((item) => item.nome);
    assert.ok(nomes.includes("Abacate"), "nome deve entrar sem espaços nas pontas");
    assert.equal(app.totalItens, 43);
  });

  it("remove um item sem afetar a marcação dos vizinhos", () => {
    const [primeiro, segundo] = idsDosItens(app, "hortifruti");
    app.marcar(segundo.id, true);
    app.removerItem(primeiro.id);

    const restantes = idsDosItens(app, "hortifruti");
    assert.ok(!restantes.some((item) => item.id === primeiro.id));
    assert.equal(restantes.find((item) => item.id === segundo.id).marcado, true);
    assert.equal(app.totalItens, 41);
  });

  it("grava no repositório a cada mudança", () => {
    app.adicionarItem("mercearia", "Azeite");
    assert.equal(repositorio.gravacoes, 1);
    assert.equal(contarItens(repositorio.ler().atual.categorias), 43);
  });

  it("finaliza a compra guardando o estado marcado e recomeça a lista", () => {
    const [primeiro] = idsDosItens(app, "hortifruti");
    app.marcar(primeiro.id, true);
    app.definirData("2026-08-15");
    app.finalizarCompra();

    assert.equal(app.historico.length, 1);
    assert.equal(app.historico[0].data, "2026-08-15", "a compra guarda a data em que foi feita");
    assert.equal(contarMarcados(app.historico[0].categorias), 1);
    assert.equal(app.totalMarcados, 0, "a lista nova vem desmarcada");
    assert.equal(app.lista.data, hoje(), "a lista nova volta para hoje");
    assert.equal(app.totalItens, 42, "a lista nova mantém os itens");
  });

  it("guarda uma cópia da compra, imune a edições posteriores da lista", () => {
    const [primeiro] = idsDosItens(app, "hortifruti");
    app.marcar(primeiro.id, true);
    app.finalizarCompra();
    app.removerItem(primeiro.id);

    assert.equal(contarItens(app.historico[0].categorias), 42, "o histórico não muda");
    assert.equal(app.totalItens, 41);
  });

  it("usa uma compra anterior como lista nova, desmarcada e com a data de hoje", () => {
    app.adicionarItem("hortifruti", "Abacate");
    app.marcar(idsDosItens(app, "hortifruti")[0].id, true);
    app.definirData("2026-08-15");
    app.finalizarCompra();

    app.removerItem(idsDosItens(app, "hortifruti")[0].id);
    app.usarCompraComoNovaLista(app.historico[0].id);

    const nomes = idsDosItens(app, "hortifruti").map((item) => item.nome);
    assert.ok(nomes.includes("Abacate"), "os itens da compra voltam");
    assert.equal(app.totalItens, 43);
    assert.equal(app.totalMarcados, 0);
    assert.equal(app.lista.data, hoje());
  });

  it("exclui uma compra do histórico", () => {
    app.marcar(idsDosItens(app, "hortifruti")[0].id, true);
    app.finalizarCompra();
    app.excluirCompra(app.historico[0].id);
    assert.equal(app.historico.length, 0);
  });

  it("avisa os assinantes a cada mudança", () => {
    let avisos = 0;
    app.assinar(() => avisos++);
    app.adicionarItem("mercearia", "Azeite");
    app.desmarcarTudo();
    assert.equal(avisos, 2);
  });

  it("retoma o estado já gravado em vez de recomeçar do catálogo", () => {
    app.adicionarItem("mercearia", "Azeite");
    const retomado = ListaDeCompras.carregar(repositorio, null);
    assert.equal(retomado.totalItens, 43);
  });
});

describe("criarEstadoInicial", () => {
  it("reaplica as marcas da versão antiga, que usavam a posição do item", () => {
    const estado = criarEstadoInicial({ marcados: ["hortifruti:0", "mercearia:1"], abertas: ["mercearia"] });

    assert.equal(contarMarcados(estado.atual.categorias), 2);
    assert.equal(estado.atual.categorias.find((c) => c.id === "hortifruti").itens[0].marcado, true);
    assert.deepEqual(estado.abertas, ["mercearia"]);
  });

  it("ignora referências antigas que não existem mais", () => {
    const estado = criarEstadoInicial({ marcados: ["inexistente:0", "hortifruti:999"], abertas: [] });
    assert.equal(contarMarcados(estado.atual.categorias), 0);
  });
});
