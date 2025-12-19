import { getStorage, setStorage } from './servicoArmazenamento'

export type Contato = {
  id: string
  name: string
  number: string
  createdAt: number
}

const STORAGE_KEY = 'contacts'

export async function adicionarContato(nome: string, numero: string): Promise<Contato> {
  const contatos = await obterContatos()
  
  // Verifica se já existe um contato com o mesmo número
  const contatoExistente = contatos.find(c => c.number === numero)
  if (contatoExistente) {
    // Atualiza o contato existente com o novo nome
    return await atualizarContato(contatoExistente.id, { name: nome })
  }
  
  const novoContato: Contato = {
    id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    name: nome.trim(),
    number: numero.trim(),
    createdAt: Date.now(),
  }
  
  contatos.push(novoContato)
  await setStorage(STORAGE_KEY, contatos)
  return novoContato
}

export async function obterContatos(): Promise<Contato[]> {
  try {
    const contatos = await getStorage<Contato[]>(STORAGE_KEY)
    return contatos || []
  } catch (error) {
    console.error('Erro ao carregar contatos:', error)
    return []
  }
}

export async function excluirContato(id: string): Promise<void> {
  const contatos = await obterContatos()
  const filtrados = contatos.filter((contato) => contato.id !== id)
  await setStorage(STORAGE_KEY, filtrados)
}

export async function atualizarContato(
  id: string,
  updates: Partial<Omit<Contato, 'id' | 'createdAt'>>
): Promise<Contato> {
  const contatos = await obterContatos()
  const indice = contatos.findIndex((contato) => contato.id === id)
  
  if (indice === -1) {
    throw new Error(`Contato não encontrado: ${id}`)
  }
  
  contatos[indice] = { ...contatos[indice], ...updates }
  await setStorage(STORAGE_KEY, contatos)
  return contatos[indice]
}

export async function obterContatoPorNumero(numero: string): Promise<Contato | null> {
  const contatos = await obterContatos()
  return contatos.find(c => c.number === numero) || null
}

// Aliases para manter compatibilidade durante a transição
export const getContacts = obterContatos
export const addContact = adicionarContato
export const deleteContact = excluirContato
export const updateContact = atualizarContato
export const getContactByNumber = obterContatoPorNumero
export type Contact = Contato


