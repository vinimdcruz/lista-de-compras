/* Lista de compras — lista editável, com data como título e histórico de compras.
   Tudo persiste no localStorage do navegador. */
(function () {
  "use strict";

  var CHAVE = "supermercado:v2";
  var CHAVE_MARCADOS_V1 = "supermercado:marcados";
  var CHAVE_ABERTAS_V1 = "supermercado:abertas";

  /* Catálogo inicial: serve para a primeira lista de quem abre o app pela primeira vez.
     Depois disso a lista vive no estado e pode ser editada livremente. */
  var CATALOGO = [
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
  var progresso = document.getElementById("progresso");
  var campoData = document.getElementById("data-lista");
  var painelHistorico = document.getElementById("historico");
  var totalHistorico = document.getElementById("historico-total");
  var vistaLista = document.getElementById("vista-lista");
  var vistaHistorico = document.getElementById("vista-historico");

  function novoId() {
    return "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function hoje() {
    var d = new Date();
    var mes = String(d.getMonth() + 1);
    var dia = String(d.getDate());
    return d.getFullYear() + "-" + (mes.length < 2 ? "0" + mes : mes) + "-" + (dia.length < 2 ? "0" + dia : dia);
  }

  function formatarData(iso) {
    var partes = String(iso).split("-");
    return partes.length === 3 ? partes[2] + "/" + partes[1] + "/" + partes[0] : iso;
  }

  function clonar(valor) {
    return JSON.parse(JSON.stringify(valor));
  }

  function listaPadrao() {
    return {
      data: hoje(),
      categorias: CATALOGO.map(function (categoria) {
        return {
          id: categoria.id,
          nome: categoria.nome,
          emoji: categoria.emoji,
          itens: categoria.itens.map(function (nome) {
            return { id: novoId(), nome: nome, marcado: false };
          })
        };
      })
    };
  }

  /* A versão anterior guardava só os ids "categoria:indice" dos itens marcados.
     Reaproveita essas marcas na primeira abertura da versão nova. */
  function migrarV1(atual) {
    try {
      var marcados = JSON.parse(localStorage.getItem(CHAVE_MARCADOS_V1) || "[]");
      if (!Array.isArray(marcados)) return;
      marcados.forEach(function (id) {
        var partes = String(id).split(":");
        var categoria = atual.categorias.filter(function (c) { return c.id === partes[0]; })[0];
        var item = categoria && categoria.itens[Number(partes[1])];
        if (item) item.marcado = true;
      });
    } catch (erro) {
      /* Marcas antigas ilegíveis: a lista nova começa limpa. */
    }
  }

  function carregar() {
    var padrao = { atual: listaPadrao(), historico: [], abertas: [CATALOGO[0].id] };
    try {
      var bruto = localStorage.getItem(CHAVE);
      if (!bruto) {
        migrarV1(padrao.atual);
        var abertasV1 = JSON.parse(localStorage.getItem(CHAVE_ABERTAS_V1) || "null");
        if (Array.isArray(abertasV1)) padrao.abertas = abertasV1;
        return padrao;
      }
      var salvo = JSON.parse(bruto);
      if (!salvo || !salvo.atual || !Array.isArray(salvo.atual.categorias)) return padrao;
      salvo.historico = Array.isArray(salvo.historico) ? salvo.historico : [];
      salvo.abertas = Array.isArray(salvo.abertas) ? salvo.abertas : [];
      return salvo;
    } catch (erro) {
      return padrao;
    }
  }

  /* localStorage pode falhar (aba anônima, cookies bloqueados): a sessão segue funcionando. */
  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch (erro) {
      /* Sem persistência disponível. */
    }
  }

  var estado = carregar();

  function contarMarcados(categorias) {
    var total = 0;
    categorias.forEach(function (categoria) {
      categoria.itens.forEach(function (item) {
        if (item.marcado) total++;
      });
    });
    return total;
  }

  function contarItens(categorias) {
    var total = 0;
    categorias.forEach(function (categoria) {
      total += categoria.itens.length;
    });
    return total;
  }

  function atualizarTotais() {
    estado.atual.categorias.forEach(function (categoria) {
      var rotulo = document.getElementById("contagem-" + categoria.id);
      if (rotulo) {
        rotulo.textContent = contarMarcados([categoria]) + "/" + categoria.itens.length;
      }
    });

    var total = contarItens(estado.atual.categorias);
    var feitos = contarMarcados(estado.atual.categorias);
    contador.textContent = feitos + " de " + total + " itens";
    barra.style.width = total ? (feitos / total) * 100 + "%" : "0%";
  }

  function criarItem(categoria, item) {
    var li = document.createElement("li");
    li.className = "item";

    var label = document.createElement("label");

    var caixa = document.createElement("input");
    caixa.type = "checkbox";
    caixa.checked = !!item.marcado;
    caixa.addEventListener("change", function () {
      item.marcado = caixa.checked;
      salvar();
      atualizarTotais();
    });

    var texto = document.createElement("span");
    texto.textContent = item.nome;

    label.appendChild(caixa);
    label.appendChild(texto);

    var remover = document.createElement("button");
    remover.type = "button";
    remover.className = "remover";
    remover.textContent = "×";
    remover.setAttribute("aria-label", "Remover " + item.nome);
    remover.addEventListener("click", function () {
      categoria.itens = categoria.itens.filter(function (outro) { return outro.id !== item.id; });
      salvar();
      renderizarLista();
    });

    li.appendChild(label);
    li.appendChild(remover);
    return li;
  }

  function criarLinhaAdicionar(categoria) {
    var li = document.createElement("li");
    li.className = "item adicionar";

    var form = document.createElement("form");

    var campo = document.createElement("input");
    campo.type = "text";
    campo.id = "adicionar-" + categoria.id;
    campo.placeholder = "Adicionar item…";
    campo.autocomplete = "off";
    campo.setAttribute("aria-label", "Adicionar item em " + categoria.nome);

    var botao = document.createElement("button");
    botao.type = "submit";
    botao.className = "btn-adicionar";
    botao.textContent = "+";
    botao.setAttribute("aria-label", "Adicionar em " + categoria.nome);

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      var nome = campo.value.trim();
      if (!nome) return;
      categoria.itens.push({ id: novoId(), nome: nome, marcado: false });
      salvar();
      renderizarLista(categoria.id);
    });

    form.appendChild(campo);
    form.appendChild(botao);
    li.appendChild(form);
    return li;
  }

  function criarCategoria(categoria) {
    var secao = document.createElement("section");
    secao.className = "categoria";

    var aberta = estado.abertas.indexOf(categoria.id) !== -1;
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

    categoria.itens.forEach(function (item) {
      itens.appendChild(criarItem(categoria, item));
    });
    itens.appendChild(criarLinhaAdicionar(categoria));

    botao.addEventListener("click", function () {
      var vaiAbrir = itens.hidden;
      itens.hidden = !vaiAbrir;
      botao.setAttribute("aria-expanded", String(vaiAbrir));

      var posicao = estado.abertas.indexOf(categoria.id);
      if (vaiAbrir && posicao === -1) estado.abertas.push(categoria.id);
      if (!vaiAbrir && posicao !== -1) estado.abertas.splice(posicao, 1);
      salvar();
    });

    secao.appendChild(botao);
    secao.appendChild(itens);
    return secao;
  }

  /* Redesenha a lista inteira: são poucas dezenas de itens, e manter um único caminho
     de renderização evita o DOM sair de sincronia com o estado. */
  function renderizarLista(focarCategoria) {
    lista.textContent = "";
    estado.atual.categorias.forEach(function (categoria) {
      lista.appendChild(criarCategoria(categoria));
    });
    atualizarTotais();

    if (focarCategoria) {
      var campo = document.getElementById("adicionar-" + focarCategoria);
      if (campo) campo.focus();
    }
  }

  function criarCartaoHistorico(compra) {
    var cartao = document.createElement("article");
    cartao.className = "compra";

    var titulo = document.createElement("h3");
    titulo.textContent = formatarData(compra.data);

    var resumo = document.createElement("p");
    resumo.className = "compra-resumo";
    resumo.textContent = contarMarcados(compra.categorias) + " de " +
      contarItens(compra.categorias) + " itens comprados";

    var acoes = document.createElement("div");
    acoes.className = "compra-acoes";

    var carregar = document.createElement("button");
    carregar.type = "button";
    carregar.className = "btn-secundario";
    carregar.textContent = "Usar como nova lista";
    carregar.addEventListener("click", function () {
      if (!window.confirm("Substituir a lista atual pelos itens da compra de " +
          formatarData(compra.data) + "?")) return;

      estado.atual = { data: hoje(), categorias: clonar(compra.categorias) };
      estado.atual.categorias.forEach(function (categoria) {
        categoria.itens.forEach(function (item) { item.marcado = false; });
      });
      salvar();
      campoData.value = estado.atual.data;
      renderizarLista();
      mostrarVista("lista");
    });

    var excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "btn-secundario perigo";
    excluir.textContent = "Excluir";
    excluir.addEventListener("click", function () {
      if (!window.confirm("Excluir a compra de " + formatarData(compra.data) + " do histórico?")) return;
      estado.historico = estado.historico.filter(function (outra) { return outra.id !== compra.id; });
      salvar();
      renderizarHistorico();
    });

    acoes.appendChild(carregar);
    acoes.appendChild(excluir);

    cartao.appendChild(titulo);
    cartao.appendChild(resumo);
    cartao.appendChild(acoes);
    return cartao;
  }

  function renderizarHistorico() {
    painelHistorico.textContent = "";
    totalHistorico.textContent = String(estado.historico.length);

    if (!estado.historico.length) {
      var vazio = document.createElement("p");
      vazio.className = "vazio";
      vazio.textContent = "Nenhuma compra registrada ainda. Ao terminar uma lista, toque em “Finalizar compra”.";
      painelHistorico.appendChild(vazio);
      return;
    }

    estado.historico.forEach(function (compra) {
      painelHistorico.appendChild(criarCartaoHistorico(compra));
    });
  }

  function mostrarVista(qual) {
    var ehHistorico = qual === "historico";
    vistaHistorico.hidden = !ehHistorico;
    vistaLista.hidden = ehHistorico;
    progresso.hidden = ehHistorico;
  }

  campoData.value = estado.atual.data;
  campoData.addEventListener("change", function () {
    estado.atual.data = campoData.value || hoje();
    salvar();
  });

  document.getElementById("ver-historico").addEventListener("click", function () {
    renderizarHistorico();
    mostrarVista("historico");
  });

  document.getElementById("voltar").addEventListener("click", function () {
    mostrarVista("lista");
  });

  document.getElementById("finalizar").addEventListener("click", function () {
    if (!contarMarcados(estado.atual.categorias)) {
      window.alert("Marque ao menos um item antes de finalizar a compra.");
      return;
    }
    if (!window.confirm("Registrar esta compra no histórico e começar uma lista nova?")) return;

    estado.historico.unshift({
      id: novoId(),
      data: estado.atual.data,
      salvoEm: new Date().toISOString(),
      categorias: clonar(estado.atual.categorias)
    });

    /* A lista nova mantém os mesmos itens, tudo desmarcado, com a data de hoje. */
    estado.atual.data = hoje();
    estado.atual.categorias.forEach(function (categoria) {
      categoria.itens.forEach(function (item) { item.marcado = false; });
    });

    salvar();
    campoData.value = estado.atual.data;
    renderizarLista();
    renderizarHistorico();
  });

  document.getElementById("limpar").addEventListener("click", function () {
    if (!contarMarcados(estado.atual.categorias)) return;
    if (!window.confirm("Desmarcar todos os itens da lista?")) return;

    estado.atual.categorias.forEach(function (categoria) {
      categoria.itens.forEach(function (item) { item.marcado = false; });
    });
    salvar();
    renderizarLista();
  });

  renderizarLista();
  renderizarHistorico();
})();
