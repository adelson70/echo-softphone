# Echo - Softphone SIP

<div align="center">

![Echo Logo](build/icon.svg)

**Softphone SIP multiplataforma com interface moderna e intuitiva para chamadas VoIP profissionais**

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?style=flat-square&logo=github)](https://github.com/adelson70/softphonejs)
[![Website](https://img.shields.io/badge/Website-Landing%20Page-green?style=flat-square)](https://echo-landingpage-eta.vercel.app/)
[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)](LICENSE)

</div>

## 📋 Sobre

O **Echo** é um softphone SIP moderno e profissional desenvolvido com tecnologias web de ponta. Disponível para Windows, macOS e Linux, oferece uma experiência completa de comunicação VoIP com recursos avançados de gerenciamento de chamadas, histórico completo, agenda de contatos e controle de áudio.

### ✨ Características Principais

- 🎯 **Interface Moderna**: Design intuitivo e responsivo com Tailwind CSS
- 📞 **Chamadas Completas**: Suporte para chamadas de entrada e saída
- 🌐 **Multi-Protocolo**: Suporte a **UDP**, **TCP** e **WebSocket (WSS)**
- 🔇 **Controle de Áudio**: Mute, speaker e ajustes de volume
- 📋 **Histórico de Chamadas**: Registro completo com busca e filtros
- 👥 **Agenda de Contatos**: Gerenciamento completo de contatos com busca
- 🔄 **Transferência de Chamadas**: Transferência assistida e cega
- ⌨️ **DTMF**: Envio de tons DTMF durante chamadas
- 🔊 **Feedback de Áudio**: Sons para diferentes estados de chamada
- 💾 **Armazenamento Local**: Dados salvos localmente com Electron Store
- 🔐 **Auto-registro**: Reconexão automática com credenciais salvas

## 🛠️ Tecnologias

### Core
- **[Electron](https://www.electronjs.org/)** - Framework multiplataforma
- **[React](https://react.dev/)** - Biblioteca UI
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática
- **[Vite](https://vitejs.dev/)** - Build tool e dev server

### Comunicação SIP
| Protocolo | Biblioteca | Uso |
|-----------|------------|-----|
| **WSS** (WebSocket) | [SIP.js](https://sipjs.com/) | WebRTC em navegadores |
| **UDP/TCP** | [PJSIP](https://pjsip.org/) | Módulo nativo C++ |

### UI/UX
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utilitário
- **[Lucide React](https://lucide.dev/)** - Ícones
- **[React Router](https://reactrouter.com/)** - Roteamento

### Armazenamento
- **[Electron Store](https://github.com/sindresorhus/electron-store)** - Persistência local

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ e npm
- Git
- Para UDP/TCP: Visual Studio (Windows) ou build-essential (Linux)

### Instalação Básica (apenas WebSocket)

```bash
# Clone o repositório
git clone https://github.com/adelson70/softphonejs.git
cd softphonejs

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev

# Gere o build de produção
npm run build
```

### Instalação Completa (com suporte UDP/TCP)

Para habilitar suporte a UDP e TCP, é necessário compilar o módulo nativo:

```bash
# Clone o repositório
git clone https://github.com/adelson70/softphonejs.git
cd softphonejs

# Instale as dependências
npm install

# Configure e compile PJSIP
npm run native:setup

# Compile o módulo nativo
npm run native:build

# Execute
npm run dev

# Ou build completo
npm run build:full
```

📚 **Documentação detalhada**: [docs/INTEGRACAO_NATIVA.md](docs/INTEGRACAO_NATIVA.md)

## 📖 Uso

### Primeiro Acesso

1. Ao iniciar o aplicativo, você será direcionado para a tela de registro
2. Informe suas credenciais SIP:
   - **Usuário SIP**: Seu nome de usuário/extension
   - **Senha SIP**: Sua senha
   - **Domínio SIP**: O servidor SIP (ex: `sip.suaempresa.com`)
3. Em **Opções Avançadas**, selecione o protocolo de transporte:
   - **WSS**: WebSocket Secure (padrão, funciona em todos os casos)
   - **UDP**: Requer módulo nativo
   - **TCP**: Requer módulo nativo
4. Clique em **Registrar** para conectar ao servidor SIP

### Funcionalidades

#### 📞 Discador
- Digite o número ou extensão diretamente
- Use o teclado numérico para discagem
- Visualize o status da conexão no topo da tela

#### 📋 Histórico de Chamadas
- Acesse todas as chamadas realizadas e recebidas
- Busque por número ou nome
- Adicione números do histórico aos contatos
- Limpe o histórico completo quando necessário

#### 👥 Contatos
- Adicione, edite e remova contatos
- Busque contatos por nome ou número
- Discagem rápida diretamente da lista de contatos

#### 🎛️ Durante a Chamada
- **Mute/Unmute**: Controle do microfone
- **Speaker**: Alternar entre fone de ouvido e viva-voz
- **Teclado DTMF**: Envie tons durante a chamada
- **Transferência**: Transfira chamadas (assistida ou cega)
- **Desligar**: Encerre a chamada

## 🏗️ Estrutura do Projeto

```
softphonejs/
├── electron/              # Código do processo principal Electron
│   ├── app/              # Configurações e paths
│   ├── ipc/              # Handlers IPC (store, window, sip)
│   ├── windows/          # Gerenciamento de janelas
│   └── main.ts           # Entry point Electron
├── native/               # Módulo nativo PJSIP (opcional)
│   ├── src/              # Código C++ do addon
│   ├── deps/             # PJSIP source
│   └── binding.gyp       # Configuração de build
├── src/
│   ├── app/              # Componentes principais e rotas
│   ├── components/       # Componentes React
│   │   ├── chamadas/     # Componentes de chamada
│   │   ├── contacts/     # Componentes de contatos
│   │   ├── historico/    # Componentes de histórico
│   │   └── ui/           # Componentes UI reutilizáveis
│   ├── pages/            # Páginas principais
│   ├── services/         # Serviços de negócio
│   ├── sip/              # Lógica SIP
│   │   ├── config/       # Configuração SIP
│   │   ├── core/         # Clientes SIP (WebSocket e Nativo)
│   │   ├── media/        # Áudio e DTMF
│   │   ├── native/       # Cliente nativo via IPC
│   │   └── react/        # Hooks React para SIP
│   └── styles/           # Estilos globais
├── scripts/              # Scripts de build e setup
├── build/                # Ícones e assets
├── docs/                 # Documentação
└── dist-electron/        # Build do Electron
```

## 🔧 Configuração

### Protocolos de Transporte

| Protocolo | Porta Padrão | Requer Nativo | Notas |
|-----------|--------------|---------------|-------|
| **WSS** | 8089 | Não | Funciona em qualquer ambiente |
| **UDP** | 5060 | Sim | Melhor para redes confiáveis |
| **TCP** | 5060 | Sim | Mais confiável que UDP |

### Servidor SIP

O Echo suporta conexão via:

- **WebSocket**: URL completa (`wss://servidor.com:8089/ws`) ou host (`servidor.com`)
- **UDP/TCP**: Domínio e porta (`servidor.com:5060`)

**Nota**: A porta 5060 (SIP padrão) é bloqueada pelo Chromium para WebSocket. Use a porta WSS do seu PBX (geralmente 8088 ou 8089) para conexões WebSocket.

### Armazenamento

As configurações e dados são armazenados localmente usando Electron Store:
- Credenciais SIP
- Histórico de chamadas
- Lista de contatos

Em modo portátil, os dados ficam em uma pasta `data/` ao lado do executável.

## 📝 Scripts Disponíveis

### Desenvolvimento
- `npm run dev` - Inicia o aplicativo em modo desenvolvimento
- `npm run lint` - Executa o linter ESLint
- `npm run preview` - Preview do build de produção

### Build
- `npm run build` - Compila o projeto e gera os instaladores
- `npm run build:native` - Compila apenas o módulo nativo
- `npm run build:full` - Compila nativo + aplicativo

### Módulo Nativo
- `npm run native:setup` - Baixa e configura PJSIP
- `npm run native:build` - Compila o módulo nativo
- `npm run native:rebuild` - Recompila o módulo
- `npm run native:clean` - Limpa arquivos de build

### Plataformas
- `npm run windows` - Build para Windows (Portable .exe)
- `npm run linux` - Build para Linux (AppImage)
- `npm run mac` - Build para macOS (zip)
- `npm run all` - Build para todas as plataformas

## 🎨 Interface

A interface foi projetada com foco em:
- **Usabilidade**: Navegação intuitiva e clara
- **Acessibilidade**: Suporte a navegação por teclado
- **Responsividade**: Adaptação a diferentes tamanhos de tela
- **Feedback Visual**: Indicadores claros de estado e ações

## 🔒 Segurança

- Credenciais SIP armazenadas localmente de forma segura
- Comunicação via WSS (WebSocket Secure) quando disponível
- SRTP disponível com módulo nativo (PJSIP)
- Sem transmissão de dados para servidores externos

## 📚 Documentação Adicional

- [Integração do Módulo Nativo](docs/INTEGRACAO_NATIVA.md) - Guia completo para UDP/TCP

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado. Todos os direitos reservados.

O módulo nativo usa PJSIP que está sob GPL v2 ou licença comercial.

## 🔗 Links

- **Repositório**: [GitHub](https://github.com/adelson70/softphonejs)
- **Website**: [Landing Page](https://echo-landingpage-eta.vercel.app/)
- **Documentação PJSIP**: [pjsip.org](https://www.pjsip.org/)
- **Documentação SIP.js**: [sipjs.com](https://sipjs.com/)

## 👨‍💻 Autor

Desenvolvido com ❤️ por [adelson70](https://github.com/adelson70)

---

<div align="center">

**Echo - Sua solução profissional para comunicação VoIP**

*Agora com suporte a UDP, TCP e WebSocket*

</div>
