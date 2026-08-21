import type { Estado, EstadoLegado } from "./types.js";

/**
 * Porta de persistência. O domínio depende desta interface, nunca do localStorage —
 * é o que permite testar as regras fora do navegador, com um repositório em memória.
 */
export interface RepositorioEstado {
  ler(): Estado | null;
  gravar(estado: Estado): void;
}

const CHAVE = "supermercado:v2";
const CHAVE_MARCADOS_V1 = "supermercado:marcados";
const CHAVE_ABERTAS_V1 = "supermercado:abertas";

/**
 * Implementação sobre o localStorage. Toda leitura e escrita é protegida: em aba anônima
 * ou com cookies bloqueados o acesso lança, e o app precisa seguir funcionando sem salvar.
 */
export class RepositorioLocalStorage implements RepositorioEstado {
  ler(): Estado | null {
    const estado = lerJson<Estado>(CHAVE);
    if (!estado || !estado.atual || !Array.isArray(estado.atual.categorias)) return null;

    return {
      atual: estado.atual,
      historico: Array.isArray(estado.historico) ? estado.historico : [],
      abertas: Array.isArray(estado.abertas) ? estado.abertas : []
    };
  }

  gravar(estado: Estado): void {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch {
      /* Sem persistência disponível: a sessão atual continua funcionando. */
    }
  }
}

/** Lê o formato da primeira versão do app, para migrar na primeira abertura desta. */
export function lerEstadoLegado(): EstadoLegado | null {
  const marcados = lerJson<string[]>(CHAVE_MARCADOS_V1);
  const abertas = lerJson<string[]>(CHAVE_ABERTAS_V1);
  if (!Array.isArray(marcados) && !Array.isArray(abertas)) return null;

  return {
    marcados: Array.isArray(marcados) ? marcados : [],
    abertas: Array.isArray(abertas) ? abertas : []
  };
}

function lerJson<T>(chave: string): T | null {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}
