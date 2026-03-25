JJOMICUBE.start(12, 40)
ESP32UART.initEsp32(SerialPin.P8, SerialPin.P12, BaudRate.BaudRate115200)
ESP32UART.connectWifi("LnB", "lnb2198@")
ESP32UART.checkWifiStatus()
TFTFont.drawStatusIcons()
basic.forever(function () {
    if (ESP32UART.isWifiConnected()) {
        basic.showIcon(IconNames.Heart)
    } else {
        basic.showIcon(IconNames.No)
    }
})
