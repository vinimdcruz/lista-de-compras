import { CATALOGO, EMOJI_PADRAO } from "./catalog.js";
import type { CategoriaEsboco, ListaEsboco } from "./types.js";

/** Nome do parâmetro no fragmento da URL: #importar=<lista>. */
export const PARAMETRO_IMPORTAR = "importar";

/*
 * Formato do payload: Categoria:item,item;Categoria:item — sem aspas, sem chaves e sem
 * espaço cru. Quem escreve o link é um assistente numa conversa de chat, e é justamente
 * em aspas e chaves que ele erra o escape e que o detector de link corta a URL no meio.
 */
const SEPARADOR_CATEGORIA = ";";
const SEPARADOR_NOME = ":";
const SEPARADOR_ITEM = ",";

/*
 * O payload vem de fora, então nada entra sem teto e sem checagem de forma. Fora do
 * formato, a importação simplesmente não acontece.
 */
const MAX_CATEGORIAS = 50;
const MAX_ITENS_POR_CATEGORIA = 200;
const MAX_TEXTO = 80;

/** Tira acento e caixa para casar "Hortifruti & Temperos" com a categoria do catálogo. */
function normalizar(nome: string): string {
  return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/** Emoji da categoria: o do catálogo quando o nome bate, senão o padrão. */
export function emojiPara(nome: string): string {
  const alvo = normalizar(nome);
  return CATALOGO.find((semente) => normalizar(semente.nome) === alvo)?.emoji ?? EMOJI_PADRAO;
}

function texto(bruto: string): string {
  return bruto.trim().slice(0, MAX_TEXTO);
}

function lerCategoria(bruta: string): CategoriaEsboco | null {
  const corte = bruta.indexOf(SEPARADOR_NOME);
  if (corte < 0) return null;

  const nome = texto(bruta.slice(0, corte));
  if (!nome) return null;

  const itens = bruta
    .slice(corte + 1)
    .split(SEPARADOR_ITEM)
    .slice(0, MAX_ITENS_POR_CATEGORIA)
    .map(texto)
    .filter((item) => item !== "");
  if (!itens.length) return null;

  return { nome, emoji: emojiPara(nome), itens };
}

/**
 * Isola o payload. Aceita o hash do navegador e também o link inteiro colado à mão, que é
 * o que chega pelo campo de colar quando o assistente quebra a formatação.
 */
function extrairPayload(bruto: string): string {
  const marca = `#${PARAMETRO_IMPORTAR}=`;
  const inicio = bruto.indexOf(marca);
  if (inicio >= 0) return bruto.slice(inicio + marca.length);

  /* Sem a marca, ainda pode ser só o payload: "#importar=" já veio removido. */
  const prefixo = `${PARAMETRO_IMPORTAR}=`;
  return bruto.startsWith(prefixo) ? bruto.slice(prefixo.length) : bruto.replace(/^#/, "");
}

/**
 * Lê a lista embutida no fragmento da URL (ou num link colado). Devolve null quando não
 * há nada para importar ou quando o payload não tem a forma esperada.
 */
export function lerListaDoLink(hash: string): ListaEsboco | null {
  const payload = extrairPayload(hash.trim());
  if (!payload) return null;

  /* O "+" no lugar do espaço é o que mantém a URL inteira ao ser detectada como link. */
  let decodificado: string;
  try {
    decodificado = decodeURIComponent(payload.replace(/\+/g, " "));
  } catch {
    return null;
  }

  const categorias = decodificado
    .split(SEPARADOR_CATEGORIA)
    .slice(0, MAX_CATEGORIAS)
    .map(lerCategoria)
    .filter((categoria): categoria is CategoriaEsboco => categoria !== null);

  return categorias.length ? { categorias } : null;
}

/** Resumo curto para a confirmação, já que quem importa não vê o conteúdo do link. */
export function resumirEsboco(esboco: ListaEsboco): string {
  const categorias = esboco.categorias.length;
  const itens = esboco.categorias.reduce((total, categoria) => total + categoria.itens.length, 0);
  const contar = (quantidade: number, singular: string, plural: string) =>
    `${quantidade} ${quantidade === 1 ? singular : plural}`;
  return `${contar(categorias, "categoria", "categorias")} e ${contar(itens, "item", "itens")}`;
}

/**
 * Instrução para colar num assistente. Fica aqui, ao lado do parser: mudou o formato,
 * muda o prompt junto.
 */
export function montarPrompt(base: string): string {
  const exemplo = `${base.replace(/\/+$/, "")}/#${PARAMETRO_IMPORTAR}=`;
  return [
    "Monte uma lista de compras de supermercado e me devolva SÓ um link, nada mais.",
    "",
    `Formato do link: ${exemplo}Categoria${SEPARADOR_NOME}item${SEPARADOR_ITEM}item${SEPARADOR_CATEGORIA}Categoria${SEPARADOR_NOME}item`,
    "",
    "Regras do link:",
    `- "${SEPARADOR_CATEGORIA}" separa categorias, "${SEPARADOR_NOME}" separa o nome dos itens, "${SEPARADOR_ITEM}" separa itens.`,
    '- Troque todo espaço por "+". Nunca deixe espaço cru no link.',
    '- Troque "&" por "%26".',
    "- Não use aspas, chaves, colchetes nem quebra de linha dentro do link.",
    "- Acento pode ir normal.",
    "",
    "Use de preferência estas categorias:",
    ...CATALOGO.map((semente) => `- ${semente.nome}`),
    "",
    "Exemplo de resposta:",
    `${exemplo}Hortifruti+%26+Temperos${SEPARADOR_NOME}Banana${SEPARADOR_ITEM}Tomate${SEPARADOR_CATEGORIA}Mercearia+%26+Bebidas${SEPARADOR_NOME}Arroz${SEPARADOR_ITEM}Café`,
    "",
    "Minha lista:"
  ].join("\n");
}
