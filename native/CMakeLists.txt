cmake_minimum_required(VERSION 3.15)
project(pjsip_addon)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Node.js e N-API
include_directories(${CMAKE_JS_INC})
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/node_modules/node-addon-api)

# PJSIP includes
set(PJSIP_ROOT ${CMAKE_CURRENT_SOURCE_DIR}/deps/pjproject)
include_directories(
    ${PJSIP_ROOT}/pjlib/include
    ${PJSIP_ROOT}/pjlib-util/include
    ${PJSIP_ROOT}/pjnath/include
    ${PJSIP_ROOT}/pjmedia/include
    ${PJSIP_ROOT}/pjsip/include
)

# Source files
set(SOURCES
    src/pjsip_addon.cpp
    src/sip_engine.cpp
    src/audio_device.cpp
    src/event_emitter.cpp
)

# Create the addon
add_library(${PROJECT_NAME} SHARED ${SOURCES} ${CMAKE_JS_SRC})

# N-API
target_compile_definitions(${PROJECT_NAME} PRIVATE NAPI_VERSION=8)
target_compile_definitions(${PROJECT_NAME} PRIVATE NAPI_DISABLE_CPP_EXCEPTIONS)

# Platform-specific configuration
if(WIN32)
    target_compile_definitions(${PROJECT_NAME} PRIVATE PJ_WIN32=1 _CRT_SECURE_NO_WARNINGS)
    
    # PJSIP libraries for Windows
    set(PJSIP_LIB_DIR ${PJSIP_ROOT}/lib)
    target_link_libraries(${PROJECT_NAME}
        ${PJSIP_LIB_DIR}/pjsua-lib-x86_64-x64-vc14-Release.lib
        ${PJSIP_LIB_DIR}/pjsip-ua-x86_64-x64-vc14-Release.lib
        ${PJSIP_LIB_DIR}/pjsip-simple-x86_64-x64-vc14-Release.lib
        ${PJSIP_LIB_DIR}/pjsip-core-x86_64-x64-vc14-Release.lib
        ${PJSIP_LIB_DIR}/pjmedia-x86_64-x64-vc14-Release.lib
        ${PJSIP_LIB_DIR}/pjmedia-audiodev-x86_64-x64-vc14-Release.lib
        ${PJSIP_LIB_DIR}/pjmedia-codec-x86_64-x64-vc14-Release.lib
        ${PJSIP_LIB_DIR}/pjnath-x86_64-x64-vc14-Release.lib
        ${PJSIP_LIB_DIR}/pjlib-util-x86_64-x64-vc14-Release.lib
        ${PJSIP_LIB_DIR}/pjlib-x86_64-x64-vc14-Release.lib
        ws2_32 ole32 winmm dsound uuid odbc32 odbccp32 mswsock iphlpapi
    )
    
elseif(UNIX AND NOT APPLE)
    target_compile_definitions(${PROJECT_NAME} PRIVATE PJ_LINUX=1)
    
    # PJSIP libraries for Linux
    set(PJSIP_LIB_DIR ${PJSIP_ROOT}/lib)
    target_link_libraries(${PROJECT_NAME}
        -L${PJSIP_LIB_DIR}
        -Wl,--start-group
        pjsua-x86_64-unknown-linux-gnu
        pjsip-ua-x86_64-unknown-linux-gnu
        pjsip-simple-x86_64-unknown-linux-gnu
        pjsip-x86_64-unknown-linux-gnu
        pjmedia-audiodev-x86_64-unknown-linux-gnu
        pjmedia-codec-x86_64-unknown-linux-gnu
        pjmedia-x86_64-unknown-linux-gnu
        pjnath-x86_64-unknown-linux-gnu
        pjlib-util-x86_64-unknown-linux-gnu
        pj-x86_64-unknown-linux-gnu
        srtp-x86_64-unknown-linux-gnu
        resample-x86_64-unknown-linux-gnu
        -Wl,--end-group
        asound pthread m uuid
    )
    
elseif(APPLE)
    target_compile_definitions(${PROJECT_NAME} PRIVATE PJ_DARWINOS=1)
    
    # PJSIP libraries for macOS
    set(PJSIP_LIB_DIR ${PJSIP_ROOT}/lib)
    target_link_libraries(${PROJECT_NAME}
        -L${PJSIP_LIB_DIR}
        pjsua-arm-apple-darwin
        pjsip-ua-arm-apple-darwin
        pjsip-simple-arm-apple-darwin
        pjsip-arm-apple-darwin
        pjmedia-audiodev-arm-apple-darwin
        pjmedia-codec-arm-apple-darwin
        pjmedia-arm-apple-darwin
        pjnath-arm-apple-darwin
        pjlib-util-arm-apple-darwin
        pj-arm-apple-darwin
        "-framework CoreAudio"
        "-framework AudioToolbox"
        "-framework AudioUnit"
        "-framework CoreServices"
        "-framework CoreFoundation"
    )
endif()

target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB})

# Set output name
set_target_properties(${PROJECT_NAME} PROPERTIES
    PREFIX ""
    SUFFIX ".node"
)
