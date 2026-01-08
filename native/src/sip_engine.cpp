/**
 * @file sip_engine.cpp
 * @brief Implementação do PJSIP Engine wrapper
 */

#include "sip_engine.h"
#include "event_emitter.h"
#include <cstring>
#include <sstream>
#include <algorithm>

namespace echo {

// Instância singleton para callbacks estáticos
SipEngine* SipEngine::s_instance = nullptr;

SipEngine::SipEngine() {
    m_snapshot.connection = SipConnectionState::Idle;
    m_snapshot.callStatus = CallState::Idle;
    m_snapshot.callDirection = CallDirection::None;
    m_snapshot.muted = false;
    m_snapshot.remoteUri = "";
}

SipEngine::~SipEngine() {
    destroy();
}

bool SipEngine::init() {
    if (m_initialized) {
        return true;
    }

    // Definir instância singleton para callbacks
    s_instance = this;

    pj_status_t status;

    // Criar PJSUA
    status = pjsua_create();
    if (status != PJ_SUCCESS) {
        updateSnapshot([](SipSnapshot& s) {
            s.connection = SipConnectionState::Error;
            s.lastError = "Falha ao criar PJSUA";
        });
        return false;
    }

    // Configurar PJSUA
    pjsua_config cfg;
    pjsua_logging_config log_cfg;
    pjsua_media_config media_cfg;

    pjsua_config_default(&cfg);
    pjsua_logging_config_default(&log_cfg);
    pjsua_media_config_default(&media_cfg);

    // Configurar callbacks
    cfg.cb.on_reg_state = &SipEngine::onRegState;
    cfg.cb.on_incoming_call = &SipEngine::onIncomingCall;
    cfg.cb.on_call_state = &SipEngine::onCallState;
    cfg.cb.on_call_media_state = &SipEngine::onCallMediaState;
    cfg.cb.on_call_transfer_status = &SipEngine::onCallTransferStatus;
    cfg.cb.on_dtmf_digit = &SipEngine::onDtmfDigit;

    // Configurar logging
    log_cfg.level = 4;
    log_cfg.console_level = 4;

    // Configurar mídia
    media_cfg.clock_rate = 16000;
    media_cfg.snd_clock_rate = 16000;
    media_cfg.ec_tail_len = 200;
    media_cfg.quality = 10;
    media_cfg.no_vad = PJ_TRUE;

    // Inicializar PJSUA
    status = pjsua_init(&cfg, &log_cfg, &media_cfg);
    if (status != PJ_SUCCESS) {
        pjsua_destroy();
        updateSnapshot([](SipSnapshot& s) {
            s.connection = SipConnectionState::Error;
            s.lastError = "Falha ao inicializar PJSUA";
        });
        return false;
    }

    // Iniciar PJSUA
    status = pjsua_start();
    if (status != PJ_SUCCESS) {
        pjsua_destroy();
        updateSnapshot([](SipSnapshot& s) {
            s.connection = SipConnectionState::Error;
            s.lastError = "Falha ao iniciar PJSUA";
        });
        return false;
    }

    m_initialized = true;
    updateSnapshot([](SipSnapshot& s) {
        s.connection = SipConnectionState::Idle;
    });

    return true;
}

void SipEngine::destroy() {
    if (!m_initialized) {
        return;
    }

    // Encerrar chamadas ativas
    pjsua_call_hangup_all();

    // Desregistrar conta
    if (m_accountId != PJSUA_INVALID_ID) {
        pjsua_acc_del(m_accountId);
        m_accountId = PJSUA_INVALID_ID;
    }

    // Destruir PJSUA
    pjsua_destroy();

    m_initialized = false;
    s_instance = nullptr;

    updateSnapshot([](SipSnapshot& s) {
        s.connection = SipConnectionState::Idle;
        s.callStatus = CallState::Idle;
    });
}

bool SipEngine::isInitialized() const {
    return m_initialized;
}

bool SipEngine::registerAccount(const SipCredentials& credentials) {
    if (!m_initialized) {
        if (!init()) {
            return false;
        }
    }

    // Remover conta anterior se existir
    if (m_accountId != PJSUA_INVALID_ID) {
        pjsua_acc_del(m_accountId);
        m_accountId = PJSUA_INVALID_ID;
    }

    m_domain = credentials.server;
    m_transport = credentials.transport;

    updateSnapshot([&](SipSnapshot& s) {
        s.connection = SipConnectionState::Connecting;
        s.username = credentials.username;
        s.domain = credentials.server;
    });

    // Criar transporte
    pjsua_transport_config tp_cfg;
    pjsua_transport_config_default(&tp_cfg);
    tp_cfg.port = 0; // Porta aleatória

    pjsip_transport_type_e tp_type;
    if (credentials.transport == "tcp") {
        tp_type = PJSIP_TRANSPORT_TCP;
    } else {
        tp_type = PJSIP_TRANSPORT_UDP;
    }

    pjsua_transport_id tp_id;
    pj_status_t status = pjsua_transport_create(tp_type, &tp_cfg, &tp_id);
    if (status != PJ_SUCCESS) {
        updateSnapshot([](SipSnapshot& s) {
            s.connection = SipConnectionState::Error;
            s.lastError = "Falha ao criar transporte";
        });
        return false;
    }

    // Configurar conta
    pjsua_acc_config acc_cfg;
    pjsua_acc_config_default(&acc_cfg);

    // Construir SIP URI
    std::string sipUri = "sip:" + credentials.username + "@" + credentials.server;
    if (credentials.port != 5060) {
        sipUri += ":" + std::to_string(credentials.port);
    }

    // Construir registrar URI
    std::string regUri = "sip:" + credentials.server;
    if (credentials.port != 5060) {
        regUri += ":" + std::to_string(credentials.port);
    }

    // Adicionar transporte à URI
    std::string transportParam = credentials.transport == "tcp" ? ";transport=tcp" : "";
    sipUri += transportParam;
    regUri += transportParam;

    acc_cfg.id = pj_str(const_cast<char*>(sipUri.c_str()));
    acc_cfg.reg_uri = pj_str(const_cast<char*>(regUri.c_str()));

    // Configurar credenciais
    acc_cfg.cred_count = 1;
    acc_cfg.cred_info[0].realm = pj_str(const_cast<char*>("*"));
    acc_cfg.cred_info[0].scheme = pj_str(const_cast<char*>("digest"));
    acc_cfg.cred_info[0].username = pj_str(const_cast<char*>(credentials.username.c_str()));
    acc_cfg.cred_info[0].data_type = PJSIP_CRED_DATA_PLAIN_PASSWD;
    acc_cfg.cred_info[0].data = pj_str(const_cast<char*>(credentials.password.c_str()));

    // Configurar registro
    acc_cfg.reg_timeout = 300;
    acc_cfg.register_on_acc_add = PJ_TRUE;

    // Adicionar conta
    status = pjsua_acc_add(&acc_cfg, PJ_TRUE, &m_accountId);
    if (status != PJ_SUCCESS) {
        updateSnapshot([](SipSnapshot& s) {
            s.connection = SipConnectionState::Error;
            s.lastError = "Falha ao adicionar conta";
        });
        return false;
    }

    return true;
}

bool SipEngine::unregister() {
    if (m_accountId == PJSUA_INVALID_ID) {
        return false;
    }

    pj_status_t status = pjsua_acc_set_registration(m_accountId, PJ_FALSE);
    if (status != PJ_SUCCESS) {
        return false;
    }

    updateSnapshot([](SipSnapshot& s) {
        s.connection = SipConnectionState::Unregistered;
    });

    return true;
}

bool SipEngine::makeCall(const std::string& target) {
    if (m_accountId == PJSUA_INVALID_ID) {
        updateSnapshot([](SipSnapshot& s) {
            s.lastError = "Conta não registrada";
        });
        return false;
    }

    if (m_currentCallId != PJSUA_INVALID_ID) {
        updateSnapshot([](SipSnapshot& s) {
            s.lastError = "Já existe uma chamada em andamento";
        });
        return false;
    }

    std::string targetUri = makeTargetUri(target);
    pj_str_t uri = pj_str(const_cast<char*>(targetUri.c_str()));

    updateSnapshot([&target](SipSnapshot& s) {
        s.callStatus = CallState::Dialing;
        s.callDirection = CallDirection::Outgoing;
        s.remoteUri = target;  // Salvar número chamado
        s.lastError = "";
    });

    pj_status_t status = pjsua_call_make_call(m_accountId, &uri, nullptr, nullptr, nullptr, &m_currentCallId);
    if (status != PJ_SUCCESS) {
        m_currentCallId = PJSUA_INVALID_ID;
        updateSnapshot([](SipSnapshot& s) {
            s.callStatus = CallState::Failed;
            s.lastError = "Falha ao iniciar chamada";
        });
        return false;
    }

    emitEvent("callStarted");
    return true;
}

bool SipEngine::answerCall() {
    if (m_currentCallId == PJSUA_INVALID_ID) {
        return false;
    }

    pj_status_t status = pjsua_call_answer(m_currentCallId, 200, nullptr, nullptr);
    if (status != PJ_SUCCESS) {
        updateSnapshot([](SipSnapshot& s) {
            s.lastError = "Falha ao atender chamada";
        });
        return false;
    }

    return true;
}

bool SipEngine::rejectCall() {
    if (m_currentCallId == PJSUA_INVALID_ID) {
        return false;
    }

    pj_status_t status = pjsua_call_answer(m_currentCallId, 486, nullptr, nullptr);
    if (status != PJ_SUCCESS) {
        return false;
    }

    updateSnapshot([](SipSnapshot& s) {
        s.callStatus = CallState::Terminated;
    });

    m_currentCallId = PJSUA_INVALID_ID;
    emitEvent("callRejected");
    return true;
}

bool SipEngine::hangupCall() {
    if (m_currentCallId == PJSUA_INVALID_ID) {
        return false;
    }

    pj_status_t status = pjsua_call_hangup(m_currentCallId, 0, nullptr, nullptr);
    if (status != PJ_SUCCESS) {
        return false;
    }

    return true;
}

bool SipEngine::sendDtmf(const std::string& digits) {
    if (m_currentCallId == PJSUA_INVALID_ID) {
        return false;
    }

    pj_str_t dtmf = pj_str(const_cast<char*>(digits.c_str()));
    pj_status_t status = pjsua_call_dial_dtmf(m_currentCallId, &dtmf);

    return status == PJ_SUCCESS;
}

bool SipEngine::transferBlind(const std::string& target) {
    if (m_currentCallId == PJSUA_INVALID_ID) {
        return false;
    }

    std::string targetUri = makeTargetUri(target);
    pj_str_t uri = pj_str(const_cast<char*>(targetUri.c_str()));

    pj_status_t status = pjsua_call_xfer(m_currentCallId, &uri, nullptr);
    if (status != PJ_SUCCESS) {
        updateSnapshot([](SipSnapshot& s) {
            s.lastError = "Falha na transferência";
        });
        return false;
    }

    emitEvent("transferStarted");
    return true;
}

bool SipEngine::transferAttended(const std::string& target) {
    if (m_currentCallId == PJSUA_INVALID_ID) {
        return false;
    }

    // Para transferência assistida, primeiro fazemos uma chamada de consulta
    std::string targetUri = makeTargetUri(target);
    pj_str_t uri = pj_str(const_cast<char*>(targetUri.c_str()));

    // Colocar chamada atual em hold
    pjsua_call_set_hold(m_currentCallId, nullptr);

    // Fazer chamada de consulta
    pj_status_t status = pjsua_call_make_call(m_accountId, &uri, nullptr, nullptr, nullptr, &m_consultCallId);
    if (status != PJ_SUCCESS) {
        // Retomar chamada original
        pjsua_call_reinvite(m_currentCallId, PJSUA_CALL_UNHOLD, nullptr);
        updateSnapshot([](SipSnapshot& s) {
            s.lastError = "Falha ao iniciar consulta";
        });
        return false;
    }

    // A transferência será completada quando a chamada de consulta for estabelecida
    // (tratado no callback onCallState)
    
    emitEvent("consultStarted");
    return true;
}

void SipEngine::setMuted(bool muted) {
    m_muted = muted;

    if (m_currentCallId != PJSUA_INVALID_ID) {
        pjsua_call_info ci;
        pjsua_call_get_info(m_currentCallId, &ci);

        if (ci.media_status == PJSUA_CALL_MEDIA_ACTIVE) {
            if (muted) {
                // Desconectar microfone da conferência
                pjsua_conf_disconnect(0, ci.conf_slot);
            } else {
                // Reconectar microfone à conferência
                pjsua_conf_connect(0, ci.conf_slot);
            }
        }
    }

    updateSnapshot([muted](SipSnapshot& s) {
        s.muted = muted;
    });

    emitEvent("muteChanged");
}

bool SipEngine::toggleMuted() {
    setMuted(!m_muted);
    return m_muted;
}

bool SipEngine::isMuted() const {
    return m_muted;
}

std::vector<std::string> SipEngine::getAudioDevices() {
    std::vector<std::string> devices;
    
    unsigned count = PJMEDIA_AUD_MAX_DEVS;
    pjmedia_aud_dev_info info[PJMEDIA_AUD_MAX_DEVS];
    
    pj_status_t status = pjsua_enum_aud_devs(info, &count);
    if (status == PJ_SUCCESS) {
        for (unsigned i = 0; i < count; i++) {
            devices.push_back(std::string(info[i].name));
        }
    }
    
    return devices;
}

bool SipEngine::setAudioDevices(int captureDeviceId, int playbackDeviceId) {
    pj_status_t status = pjsua_set_snd_dev(captureDeviceId, playbackDeviceId);
    return status == PJ_SUCCESS;
}

SipSnapshot SipEngine::getSnapshot() const {
    std::lock_guard<std::mutex> lock(const_cast<std::mutex&>(m_snapshotMutex));
    return m_snapshot;
}

void SipEngine::setEventCallback(EventCallback callback) {
    std::lock_guard<std::mutex> lock(m_callbackMutex);
    m_eventCallback = callback;
}

void SipEngine::processEvents() {
    std::lock_guard<std::mutex> lock(m_eventQueueMutex);
    
    while (!m_eventQueue.empty()) {
        auto& event = m_eventQueue.front();
        
        std::lock_guard<std::mutex> cbLock(m_callbackMutex);
        if (m_eventCallback) {
            m_eventCallback(event.first, event.second);
        }
        
        m_eventQueue.pop();
    }
}

void SipEngine::updateSnapshot(const std::function<void(SipSnapshot&)>& updater) {
    std::lock_guard<std::mutex> lock(m_snapshotMutex);
    updater(m_snapshot);
}

void SipEngine::emitEvent(const std::string& event) {
    SipSnapshot snap = getSnapshot();
    queueEvent(event, snap);
    
    // Também emitir via EventEmitter global (para N-API)
    std::stringstream ss;
    ss << "{";
    ss << "\"connection\":\"" << static_cast<int>(snap.connection) << "\",";
    ss << "\"callStatus\":\"" << static_cast<int>(snap.callStatus) << "\",";
    ss << "\"callDirection\":\"" << static_cast<int>(snap.callDirection) << "\",";
    ss << "\"muted\":" << (snap.muted ? "true" : "false") << ",";
    ss << "\"username\":\"" << snap.username << "\",";
    ss << "\"domain\":\"" << snap.domain << "\"";
    if (!snap.remoteUri.empty()) {
        ss << ",\"remoteUri\":\"" << snap.remoteUri << "\"";
    }
    if (!snap.lastError.empty()) {
        ss << ",\"lastError\":\"" << snap.lastError << "\"";
    }
    if (!snap.incoming.user.empty()) {
        ss << ",\"incoming\":{";
        ss << "\"user\":\"" << snap.incoming.user << "\",";
        ss << "\"displayName\":\"" << snap.incoming.displayName << "\",";
        ss << "\"uri\":\"" << snap.incoming.uri << "\"";
        ss << "}";
    }
    ss << "}";
    
    EventEmitterManager::getInstance().emit(event, ss.str());
}

void SipEngine::queueEvent(const std::string& event, const SipSnapshot& snapshot) {
    std::lock_guard<std::mutex> lock(m_eventQueueMutex);
    m_eventQueue.push({event, snapshot});
}

std::string SipEngine::makeTargetUri(const std::string& target) {
    // Se já é uma URI SIP completa, retorna como está
    if (target.find("sip:") == 0) {
        return target;
    }
    
    // Construir URI
    std::string uri = "sip:" + target + "@" + m_domain;
    
    // Adicionar transporte se TCP
    if (m_transport == "tcp") {
        uri += ";transport=tcp";
    }
    
    return uri;
}

// Callbacks estáticos PJSUA

void SipEngine::onRegState(pjsua_acc_id acc_id) {
    if (!s_instance) return;
    
    pjsua_acc_info info;
    pjsua_acc_get_info(acc_id, &info);
    
    s_instance->updateSnapshot([&info](SipSnapshot& s) {
        if (info.status == PJSIP_SC_OK) {
            s.connection = SipConnectionState::Registered;
            s.lastError = "";
        } else {
            s.connection = SipConnectionState::Unregistered;
            s.lastError = "Registro falhou: " + std::to_string(info.status);
        }
    });
    
    if (info.status == PJSIP_SC_OK) {
        s_instance->emitEvent("registered");
    } else {
        s_instance->emitEvent("unregistered");
    }
}

void SipEngine::onIncomingCall(pjsua_acc_id acc_id, pjsua_call_id call_id, pjsip_rx_data* rdata) {
    (void)acc_id;
    (void)rdata;
    
    if (!s_instance) return;
    
    // Se já existe chamada, rejeitar
    if (s_instance->m_currentCallId != PJSUA_INVALID_ID) {
        pjsua_call_answer(call_id, 486, nullptr, nullptr);
        return;
    }
    
    s_instance->m_currentCallId = call_id;
    
    // Obter informações do chamador
    pjsua_call_info ci;
    pjsua_call_get_info(call_id, &ci);
    
    std::string remoteUri(ci.remote_info.ptr, ci.remote_info.slen);
    std::string displayName;
    std::string user;
    
    // Extrair display name e user do URI
    size_t ltPos = remoteUri.find('<');
    if (ltPos != std::string::npos) {
        displayName = remoteUri.substr(0, ltPos);
        // Remover aspas e espaços
        displayName.erase(std::remove(displayName.begin(), displayName.end(), '"'), displayName.end());
        displayName.erase(std::remove(displayName.begin(), displayName.end(), ' '), displayName.end());
    }
    
    size_t sipPos = remoteUri.find("sip:");
    size_t atPos = remoteUri.find('@');
    if (sipPos != std::string::npos && atPos != std::string::npos) {
        user = remoteUri.substr(sipPos + 4, atPos - sipPos - 4);
    }
    
    s_instance->updateSnapshot([&](SipSnapshot& s) {
        s.callStatus = CallState::Incoming;
        s.callDirection = CallDirection::Incoming;
        s.incoming.displayName = displayName;
        s.incoming.user = user;
        s.incoming.uri = remoteUri;
        s.incoming.callId = call_id;
    });
    
    // Responder com 180 Ringing
    pjsua_call_answer(call_id, 180, nullptr, nullptr);
    
    s_instance->emitEvent("incomingCall");
}

void SipEngine::onCallState(pjsua_call_id call_id, pjsip_event* e) {
    (void)e;
    
    if (!s_instance) return;
    
    pjsua_call_info ci;
    pjsua_call_get_info(call_id, &ci);
    
    // Mapear estado PJSIP para nosso estado
    CallState newState = CallState::Idle;
    std::string event;
    
    switch (ci.state) {
        case PJSIP_INV_STATE_CALLING:
            newState = CallState::Dialing;
            event = "dialing";
            break;
            
        case PJSIP_INV_STATE_INCOMING:
            newState = CallState::Incoming;
            event = "incoming";
            break;
            
        case PJSIP_INV_STATE_EARLY:
            newState = CallState::Ringing;
            event = "ringing";
            break;
            
        case PJSIP_INV_STATE_CONNECTING:
            newState = CallState::Establishing;
            event = "connecting";
            break;
            
        case PJSIP_INV_STATE_CONFIRMED:
            newState = CallState::Established;
            event = "established";
            break;
            
        case PJSIP_INV_STATE_DISCONNECTED:
            newState = CallState::Terminated;
            event = "terminated";
            
            // Limpar referência da chamada
            if (call_id == s_instance->m_currentCallId) {
                s_instance->m_currentCallId = PJSUA_INVALID_ID;
            }
            if (call_id == s_instance->m_consultCallId) {
                s_instance->m_consultCallId = PJSUA_INVALID_ID;
            }
            break;
            
        default:
            break;
    }
    
    // Extrair informações da chamada
    std::string remoteInfo;
    if (ci.remote_info.ptr && ci.remote_info.slen > 0) {
        remoteInfo = std::string(ci.remote_info.ptr, ci.remote_info.slen);
    }
    
    // Determinar direção da chamada
    CallDirection direction = s_instance->m_snapshot.callDirection;
    if (direction == CallDirection::None) {
        // Se não temos direção salva, determinar pela chamada
        if (ci.role == PJSIP_ROLE_UAC) {
            direction = CallDirection::Outgoing;
        } else if (ci.role == PJSIP_ROLE_UAS) {
            direction = CallDirection::Incoming;
        }
    }
    
    s_instance->updateSnapshot([newState, remoteInfo, direction](SipSnapshot& s) {
        s.callStatus = newState;
        s.callDirection = direction;
        
        // Preservar remoteUri para chamadas saindo
        if (direction == CallDirection::Outgoing) {
            // Se ainda não temos remoteUri, tentar extrair do remote_info
            if (s.remoteUri.empty() && !remoteInfo.empty()) {
                // Tentar extrair número do URI
                // Formato pode ser: "Display Name" <sip:numero@domain> ou sip:numero@domain
                size_t ltPos = remoteInfo.find('<');
                size_t gtPos = remoteInfo.find('>');
                std::string uriPart = remoteInfo;
                
                // Se tem < >, extrair parte dentro
                if (ltPos != std::string::npos && gtPos != std::string::npos && gtPos > ltPos) {
                    uriPart = remoteInfo.substr(ltPos + 1, gtPos - ltPos - 1);
                }
                
                // Extrair número (parte antes do @)
                size_t sipPos = uriPart.find("sip:");
                size_t atPos = uriPart.find('@');
                if (sipPos != std::string::npos) {
                    if (atPos != std::string::npos && atPos > sipPos) {
                        s.remoteUri = uriPart.substr(sipPos + 4, atPos - sipPos - 4);
                    } else {
                        // Se não tem @, pegar tudo depois de sip:
                        s.remoteUri = uriPart.substr(sipPos + 4);
                    }
                } else {
                    // Se não tem sip:, usar como está (pode ser só o número)
                    s.remoteUri = uriPart;
                }
            }
            // Se já temos remoteUri, preservar (não sobrescrever)
        }
        
        if (newState == CallState::Terminated || newState == CallState::Idle) {
            s.callDirection = CallDirection::None;
            s.incoming = IncomingCallInfo();
            s.remoteUri = "";  // Limpar quando chamada termina
        }
    });
    
    if (!event.empty()) {
        s_instance->emitEvent(event);
    }
    
    // Se a chamada de consulta foi estabelecida, completar transferência assistida
    if (call_id == s_instance->m_consultCallId && ci.state == PJSIP_INV_STATE_CONFIRMED) {
        // Transferir chamada original para a chamada de consulta
        pjsua_call_xfer_replaces(
            s_instance->m_currentCallId,
            s_instance->m_consultCallId,
            PJSUA_XFER_NO_REQUIRE_REPLACES,
            nullptr
        );
    }
}

void SipEngine::onCallMediaState(pjsua_call_id call_id) {
    if (!s_instance) return;
    
    pjsua_call_info ci;
    pjsua_call_get_info(call_id, &ci);
    
    if (ci.media_status == PJSUA_CALL_MEDIA_ACTIVE) {
        // Conectar áudio
        pjsua_conf_connect(ci.conf_slot, 0);
        
        // Conectar microfone apenas se não estiver em mute
        if (!s_instance->m_muted) {
            pjsua_conf_connect(0, ci.conf_slot);
        }
        
        s_instance->emitEvent("mediaActive");
    }
}

void SipEngine::onCallTransferStatus(pjsua_call_id call_id, int st_code, 
                                      const pj_str_t* st_text, pj_bool_t final_,
                                      pj_bool_t* p_cont) {
    (void)call_id;
    (void)st_text;
    (void)p_cont;
    
    if (!s_instance) return;
    
    if (final_) {
        if (st_code >= 200 && st_code < 300) {
            s_instance->emitEvent("transferSuccess");
            // Encerrar chamada após transferência bem sucedida
            s_instance->hangupCall();
        } else {
            s_instance->updateSnapshot([st_code](SipSnapshot& s) {
                s.lastError = "Transferência falhou: " + std::to_string(st_code);
            });
            s_instance->emitEvent("transferFailed");
        }
    }
}

void SipEngine::onDtmfDigit(pjsua_call_id call_id, int digit) {
    (void)call_id;
    
    if (!s_instance) return;
    
    char digitChar = static_cast<char>(digit);
    std::string digitStr(1, digitChar);
    
    EventEmitterManager::getInstance().emit("dtmfReceived", 
        "{\"digit\":\"" + digitStr + "\"}");
}

} // namespace echo
