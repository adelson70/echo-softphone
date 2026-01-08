/**
 * @file audio_device.h
 * @brief Utilitários de dispositivos de áudio para PJSIP
 * 
 * Este arquivo fornece funções auxiliares para gerenciar dispositivos
 * de áudio com PJSIP.
 */

#ifndef AUDIO_DEVICE_H
#define AUDIO_DEVICE_H

#include <string>
#include <vector>

extern "C" {
#include <pjsua-lib/pjsua.h>
}

namespace echo {
namespace audio {

/**
 * @brief Informações de um dispositivo de áudio
 */
struct AudioDeviceInfo {
    int id;
    std::string name;
    int inputCount;
    int outputCount;
    bool isDefault;
};

/**
 * @brief Lista todos os dispositivos de áudio disponíveis
 * @return Vector com informações dos dispositivos
 */
std::vector<AudioDeviceInfo> listAudioDevices();

/**
 * @brief Obtém informações do dispositivo atual de captura
 * @return ID do dispositivo ou -1 se erro
 */
int getCurrentCaptureDevice();

/**
 * @brief Obtém informações do dispositivo atual de reprodução
 * @return ID do dispositivo ou -1 se erro
 */
int getCurrentPlaybackDevice();

/**
 * @brief Define os dispositivos de áudio
 * @param captureId ID do dispositivo de captura (-1 para default)
 * @param playbackId ID do dispositivo de reprodução (-1 para default)
 * @return true se sucesso
 */
bool setAudioDevices(int captureId, int playbackId);

/**
 * @brief Encontra dispositivo por nome
 * @param name Nome (parcial) do dispositivo
 * @param forCapture true para dispositivo de captura, false para reprodução
 * @return ID do dispositivo ou -1 se não encontrado
 */
int findDeviceByName(const std::string& name, bool forCapture);

/**
 * @brief Ajusta o volume do microfone
 * @param level Nível de 0.0 a 1.0
 * @return true se sucesso
 */
bool setMicrophoneLevel(float level);

/**
 * @brief Ajusta o volume do speaker
 * @param level Nível de 0.0 a 1.0
 * @return true se sucesso
 */
bool setSpeakerLevel(float level);

/**
 * @brief Obtém nível atual do microfone
 * @return Nível de 0.0 a 1.0
 */
float getMicrophoneLevel();

/**
 * @brief Obtém nível atual do speaker
 * @return Nível de 0.0 a 1.0
 */
float getSpeakerLevel();

} // namespace audio
} // namespace echo

#endif // AUDIO_DEVICE_H
