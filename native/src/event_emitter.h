/**
 * @file event_emitter.h
 * @brief Emissor de eventos thread-safe para N-API
 * 
 * Este arquivo fornece uma classe para emitir eventos de forma thread-safe
 * do thread PJSIP para o thread principal do Node.js.
 */

#ifndef EVENT_EMITTER_H
#define EVENT_EMITTER_H

#include <napi.h>
#include <string>
#include <mutex>
#include <memory>
#include <atomic>

namespace echo {

/**
 * @brief Dados de um evento para enviar ao JavaScript
 */
struct EventData {
    std::string eventName;
    std::string jsonPayload; // Payload serializado como JSON
};

/**
 * @brief Emissor de eventos thread-safe para N-API
 * 
 * Usa ThreadSafeFunction para enviar eventos de qualquer thread
 * para o thread principal do Node.js.
 */
class EventEmitter {
public:
    /**
     * @brief Construtor
     * @param env Ambiente N-API
     * @param callback Função JavaScript para receber eventos
     */
    EventEmitter(Napi::Env env, Napi::Function callback);
    
    /**
     * @brief Destrutor
     */
    ~EventEmitter();

    // Impede cópia
    EventEmitter(const EventEmitter&) = delete;
    EventEmitter& operator=(const EventEmitter&) = delete;

    /**
     * @brief Emite um evento para JavaScript
     * @param eventName Nome do evento
     * @param jsonPayload Payload do evento em JSON
     */
    void emit(const std::string& eventName, const std::string& jsonPayload);

    /**
     * @brief Emite um evento simples sem payload
     * @param eventName Nome do evento
     */
    void emit(const std::string& eventName);

    /**
     * @brief Libera recursos
     */
    void release();

    /**
     * @brief Verifica se está ativo
     */
    bool isActive() const;

private:
    Napi::ThreadSafeFunction m_tsfn;
    std::atomic<bool> m_active{false};
};

/**
 * @brief Gerenciador global de EventEmitter
 * 
 * Singleton para gerenciar o EventEmitter global usado pelo SipEngine.
 */
class EventEmitterManager {
public:
    /**
     * @brief Obtém a instância singleton
     */
    static EventEmitterManager& getInstance();

    /**
     * @brief Define o emitter global
     * @param emitter Ponteiro para o emitter
     */
    void setEmitter(std::shared_ptr<EventEmitter> emitter);

    /**
     * @brief Obtém o emitter global
     * @return Ponteiro para o emitter ou nullptr
     */
    std::shared_ptr<EventEmitter> getEmitter();

    /**
     * @brief Emite evento se emitter disponível
     * @param eventName Nome do evento
     * @param jsonPayload Payload JSON
     */
    void emit(const std::string& eventName, const std::string& jsonPayload = "{}");

    /**
     * @brief Limpa o emitter
     */
    void clear();

private:
    EventEmitterManager() = default;
    ~EventEmitterManager() = default;
    
    EventEmitterManager(const EventEmitterManager&) = delete;
    EventEmitterManager& operator=(const EventEmitterManager&) = delete;

    std::shared_ptr<EventEmitter> m_emitter;
    std::mutex m_mutex;
};

} // namespace echo

#endif // EVENT_EMITTER_H
