/**
 * @file pjsip_addon.cpp
 * @brief Entry point N-API para o módulo PJSIP nativo
 * 
 * Este arquivo expõe todas as funções do SipEngine para JavaScript
 * através da API N-API do Node.js.
 */

#include <napi.h>
#include "sip_engine.h"
#include "audio_device.h"
#include "event_emitter.h"
#include <memory>

namespace {

// Instância global do SipEngine
std::unique_ptr<echo::SipEngine> g_engine;

// Helper para converter SipConnectionState para string
std::string connectionStateToString(echo::SipConnectionState state) {
    switch (state) {
        case echo::SipConnectionState::Idle: return "idle";
        case echo::SipConnectionState::Connecting: return "connecting";
        case echo::SipConnectionState::Connected: return "connected";
        case echo::SipConnectionState::Registered: return "registered";
        case echo::SipConnectionState::Unregistered: return "unregistered";
        case echo::SipConnectionState::Error: return "error";
        default: return "unknown";
    }
}

// Helper para converter CallState para string
std::string callStateToString(echo::CallState state) {
    switch (state) {
        case echo::CallState::Idle: return "idle";
        case echo::CallState::Dialing: return "dialing";
        case echo::CallState::Ringing: return "ringing";
        case echo::CallState::Incoming: return "incoming";
        case echo::CallState::Established: return "established";
        case echo::CallState::Terminating: return "terminating";
        case echo::CallState::Terminated: return "terminated";
        case echo::CallState::Failed: return "failed";
        default: return "unknown";
    }
}

// Helper para converter CallDirection para string
std::string callDirectionToString(echo::CallDirection dir) {
    switch (dir) {
        case echo::CallDirection::None: return "none";
        case echo::CallDirection::Outgoing: return "outgoing";
        case echo::CallDirection::Incoming: return "incoming";
        default: return "unknown";
    }
}

// Helper para converter snapshot para objeto JS
Napi::Object snapshotToObject(Napi::Env env, const echo::SipSnapshot& snap) {
    Napi::Object obj = Napi::Object::New(env);
    
    obj.Set("connection", connectionStateToString(snap.connection));
    obj.Set("callStatus", callStateToString(snap.callStatus));
    obj.Set("callDirection", callDirectionToString(snap.callDirection));
    obj.Set("muted", snap.muted);
    obj.Set("lastError", snap.lastError);
    obj.Set("username", snap.username);
    obj.Set("domain", snap.domain);
    
    if (!snap.remoteUri.empty()) {
        obj.Set("remoteUri", snap.remoteUri);
    }
    
    if (!snap.incoming.user.empty()) {
        Napi::Object incoming = Napi::Object::New(env);
        incoming.Set("displayName", snap.incoming.displayName);
        incoming.Set("user", snap.incoming.user);
        incoming.Set("uri", snap.incoming.uri);
        obj.Set("incoming", incoming);
    }
    
    return obj;
}

/**
 * Inicializa o endpoint PJSIP
 * @returns {boolean} true se sucesso
 */
Napi::Value Init(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        g_engine = std::make_unique<echo::SipEngine>();
    }
    
    bool result = g_engine->init();
    return Napi::Boolean::New(env, result);
}

/**
 * Destrói o endpoint PJSIP
 */
Napi::Value Destroy(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (g_engine) {
        g_engine->destroy();
        g_engine.reset();
    }
    
    echo::EventEmitterManager::getInstance().clear();
    
    return env.Undefined();
}

/**
 * Verifica se está inicializado
 * @returns {boolean}
 */
Napi::Value IsInitialized(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        return Napi::Boolean::New(env, false);
    }
    
    return Napi::Boolean::New(env, g_engine->isInitialized());
}

/**
 * Registra no servidor SIP
 * @param {Object} credentials - { username, password, server, port, transport }
 * @returns {boolean} true se registro iniciado
 */
Napi::Value Register(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Credenciais são obrigatórias").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    if (!g_engine) {
        g_engine = std::make_unique<echo::SipEngine>();
    }
    
    Napi::Object creds = info[0].As<Napi::Object>();
    
    echo::SipCredentials credentials;
    credentials.username = creds.Get("username").As<Napi::String>().Utf8Value();
    credentials.password = creds.Get("password").As<Napi::String>().Utf8Value();
    credentials.server = creds.Get("server").As<Napi::String>().Utf8Value();
    credentials.port = creds.Has("port") ? creds.Get("port").As<Napi::Number>().Int32Value() : 5060;
    credentials.transport = creds.Has("transport") ? creds.Get("transport").As<Napi::String>().Utf8Value() : "udp";
    
    bool result = g_engine->registerAccount(credentials);
    return Napi::Boolean::New(env, result);
}

/**
 * Desregistra do servidor SIP
 * @returns {boolean}
 */
Napi::Value Unregister(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        return Napi::Boolean::New(env, false);
    }
    
    bool result = g_engine->unregister();
    return Napi::Boolean::New(env, result);
}

/**
 * Inicia uma chamada
 * @param {string} target - Número ou URI de destino
 * @returns {boolean}
 */
Napi::Value MakeCall(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Destino é obrigatório").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    if (!g_engine) {
        return Napi::Boolean::New(env, false);
    }
    
    std::string target = info[0].As<Napi::String>().Utf8Value();
    bool result = g_engine->makeCall(target);
    return Napi::Boolean::New(env, result);
}

/**
 * Atende uma chamada entrante
 * @returns {boolean}
 */
Napi::Value AnswerCall(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        return Napi::Boolean::New(env, false);
    }
    
    bool result = g_engine->answerCall();
    return Napi::Boolean::New(env, result);
}

/**
 * Rejeita uma chamada entrante
 * @returns {boolean}
 */
Napi::Value RejectCall(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        return Napi::Boolean::New(env, false);
    }
    
    bool result = g_engine->rejectCall();
    return Napi::Boolean::New(env, result);
}

/**
 * Encerra a chamada atual
 * @returns {boolean}
 */
Napi::Value HangupCall(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        return Napi::Boolean::New(env, false);
    }
    
    bool result = g_engine->hangupCall();
    return Napi::Boolean::New(env, result);
}

/**
 * Envia DTMF
 * @param {string} digits - Dígitos DTMF
 * @returns {boolean}
 */
Napi::Value SendDtmf(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Dígitos DTMF são obrigatórios").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    if (!g_engine) {
        return Napi::Boolean::New(env, false);
    }
    
    std::string digits = info[0].As<Napi::String>().Utf8Value();
    bool result = g_engine->sendDtmf(digits);
    return Napi::Boolean::New(env, result);
}

/**
 * Transferência cega
 * @param {string} target - Destino da transferência
 * @returns {boolean}
 */
Napi::Value TransferBlind(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Destino é obrigatório").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    if (!g_engine) {
        return Napi::Boolean::New(env, false);
    }
    
    std::string target = info[0].As<Napi::String>().Utf8Value();
    bool result = g_engine->transferBlind(target);
    return Napi::Boolean::New(env, result);
}

/**
 * Transferência assistida
 * @param {string} target - Destino da transferência
 * @returns {boolean}
 */
Napi::Value TransferAttended(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Destino é obrigatório").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    if (!g_engine) {
        return Napi::Boolean::New(env, false);
    }
    
    std::string target = info[0].As<Napi::String>().Utf8Value();
    bool result = g_engine->transferAttended(target);
    return Napi::Boolean::New(env, result);
}

/**
 * Define mute do microfone
 * @param {boolean} muted
 */
Napi::Value SetMuted(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsBoolean()) {
        Napi::TypeError::New(env, "Valor boolean é obrigatório").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    if (!g_engine) {
        return env.Undefined();
    }
    
    bool muted = info[0].As<Napi::Boolean>().Value();
    g_engine->setMuted(muted);
    return env.Undefined();
}

/**
 * Alterna mute
 * @returns {boolean} novo estado
 */
Napi::Value ToggleMuted(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        return Napi::Boolean::New(env, false);
    }
    
    bool result = g_engine->toggleMuted();
    return Napi::Boolean::New(env, result);
}

/**
 * Verifica se está em mute
 * @returns {boolean}
 */
Napi::Value IsMuted(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        return Napi::Boolean::New(env, false);
    }
    
    return Napi::Boolean::New(env, g_engine->isMuted());
}

/**
 * Obtém lista de dispositivos de áudio
 * @returns {Array<string>}
 */
Napi::Value GetAudioDevices(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    std::vector<echo::audio::AudioDeviceInfo> devices = echo::audio::listAudioDevices();
    
    Napi::Array result = Napi::Array::New(env, devices.size());
    for (size_t i = 0; i < devices.size(); i++) {
        Napi::Object dev = Napi::Object::New(env);
        dev.Set("id", devices[i].id);
        dev.Set("name", devices[i].name);
        dev.Set("inputCount", devices[i].inputCount);
        dev.Set("outputCount", devices[i].outputCount);
        dev.Set("isDefault", devices[i].isDefault);
        result.Set(static_cast<uint32_t>(i), dev);
    }
    
    return result;
}

/**
 * Define dispositivos de áudio
 * @param {number} captureDeviceId
 * @param {number} playbackDeviceId
 * @returns {boolean}
 */
Napi::Value SetAudioDevices(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "IDs dos dispositivos são obrigatórios").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    int captureId = info[0].As<Napi::Number>().Int32Value();
    int playbackId = info[1].As<Napi::Number>().Int32Value();
    
    bool result = echo::audio::setAudioDevices(captureId, playbackId);
    return Napi::Boolean::New(env, result);
}

/**
 * Obtém snapshot do estado atual
 * @returns {Object}
 */
Napi::Value GetSnapshot(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        Napi::Object empty = Napi::Object::New(env);
        empty.Set("connection", "idle");
        empty.Set("callStatus", "idle");
        empty.Set("callDirection", "none");
        empty.Set("muted", false);
        return empty;
    }
    
    echo::SipSnapshot snap = g_engine->getSnapshot();
    return snapshotToObject(env, snap);
}

/**
 * Define callback de eventos
 * @param {Function} callback - Função (eventName, payload) => void
 */
Napi::Value SetEventCallback(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsFunction()) {
        Napi::TypeError::New(env, "Callback é obrigatório").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    Napi::Function callback = info[0].As<Napi::Function>();
    
    // Criar EventEmitter e registrar no manager global
    auto emitter = std::make_shared<echo::EventEmitter>(env, callback);
    echo::EventEmitterManager::getInstance().setEmitter(emitter);
    
    return env.Undefined();
}

/**
 * Remove callback de eventos
 */
Napi::Value ClearEventCallback(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    echo::EventEmitterManager::getInstance().clear();
    
    return env.Undefined();
}

/**
 * Processa eventos pendentes
 */
Napi::Value ProcessEvents(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (g_engine) {
        g_engine->processEvents();
    }
    
    return env.Undefined();
}

/**
 * Inicialização do módulo
 */
Napi::Object InitModule(Napi::Env env, Napi::Object exports) {
    // Lifecycle
    exports.Set("init", Napi::Function::New(env, Init));
    exports.Set("destroy", Napi::Function::New(env, Destroy));
    exports.Set("isInitialized", Napi::Function::New(env, IsInitialized));
    
    // Registration
    exports.Set("register", Napi::Function::New(env, Register));
    exports.Set("unregister", Napi::Function::New(env, Unregister));
    
    // Calls
    exports.Set("makeCall", Napi::Function::New(env, MakeCall));
    exports.Set("answerCall", Napi::Function::New(env, AnswerCall));
    exports.Set("rejectCall", Napi::Function::New(env, RejectCall));
    exports.Set("hangupCall", Napi::Function::New(env, HangupCall));
    
    // DTMF
    exports.Set("sendDtmf", Napi::Function::New(env, SendDtmf));
    
    // Transfer
    exports.Set("transferBlind", Napi::Function::New(env, TransferBlind));
    exports.Set("transferAttended", Napi::Function::New(env, TransferAttended));
    
    // Audio
    exports.Set("setMuted", Napi::Function::New(env, SetMuted));
    exports.Set("toggleMuted", Napi::Function::New(env, ToggleMuted));
    exports.Set("isMuted", Napi::Function::New(env, IsMuted));
    exports.Set("getAudioDevices", Napi::Function::New(env, GetAudioDevices));
    exports.Set("setAudioDevices", Napi::Function::New(env, SetAudioDevices));
    
    // State
    exports.Set("getSnapshot", Napi::Function::New(env, GetSnapshot));
    
    // Events
    exports.Set("setEventCallback", Napi::Function::New(env, SetEventCallback));
    exports.Set("clearEventCallback", Napi::Function::New(env, ClearEventCallback));
    exports.Set("processEvents", Napi::Function::New(env, ProcessEvents));
    
    return exports;
}

} // anonymous namespace

NODE_API_MODULE(pjsip_addon, InitModule)
