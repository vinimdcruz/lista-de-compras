/* Lista de compras — estado dos itens e das categorias persistido no localStorage. */
(function () {
  "use strict";

  var CHAVE_MARCADOS = "supermercado:marcados";
  var CHAVE_ABERTAS = "supermercado:abertas";

  var CATEGORIAS = [
    {
      id: "hortifruti",
      nome: "Hortifruti & Temperos",
      emoji: "🥬",
      itens: ["Banana", "Limão", "Tomate", "Cebola", "Alho", "Batata", "Alface", "Cheiro-verde"]
    },
    {
      id: "acougue",
      nome: "Açougue & Peixaria",
      emoji: "🥩",
      itens: ["Peito de frango", "Patinho moído", "Bife de alcatra", "Filé de tilápia", "Linguiça toscana", "Ovos"]
    },
    {
      id: "laticinios",
      nome: "Laticínios & Frios",
      emoji: "🧀",
      itens: ["Leite integral", "Queijo mussarela", "Requeijão", "Iogurte natural", "Manteiga", "Presunto"]
    },
    {
      id: "mercearia",
      nome: "Mercearia & Bebidas",
      emoji: "🛍️",
      itens: ["Pão", "Café", "Arroz", "Feijão", "Macarrão", "Açúcar", "Óleo de soja", "Água mineral", "Suco de laranja"]
    },
    {
      id: "suplementos",
      nome: "Suplementos & Lanches",
      emoji: "🥤",
      itens: ["Whey protein", "Creatina", "Barra de cereal", "Castanha de caju", "Pasta de amendoim", "Biscoito integral"]
    },
    {
      id: "limpeza",
      nome: "Limpeza & Casa",
      emoji: "🧴",
      itens: ["Detergente", "Sabão em pó", "Amaciante", "Papel higiênico", "Saco de lixo", "Esponja", "Desinfetante"]
    }
  ];

  var lista = document.getElementById("lista");
  var contador = document.getElementById("contador");
  var barra = document.getElementById("barra-preenchida");
  var botaoLimpar = document.getElementById("limpar");

  /* localStorage pode falhar (modo privado, cookies bloqueados) — nunca deixar quebrar a tela. */
  function carregar(chave, padrao) {
    try {
      var bruto = localStorage.getItem(chave);
      if (!bruto) return padrao;
      var valor = JSON.parse(bruto);
      return Array.isArray(valor) ? valor : padrao;
    } catch (erro) {
      return padrao;
    }
  }

  function salvar(chave, valor) {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch (erro) {
      /* Sem persistência disponível: a sessão atual continua funcionando. */
    }
  }

  var marcados = carregar(CHAVE_MARCADOS, []);
  var abertas = carregar(CHAVE_ABERTAS, [CATEGORIAS[0].id]);

  function idDoItem(categoria, indice) {
    return categoria.id + ":" + indice;
  }

  function estaMarcado(id) {
    return marcados.indexOf(id) !== -1;
  }

  function definirMarcado(id, marcado) {
    var posicao = marcados.indexOf(id);
    if (marcado && posicao === -1) marcados.push(id);
    if (!marcado && posicao !== -1) marcados.splice(posicao, 1);
    salvar(CHAVE_MARCADOS, marcados);
  }

  function atualizarTotais() {
    var total = 0;
    var feitos = 0;

    CATEGORIAS.forEach(function (categoria) {
      var feitosNaCategoria = 0;
      categoria.itens.forEach(function (_, indice) {
        if (estaMarcado(idDoItem(categoria, indice))) feitosNaCategoria++;
      });
      total += categoria.itens.length;
      feitos += feitosNaCategoria;

      var rotulo = document.getElementById("contagem-" + categoria.id);
      if (rotulo) rotulo.textContent = feitosNaCategoria + "/" + categoria.itens.length;
    });

    contador.textContent = feitos + " de " + total + " itens";
    barra.style.width = total ? (feitos / total) * 100 + "%" : "0%";
  }

  function criarCategoria(categoria) {
    var secao = document.createElement("section");
    secao.className = "categoria";

    var aberta = abertas.indexOf(categoria.id) !== -1;
    var idItens = "itens-" + categoria.id;

    var botao = document.createElement("button");
    botao.type = "button";
    botao.className = "categoria-botao";
    botao.setAttribute("aria-expanded", String(aberta));
    botao.setAttribute("aria-controls", idItens);

    var emoji = document.createElement("span");
    emoji.className = "categoria-emoji";
    emoji.textContent = categoria.emoji;
    emoji.setAttribute("aria-hidden", "true");

    var nome = document.createElement("span");
    nome.className = "categoria-nome";
    nome.textContent = categoria.nome;

    var contagem = document.createElement("span");
    contagem.className = "categoria-contagem";
    contagem.id = "contagem-" + categoria.id;

    var seta = document.createElement("span");
    seta.className = "seta";
    seta.textContent = "▶";
    seta.setAttribute("aria-hidden", "true");

    botao.appendChild(emoji);
    botao.appendChild(nome);
    botao.appendChild(contagem);
    botao.appendChild(seta);

    var itens = document.createElement("ul");
    itens.className = "itens";
    itens.id = idItens;
    itens.hidden = !aberta;

    categoria.itens.forEach(function (nomeItem, indice) {
      var id = idDoItem(categoria, indice);

      var li = document.createElement("li");
      li.className = "item";

      var label = document.createElement("label");

      var caixa = document.createElement("input");
      caixa.type = "checkbox";
      caixa.checked = estaMarcado(id);
      caixa.addEventListener("change", function () {
        definirMarcado(id, caixa.checked);
        atualizarTotais();
      });

      var texto = document.createElement("span");
      texto.textContent = nomeItem;

      label.appendChild(caixa);
      label.appendChild(texto);
      li.appendChild(label);
      itens.appendChild(li);
    });

    botao.addEventListener("click", function () {
      var vaiAbrir = itens.hidden;
      itens.hidden = !vaiAbrir;
      botao.setAttribute("aria-expanded", String(vaiAbrir));

      var posicao = abertas.indexOf(categoria.id);
      if (vaiAbrir && posicao === -1) abertas.push(categoria.id);
      if (!vaiAbrir && posicao !== -1) abertas.splice(posicao, 1);
      salvar(CHAVE_ABERTAS, abertas);
    });

    secao.appendChild(botao);
    secao.appendChild(itens);
    return secao;
  }

  function renderizar() {
    var fragmento = document.createDocumentFragment();
    CATEGORIAS.forEach(function (categoria) {
      fragmento.appendChild(criarCategoria(categoria));
    });
    lista.appendChild(fragmento);
    atualizarTotais();
  }

  botaoLimpar.addEventListener("click", function () {
    if (!marcados.length) return;
    if (!window.confirm("Desmarcar todos os itens da lista?")) return;

    marcados = [];
    salvar(CHAVE_MARCADOS, marcados);

    var caixas = lista.querySelectorAll("input[type=checkbox]");
    for (var i = 0; i < caixas.length; i++) caixas[i].checked = false;

    atualizarTotais();
  });

  renderizar();
})();
