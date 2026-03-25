// ===== 초기 설정 =====
RBTFT20.init()

// 상태 메시지
TFTGraph.drawStatus("시작 중...", RBTFT20.yellow())

// ESP32 초기화
ESP32UART.initEsp32()

// WiFi 연결
ESP32UART.connectWifi("LnB", "lnb2198@")

// 상태 아이콘 표시
TFTFont.drawStatusIcons()

// ===== 반복 루프 =====
basic.forever(function () {

    // WiFi 연결 상태 확인
    if (ESP32UART.isWifiConnected()) {

        // micro:bit LED
        basic.showIcon(IconNames.Heart)

        // TFT 상태 표시
        TFTGraph.drawStatus("와이파이 연결됨", RBTFT20.green())

    } else {

        basic.showIcon(IconNames.No)

        TFTGraph.drawStatus("와이파이 연결 안됨", RBTFT20.red())
    }

    // 아이콘 업데이트
    TFTFont.drawStatusIcons()

    basic.pause(1000)
})