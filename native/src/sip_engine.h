/**
 * @file sip_engine.h
 * @brief PJSIP Engine wrapper para o Echo Softphone
 * 
 * Este arquivo define a classe SipEngine que encapsula toda a funcionalidade
 * PJSIP para sinalização SIP via UDP/TCP e gestão de mídia RTP.
 */

#ifndef SIP_ENGINE_H
#define SIP_ENGINE_H

#include <string>
#include <functional>
#include <memory>
#include <mutex>
#include <atomic>
#include <queue>

// PJSIP headers
extern "C" {
#include <pjsua-lib/pjsua.h>
}

namespace echo {

/**
 * @brief Credenciais SIP para registro
 */
struct SipCredentials {
    std::string username;
    std::string password;
    std::string server;
    int port;
    std::string transport; // "udp" ou "tcp"
};

/**
 * @brief Informações de uma chamada entrante
 */
struct IncomingCallInfo {
    std::string displayName;
    std::string user;
    std::string uri;
    int callId;
};

/**
 * @brief Estados de conexão SIP
 */
enum class SipConnectionState {
    Idle,
    Connecting,
    Connected,
    Registered,
    Unregistered,
    Error
};

/**
 * @brief Estados de chamada
 */
enum class CallState {
    Idle,
    Dialing,
    Ringing,
    Incoming,
    Establishing,
    Established,
    Terminating,
    Terminated,
    Failed
};

/**
 * @brief Direção da chamada
 */
enum class CallDirection {
    None,
    Outgoing,
    Incoming
};

/**
 * @brief Snapshot do estado atual do cliente SIP
 */
struct SipSnapshot {
    SipConnectionState connection;
    CallState callStatus;
    CallDirection callDirection;
    IncomingCallInfo incoming;
    std::string lastError;
    std::string username;
    std::string domain;
    std::string remoteUri;  // URI/número da chamada saindo
    bool muted;
};

/**
 * @brief Tipo de callback para eventos
 */
using EventCallback = std::function<void(const std::string& event, const SipSnapshot& snapshot)>;

/**
 * @brief Classe principal que encapsula PJSIP
 */
class SipEngine {
public:
    SipEngine();
    ~SipEngine();

    // Impede cópia
    SipEngine(const SipEngine&) = delete;
    SipEngine& operator=(const SipEngine&) = delete;

    /**
     * @brief Inicializa o endpoint PJSIP
     * @return true se sucesso
     */
    bool init();

    /**
     * @brief Destrói o endpoint PJSIP
     */
    void destroy();

    /**
     * @brief Verifica se está inicializado
     */
    bool isInitialized() const;

    /**
     * @brief Registra no servidor SIP
     * @param credentials Credenciais de acesso
     * @return true se registro iniciado com sucesso
     */
    bool registerAccount(const SipCredentials& credentials);

    /**
     * @brief Desregistra do servidor SIP
     * @return true se sucesso
     */
    bool unregister();

    /**
     * @brief Inicia uma chamada
     * @param target Número ou URI de destino
     * @return true se chamada iniciada
     */
    bool makeCall(const std::string& target);

    /**
     * @brief Atende uma chamada entrante
     * @return true se sucesso
     */
    bool answerCall();

    /**
     * @brief Rejeita uma chamada entrante
     * @return true se sucesso
     */
    bool rejectCall();

    /**
     * @brief Encerra a chamada atual
     * @return true se sucesso
     */
    bool hangupCall();

    /**
     * @brief Envia DTMF
     * @param digits Dígitos DTMF (0-9, *, #)
     * @return true se sucesso
     */
    bool sendDtmf(const std::string& digits);

    /**
     * @brief Transferência cega
     * @param target Destino da transferência
     * @return true se sucesso
     */
    bool transferBlind(const std::string& target);

    /**
     * @brief Transferência assistida
     * @param target Destino da transferência
     * @return true se sucesso
     */
    bool transferAttended(const std::string& target);

    /**
     * @brief Define mute do microfone
     * @param muted true para silenciar
     */
    void setMuted(bool muted);

    /**
     * @brief Alterna mute
     * @return novo estado de mute
     */
    bool toggleMuted();

    /**
     * @brief Retorna se está em mute
     */
    bool isMuted() const;

    /**
     * @brief Obtém lista de dispositivos de áudio
     * @return Vector com nomes dos dispositivos
     */
    std::vector<std::string> getAudioDevices();

    /**
     * @brief Define dispositivo de áudio
     * @param captureDeviceId ID do dispositivo de captura
     * @param playbackDeviceId ID do dispositivo de reprodução
     * @return true se sucesso
     */
    bool setAudioDevices(int captureDeviceId, int playbackDeviceId);

    /**
     * @brief Obtém snapshot do estado atual
     */
    SipSnapshot getSnapshot() const;

    /**
     * @brief Define callback de eventos
     */
    void setEventCallback(EventCallback callback);

    /**
     * @brief Processa eventos pendentes (chamado periodicamente)
     */
    void processEvents();

private:
    // Estado interno
    std::atomic<bool> m_initialized{false};
    std::atomic<bool> m_muted{false};
    
    pjsua_acc_id m_accountId{PJSUA_INVALID_ID};
    pjsua_call_id m_currentCallId{PJSUA_INVALID_ID};
    pjsua_call_id m_consultCallId{PJSUA_INVALID_ID}; // Para transferência assistida
    
    SipSnapshot m_snapshot;
    std::mutex m_snapshotMutex;
    
    EventCallback m_eventCallback;
    std::mutex m_callbackMutex;
    
    std::string m_domain;
    std::string m_transport;
    
    // Fila de eventos para processar no thread principal
    std::queue<std::pair<std::string, SipSnapshot>> m_eventQueue;
    std::mutex m_eventQueueMutex;

    // Métodos auxiliares
    void updateSnapshot(const std::function<void(SipSnapshot&)>& updater);
    void emitEvent(const std::string& event);
    void queueEvent(const std::string& event, const SipSnapshot& snapshot);
    std::string makeTargetUri(const std::string& target);
    
    // Callbacks PJSUA (static para compatibilidade com C)
    static void onRegState(pjsua_acc_id acc_id);
    static void onIncomingCall(pjsua_acc_id acc_id, pjsua_call_id call_id, pjsip_rx_data* rdata);
    static void onCallState(pjsua_call_id call_id, pjsip_event* e);
    static void onCallMediaState(pjsua_call_id call_id);
    static void onCallTransferStatus(pjsua_call_id call_id, int st_code, const pj_str_t* st_text, pj_bool_t final_, pj_bool_t* p_cont);
    static void onDtmfDigit(pjsua_call_id call_id, int digit);
    
    // Instância singleton para callbacks estáticos
    static SipEngine* s_instance;
};

} // namespace echo

#endif // SIP_ENGINE_H
