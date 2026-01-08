/**
 * @file audio_device.cpp
 * @brief Implementação dos utilitários de dispositivos de áudio
 */

#include "audio_device.h"
#include <cstring>

namespace echo {
namespace audio {

std::vector<AudioDeviceInfo> listAudioDevices() {
    std::vector<AudioDeviceInfo> devices;
    
    unsigned count = PJMEDIA_AUD_MAX_DEVS;
    pjmedia_aud_dev_info info[PJMEDIA_AUD_MAX_DEVS];
    
    pj_status_t status = pjsua_enum_aud_devs(info, &count);
    if (status != PJ_SUCCESS) {
        return devices;
    }
    
    for (unsigned i = 0; i < count; i++) {
        AudioDeviceInfo devInfo;
        devInfo.id = static_cast<int>(i);
        devInfo.name = std::string(info[i].name);
        devInfo.inputCount = static_cast<int>(info[i].input_count);
        devInfo.outputCount = static_cast<int>(info[i].output_count);
        devInfo.isDefault = (info[i].caps & PJMEDIA_AUD_DEV_CAP_INPUT_LATENCY) != 0;
        
        devices.push_back(devInfo);
    }
    
    return devices;
}

int getCurrentCaptureDevice() {
    int captureId = -1;
    int playbackId = -1;
    
    pj_status_t status = pjsua_get_snd_dev(&captureId, &playbackId);
    if (status != PJ_SUCCESS) {
        return -1;
    }
    
    return captureId;
}

int getCurrentPlaybackDevice() {
    int captureId = -1;
    int playbackId = -1;
    
    pj_status_t status = pjsua_get_snd_dev(&captureId, &playbackId);
    if (status != PJ_SUCCESS) {
        return -1;
    }
    
    return playbackId;
}

bool setAudioDevices(int captureId, int playbackId) {
    pj_status_t status = pjsua_set_snd_dev(captureId, playbackId);
    return status == PJ_SUCCESS;
}

int findDeviceByName(const std::string& name, bool forCapture) {
    unsigned count = PJMEDIA_AUD_MAX_DEVS;
    pjmedia_aud_dev_info info[PJMEDIA_AUD_MAX_DEVS];
    
    pj_status_t status = pjsua_enum_aud_devs(info, &count);
    if (status != PJ_SUCCESS) {
        return -1;
    }
    
    for (unsigned i = 0; i < count; i++) {
        std::string devName(info[i].name);
        
        // Verificar se o nome contém a string buscada
        if (devName.find(name) != std::string::npos) {
            // Verificar se o dispositivo tem a capacidade desejada
            if (forCapture && info[i].input_count > 0) {
                return static_cast<int>(i);
            }
            if (!forCapture && info[i].output_count > 0) {
                return static_cast<int>(i);
            }
        }
    }
    
    return -1;
}

bool setMicrophoneLevel(float level) {
    // Limitar entre 0 e 1
    if (level < 0.0f) level = 0.0f;
    if (level > 1.0f) level = 1.0f;
    
    // Converter para escala PJSUA (0-255)
    unsigned pjLevel = static_cast<unsigned>(level * 255.0f);
    
    // Ajustar nível do slot 0 (microfone)
    pj_status_t status = pjsua_conf_adjust_rx_level(0, static_cast<float>(pjLevel) / 128.0f);
    
    return status == PJ_SUCCESS;
}

bool setSpeakerLevel(float level) {
    // Limitar entre 0 e 1
    if (level < 0.0f) level = 0.0f;
    if (level > 1.0f) level = 1.0f;
    
    // Converter para escala PJSUA (0-255)
    unsigned pjLevel = static_cast<unsigned>(level * 255.0f);
    
    // Ajustar nível do slot 0 (speaker)
    pj_status_t status = pjsua_conf_adjust_tx_level(0, static_cast<float>(pjLevel) / 128.0f);
    
    return status == PJ_SUCCESS;
}

float getMicrophoneLevel() {
    unsigned txLevel = 0;
    unsigned rxLevel = 0;
    
    pj_status_t status = pjsua_conf_get_signal_level(0, &txLevel, &rxLevel);
    if (status != PJ_SUCCESS) {
        return 0.0f;
    }
    
    return static_cast<float>(rxLevel) / 255.0f;
}

float getSpeakerLevel() {
    unsigned txLevel = 0;
    unsigned rxLevel = 0;
    
    pj_status_t status = pjsua_conf_get_signal_level(0, &txLevel, &rxLevel);
    if (status != PJ_SUCCESS) {
        return 0.0f;
    }
    
    return static_cast<float>(txLevel) / 255.0f;
}

} // namespace audio
} // namespace echo
