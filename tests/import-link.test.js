import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { emojiPara, lerListaDoLink, montarPrompt, resumirEsboco } from "../public/js/import-link.js";

const APP = "https://lista.example/";

describe("lerListaDoLink", () => {
  it("lê o link inteiro, na ordem em que veio", () => {
    const esboco = lerListaDoLink(`${APP}#importar=Hortifruti:Banana,Limão;Mercearia:Arroz,Café`);

    assert.deepEqual(
      esboco.categorias.map((c) => c.nome),
      ["Hortifruti", "Mercearia"]
    );
    assert.deepEqual(esboco.categorias[0].itens, ["Banana", "Limão"]);
    assert.deepEqual(esboco.categorias[1].itens, ["Arroz", "Café"]);
  });

  it("lê o payload sozinho, como chega do campo de colar", () => {
    const doLink = lerListaDoLink(`${APP}#importar=Mercearia:Arroz`);
    const doPayload = lerListaDoLink("Mercearia:Arroz");

    assert.deepEqual(doPayload, doLink);
  });

  it("lê o hash cru do navegador", () => {
    assert.deepEqual(lerListaDoLink("#importar=Mercearia:Arroz").categorias[0].itens, ["Arroz"]);
  });

  it('devolve "+" como espaço e %26 como &', () => {
    const esboco = lerListaDoLink("#importar=Hortifruti+%26+Temperos:Cheiro-verde");

    assert.equal(esboco.categorias[0].nome, "Hortifruti & Temperos");
  });

  it("usa o emoji do catálogo quando o nome bate, mesmo sem acento ou caixa", () => {
    const esboco = lerListaDoLink("#importar=acougue+%26+peixaria:Ovos;Padaria:Pão");

    assert.equal(esboco.categorias[0].emoji, "🥩");
    assert.equal(esboco.categorias[1].emoji, "🛒");
  });

  it("descarta categoria sem nome ou sem item, e devolve null se não sobrar nenhuma", () => {
    const esboco = lerListaDoLink("#importar=:Arroz;Mercearia:Café;Limpeza:");

    assert.equal(esboco.categorias.length, 1);
    assert.equal(esboco.categorias[0].nome, "Mercearia");
    assert.equal(lerListaDoLink("#importar=Limpeza:;:x"), null);
  });

  it("devolve null para hash vazio, lixo e escape quebrado", () => {
    assert.equal(lerListaDoLink(""), null);
    assert.equal(lerListaDoLink("#importar="), null);
    assert.equal(lerListaDoLink("#importar=lixo"), null);
    assert.equal(lerListaDoLink("#importar=Mercearia:%E0%A4%A"), null);
  });

  it("corta o excesso de itens, de categorias e de texto", () => {
    const muitos = Array.from({ length: 250 }, (_, i) => `item${i}`).join(",");
    assert.equal(lerListaDoLink(`#importar=Mercearia:${muitos}`).categorias[0].itens.length, 200);

    const muitas = Array.from({ length: 60 }, (_, i) => `Cat${i}:x`).join(";");
    assert.equal(lerListaDoLink(`#importar=${muitas}`).categorias.length, 50);

    const longo = "a".repeat(120);
    assert.equal(lerListaDoLink(`#importar=Mercearia:${longo}`).categorias[0].itens[0].length, 80);
  });
});

describe("emojiPara", () => {
  it("casa com o catálogo ignorando acento e caixa", () => {
    assert.equal(emojiPara("LATICÍNIOS & FRIOS"), "🧀");
    assert.equal(emojiPara("Laticinios & Frios"), "🧀");
  });

  it("cai no padrão para categoria de fora do catálogo", () => {
    assert.equal(emojiPara("Pet shop"), "🛒");
  });
});

describe("resumirEsboco", () => {
  it("faz plural só quando precisa", () => {
    assert.equal(resumirEsboco(lerListaDoLink("#importar=Mercearia:Arroz")), "1 categoria e 1 item");
    assert.equal(
      resumirEsboco(lerListaDoLink("#importar=Mercearia:Arroz,Café;Limpeza:Esponja")),
      "2 categorias e 3 itens"
    );
  });
});

describe("montarPrompt", () => {
  it("embute a URL do app e produz um exemplo que o parser aceita", () => {
    const prompt = montarPrompt(APP);
    const exemplo = prompt.split("\n").filter((linha) => linha.startsWith(`${APP}#importar=`)).pop();

    assert.ok(exemplo, "o prompt precisa terminar com um link de exemplo");
    assert.deepEqual(
      lerListaDoLink(exemplo).categorias.map((c) => c.nome),
      ["Hortifruti & Temperos", "Mercearia & Bebidas"]
    );
  });
});
