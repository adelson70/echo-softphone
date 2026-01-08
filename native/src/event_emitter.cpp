/**
 * @file event_emitter.cpp
 * @brief Implementação do emissor de eventos thread-safe para N-API
 */

#include "event_emitter.h"

namespace echo {

// EventEmitter implementation

EventEmitter::EventEmitter(Napi::Env env, Napi::Function callback) {
    m_tsfn = Napi::ThreadSafeFunction::New(
        env,
        callback,
        "SipEventEmitter",
        0,  // Unlimited queue
        1   // Initial thread count
    );
    m_active = true;
}

EventEmitter::~EventEmitter() {
    release();
}

void EventEmitter::emit(const std::string& eventName, const std::string& jsonPayload) {
    if (!m_active) {
        return;
    }
    
    // Criar dados do evento (será deletado após processamento)
    EventData* data = new EventData();
    data->eventName = eventName;
    data->jsonPayload = jsonPayload;
    
    // Enfileirar para o thread principal
    auto callback = [](Napi::Env env, Napi::Function jsCallback, EventData* data) {
        if (data == nullptr) return;
        
        // Chamar callback JavaScript com (eventName, payload)
        jsCallback.Call({
            Napi::String::New(env, data->eventName),
            Napi::String::New(env, data->jsonPayload)
        });
        
        delete data;
    };
    
    napi_status status = m_tsfn.BlockingCall(data, callback);
    
    if (status != napi_ok) {
        delete data;
    }
}

void EventEmitter::emit(const std::string& eventName) {
    emit(eventName, "{}");
}

void EventEmitter::release() {
    if (m_active) {
        m_active = false;
        m_tsfn.Release();
    }
}

bool EventEmitter::isActive() const {
    return m_active;
}

// EventEmitterManager implementation

EventEmitterManager& EventEmitterManager::getInstance() {
    static EventEmitterManager instance;
    return instance;
}

void EventEmitterManager::setEmitter(std::shared_ptr<EventEmitter> emitter) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_emitter = emitter;
}

std::shared_ptr<EventEmitter> EventEmitterManager::getEmitter() {
    std::lock_guard<std::mutex> lock(m_mutex);
    return m_emitter;
}

void EventEmitterManager::emit(const std::string& eventName, const std::string& jsonPayload) {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (m_emitter && m_emitter->isActive()) {
        m_emitter->emit(eventName, jsonPayload);
    }
}

void EventEmitterManager::clear() {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (m_emitter) {
        m_emitter->release();
        m_emitter.reset();
    }
}

} // namespace echo
