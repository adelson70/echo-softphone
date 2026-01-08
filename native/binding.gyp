{
  "targets": [
    {
      "target_name": "pjsip_addon",
      "sources": [
        "src/pjsip_addon.cpp",
        "src/sip_engine.cpp",
        "src/audio_device.cpp",
        "src/event_emitter.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "deps/pjproject/pjlib/include",
        "deps/pjproject/pjlib-util/include",
        "deps/pjproject/pjnath/include",
        "deps/pjproject/pjmedia/include",
        "deps/pjproject/pjsip/include"
      ],
      "defines": [
        "NAPI_VERSION=8",
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "cflags_cc": ["-std=c++17"],
      "conditions": [
        ["OS=='win'", {
          "defines": [
            "PJ_WIN32=1",
            "_CRT_SECURE_NO_WARNINGS"
          ],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "AdditionalOptions": ["/std:c++17"]
            }
          },
          "libraries": [
            "-l<(module_root_dir)/deps/pjproject/lib/libpjproject-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/pjsua2-lib-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/pjsua-lib-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/pjsip-ua-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/pjsip-simple-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/pjsip-core-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/pjmedia-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/pjmedia-audiodev-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/pjmedia-codec-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/pjmedia-videodev-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/pjnath-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/pjlib-util-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/pjlib-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/libsrtp-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/libresample-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/libspeex-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/libgsmcodec-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/libilbccodec-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/libg7221codec-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/libwebrtc-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/libyuv-x86_64-x64-vc14-Release.lib",
            "-l<(module_root_dir)/deps/pjproject/lib/libmilenage-x86_64-x64-vc14-Release.lib",
            "-lws2_32.lib",
            "-lole32.lib",
            "-lwinmm.lib",
            "-ldsound.lib",
            "-luuid.lib",
            "-lodbc32.lib",
            "-lodbccp32.lib",
            "-lmswsock.lib",
            "-liphlpapi.lib",
            "-lmsvcrt.lib",
            "-lucrt.lib",
            "-lvcruntime.lib"
          ]
        }],
        ["OS=='linux'", {
          "defines": [
            "PJ_LINUX=1",
            "PJ_IS_LITTLE_ENDIAN=1",
            "PJ_IS_BIG_ENDIAN=0"
          ],
          "libraries": [
            "-L<(module_root_dir)/deps/pjproject/lib",
            "-Wl,--start-group",
            "-lpjsua-x86_64-unknown-linux-gnu",
            "-lpjsip-ua-x86_64-unknown-linux-gnu",
            "-lpjsip-simple-x86_64-unknown-linux-gnu",
            "-lpjsip-x86_64-unknown-linux-gnu",
            "-lpjmedia-audiodev-x86_64-unknown-linux-gnu",
            "-lpjmedia-codec-x86_64-unknown-linux-gnu",
            "-lpjmedia-x86_64-unknown-linux-gnu",
            "-lpjnath-x86_64-unknown-linux-gnu",
            "-lpjlib-util-x86_64-unknown-linux-gnu",
            "-lpj-x86_64-unknown-linux-gnu",
            "-lsrtp-x86_64-unknown-linux-gnu",
            "-lresample-x86_64-unknown-linux-gnu",
            "-Wl,--end-group",
            "-lasound",
            "-lpthread",
            "-lm",
            "-luuid"
          ],
          "cflags_cc": [
            "-fPIC",
            "-std=c++17"
          ]
        }],
        ["OS=='mac'", {
          "defines": [
            "PJ_DARWINOS=1"
          ],
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LANGUAGE_STANDARD": "c++17",
            "MACOSX_DEPLOYMENT_TARGET": "10.15"
          },
          "libraries": [
            "-L<(module_root_dir)/deps/pjproject/lib",
            "-lpjsua-arm-apple-darwin",
            "-lpjsip-ua-arm-apple-darwin",
            "-lpjsip-simple-arm-apple-darwin",
            "-lpjsip-arm-apple-darwin",
            "-lpjmedia-audiodev-arm-apple-darwin",
            "-lpjmedia-codec-arm-apple-darwin",
            "-lpjmedia-arm-apple-darwin",
            "-lpjnath-arm-apple-darwin",
            "-lpjlib-util-arm-apple-darwin",
            "-lpj-arm-apple-darwin",
            "-lsrtp-arm-apple-darwin",
            "-lresample-arm-apple-darwin",
            "-framework CoreAudio",
            "-framework AudioToolbox",
            "-framework AudioUnit",
            "-framework CoreServices",
            "-framework CoreFoundation"
          ]
        }]
      ]
    }
  ]
}
