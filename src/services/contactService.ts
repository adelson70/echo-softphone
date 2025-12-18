import { getStorage, setStorage } from './storageService'

export type Contact = {
  id: string
  name: string
  number: string
  createdAt: number
}

const STORAGE_KEY = 'contacts'

export async function addContact(name: string, number: string): Promise<Contact> {
  const contacts = await getContacts()
  
  // Verifica se já existe um contato com o mesmo número
  const existingContact = contacts.find(c => c.number === number)
  if (existingContact) {
    // Atualiza o contato existente com o novo nome
    return await updateContact(existingContact.id, { name })
  }
  
  const newContact: Contact = {
    id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    name: name.trim(),
    number: number.trim(),
    createdAt: Date.now(),
  }
  
  contacts.push(newContact)
  await setStorage(STORAGE_KEY, contacts)
  return newContact
}

export async function getContacts(): Promise<Contact[]> {
  try {
    const contacts = await getStorage<Contact[]>(STORAGE_KEY)
    return contacts || []
  } catch (error) {
    console.error('Erro ao carregar contatos:', error)
    return []
  }
}

export async function deleteContact(id: string): Promise<void> {
  const contacts = await getContacts()
  const filtered = contacts.filter((contact) => contact.id !== id)
  await setStorage(STORAGE_KEY, filtered)
}

export async function updateContact(
  id: string,
  updates: Partial<Omit<Contact, 'id' | 'createdAt'>>
): Promise<Contact> {
  const contacts = await getContacts()
  const index = contacts.findIndex((contact) => contact.id === id)
  
  if (index === -1) {
    throw new Error(`Contato não encontrado: ${id}`)
  }
  
  contacts[index] = { ...contacts[index], ...updates }
  await setStorage(STORAGE_KEY, contacts)
  return contacts[index]
}

export async function getContactByNumber(number: string): Promise<Contact | null> {
  const contacts = await getContacts()
  return contacts.find(c => c.number === number) || null
}

