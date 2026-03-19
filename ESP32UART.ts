/**
 * ESP32 UART bridge blocks for micro:bit
 */
//% color=#1E88E5 icon="\uf1eb" weight=90 block="ESP32 UART"
namespace ESP32UART {
    let lastLine = ""
    let lastNormalizedLine = ""
    let btConnected = false
    let wifiConnected = false
    let btReady = false

    function syncStatusIcons(): void {
        TFTFont.setConnectionStatus(wifiConnected, btConnected)
    }

    function setWifiState(state: boolean): void {
        wifiConnected = state
        syncStatusIcons()
    }

    function setBtState(state: boolean): void {
        btConnected = state
        syncStatusIcons()
    }

    function containsText(src: string, key: string): boolean {
        return src.indexOf(key) >= 0
    }

    function normalizeLine(src: string): string {
        let s = src.trim()

        // ESP32 디버그 접두사 제거
        if (s.indexOf("[ESP->MB] ") == 0) {
            s = s.substr(10)
        } else if (s.indexOf("[ESP->MB-STATE] ") == 0) {
            s = s.substr(16)
        }

        return s.trim().toUpperCase()
    }

    function isWifiSuccessLine(line: string): boolean {
        return containsText(line, "WIFI:1")
    }

    function isWifiFailLine(line: string): boolean {
        return containsText(line, "WIFI:0")
    }

    function isBtSuccessLine(line: string): boolean {
        return containsText(line, "BT:1")
    }

    function isBtFailLine(line: string): boolean {
        return containsText(line, "BT:0")
    }

    function processIncomingLine(rawLine: string): void {
        if (!rawLine) return

        rawLine = rawLine.trim()
        if (rawLine.length == 0) return

        lastLine = rawLine
        lastNormalizedLine = normalizeLine(rawLine)

        // 상태 코드 우선 처리
        if (isWifiSuccessLine(lastNormalizedLine)) {
            setWifiState(true)
            return
        }

        if (isWifiFailLine(lastNormalizedLine)) {
            setWifiState(false)
            return
        }

        if (isBtSuccessLine(lastNormalizedLine)) {
            setBtState(true)
            return
        }

        if (isBtFailLine(lastNormalizedLine)) {
            setBtState(false)
            return
        }

        // 일반 로그 표시
        TFTGraph.drawStatus(rawLine, Color.Green)

        // 보조 문자열 처리
        if (containsText(lastNormalizedLine, "BT_BEGIN_FAIL")) {
            btReady = false
            setBtState(false)
        } else if (containsText(lastNormalizedLine, "BLUETOOTHSERIAL STARTED")) {
            btReady = true
        } else if (containsText(lastNormalizedLine, "BT CONNECTED")) {
            setBtState(true)
        } else if (containsText(lastNormalizedLine, "BT DISCONNECTED")) {
            setBtState(false)
        } else if (containsText(lastNormalizedLine, "WIFI CONNECTED") || containsText(lastNormalizedLine, "WIFI GOT IP")) {
            setWifiState(true)
        } else if (containsText(lastNormalizedLine, "WIFI DISCONNECT") || containsText(lastNormalizedLine, "WIFI DISCONNECTED")) {
            setWifiState(false)
        }
    }

    /**
     * Initialize UART for ESP32 bridge
     */
    //% block="init ESP32 RX $rx TX $tx baud $baud"
    //% weight=100
    export function initEsp32(rx: SerialPin, tx: SerialPin, baud: BaudRate): void {
        serial.redirect(tx, rx, baud)
        basic.pause(1500)

        wifiConnected = false
        btConnected = false
        btReady = false
        lastLine = ""
        lastNormalizedLine = ""
        syncStatusIcons()

        serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
            let rawLine = serial.readUntil(serial.delimiters(Delimiters.NewLine))
            processIncomingLine(rawLine)
        })
    }

    /**
     * Send raw AT command
     */
    //% block="send AT $cmd wait $waitMs ms"
    //% weight=98
    export function sendAT(cmd: string, waitMs: number): void {
        serial.writeString(cmd + "\r\n")
        basic.pause(waitMs)
    }

    /**
     * OK 응답이 올 때까지 대기하며 AT 명령 전송
     */
    //% block="send AT $cmd and wait for OK"
    //% weight=97
    export function sendATWaitOK(cmd: string): void {
        lastLine = ""
        lastNormalizedLine = ""
        serial.writeString(cmd + "\r\n")

        let timeout = input.runningTime() + 5000

        while (input.runningTime() < timeout) {
            if (containsText(lastNormalizedLine, "OK")) return
            if (containsText(lastNormalizedLine, "ERROR")) return
            basic.pause(50)
        }
    }

    /**
     * Wi-Fi 연결
     */
    //% block="connect Wi-Fi ssid $ssid password $password"
    //% weight=90
    export function connectWifi(ssid: string, password: string): void {
        setWifiState(false)

        sendATWaitOK("AT")
        sendATWaitOK("AT+CWMODE=1")

        lastLine = ""
        lastNormalizedLine = ""
        serial.writeString("AT+CWJAP=\"" + ssid + "\",\"" + password + "\"\r\n")

        let timeout = input.runningTime() + 20000
        while (input.runningTime() < timeout) {
            if (wifiConnected || isWifiSuccessLine(lastNormalizedLine)) {
                setWifiState(true)
                basic.showIcon(IconNames.Yes)
                return
            }

            if (isWifiFailLine(lastNormalizedLine) || containsText(lastNormalizedLine, "ERROR")) {
                setWifiState(false)
                return
            }

            basic.pause(200)
        }
    }

    /**
     * Wi-Fi 연결 해제
     */
    //% block="disconnect Wi-Fi"
    //% weight=89
    export function disconnectWifi(): void {
        setWifiState(false)
        serial.writeString("AT+CWQAP\r\n")
    }

    /**
     * Is Wi-Fi connected?
     */
    //% block="Wi-Fi connected?"
    //% weight=88
    export function isWifiConnected(): boolean {
        return wifiConnected
    }

    /**
     * Wi-Fi 상태 확인 요청
     * ESP32가 WIFI:1 / WIFI:0 응답하면 아이콘까지 자동 반영됨
     */
    //% block="check Wi-Fi status"
    //% weight=87
    export function checkWifiStatus(): void {
        lastLine = ""
        lastNormalizedLine = ""
        serial.writeString("AT+WIFISTATUS?\r\n")
    }

    /**
     * ThingSpeak로 데이터를 전송합니다
     */
    //% block="ThingSpeak send api key $apiKey field1 $f1 field2 $f2 field3 $f3"
    //% weight=86
    export function thingSpeakSend(apiKey: string, f1: number, f2: number, f3: number): void {
        let request = "GET /update?api_key=" + apiKey +
            "&field1=" + f1 +
            "&field2=" + f2 +
            "&field3=" + f3 +
            " HTTP/1.1\r\n" +
            "Host: api.thingspeak.com\r\n\r\n"

        serial.writeString("AT+CIPSTART=\"TCP\",\"api.thingspeak.com\",80\r\n")
        if (!waitForResponse("CONNECT", 5000)) return

        serial.writeString("AT+CIPSEND=" + request.length + "\r\n")
        if (!waitForResponse(">", 2000)) {
            serial.writeString("AT+CIPCLOSE\r\n")
            return
        }

        serial.writeString(request)

        if (waitForResponse("SEND OK", 3000)) {
            basic.showIcon(IconNames.SmallHeart)
            basic.pause(200)
            basic.clearScreen()
            syncStatusIcons()
        }
    }

    function waitForResponse(target: string, timeout: number): boolean {
        let targetUpper = target.toUpperCase()
        let startTime = input.runningTime()

        while (input.runningTime() - startTime < timeout) {
            if (containsText(lastNormalizedLine, targetUpper)) return true
            if (containsText(lastNormalizedLine, "ERROR") || containsText(lastNormalizedLine, "FAIL")) return false
            basic.pause(20)
        }
        return false
    }

    /**
     * Connect Bluetooth by device name
     */
    //% block="connect Bluetooth name $name"
    //% weight=80
    export function connectBluetoothByName(name: string): void {
        setBtState(false)
        lastLine = ""
        lastNormalizedLine = ""
        serial.writeString("AT+BTCONNECT=\"" + name + "\"\r\n")
    }

    /**
     * Send one command character over Bluetooth
     */
    //% block="Bluetooth send text $text"
    //% weight=79
    export function btSend(text: string): void {
        serial.writeString("AT+BTSEND=\"" + text + "\"\r\n")
    }

    /**
     * Is Bluetooth connected?
     */
    //% block="Bluetooth connected?"
    //% weight=78
    export function isBluetoothConnected(): boolean {
        return btConnected
    }

    /**
     * Bluetooth 상태 확인 요청
     * ESP32가 BT:1 / BT:0 응답하면 아이콘까지 자동 반영됨
     */
    //% block="check Bluetooth status"
    //% weight=77
    export function checkBluetoothStatus(): void {
        lastLine = ""
        lastNormalizedLine = ""
        serial.writeString("AT+BTSTATUS?\r\n")
    }

    /**
     * Disconnect Bluetooth
     */
    //% block="disconnect Bluetooth"
    //% weight=76
    export function disconnectBluetooth(): void {
        setBtState(false)
        serial.writeString("AT+BTDISCONNECT\r\n")
    }

    /**
     * Last received line
     */
    //% block="last received line"
    //% weight=61
    export function getLastLine(): string {
        return lastLine
    }

    /**
     * Last normalized line
     */
    //% block="last normalized line"
    //% weight=60
    export function getLastNormalizedLine(): string {
        return lastNormalizedLine
    }
}