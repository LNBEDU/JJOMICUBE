/**
 * ESP32 UART bridge blocks for micro:bit
 */
//% color=#1E88E5 icon="\uf1eb" weight=90 block="ESP32 UART"
namespace ESP32UART {
    let lastLine = ""
    export let btConnected = false
    export let wifiConnected = false

    function syncStatusIcons(): void {
        TFTFont.drawStatusIcons()
    }

    function containsText(src: string, key: string): boolean {
        if (!src) return false
        TFTGraph.drawStatus(src, Color.DarkGreen)
        return src.indexOf(key) >= 0
    }

    function normalizeLine(s: string): string {
        if (!s) return ""
        while (s.indexOf("\r") >= 0) s = s.replace("\r", "")
        while (s.indexOf("\n") >= 0) s = s.replace("\n", "")
        return s.trim()
    }

    export function updateConnectionStatus(data: string) {
        let cleanData = normalizeLine(data)

        if (cleanData == "WIFI:1") {
            wifiConnected = true
        } else if (cleanData == "WIFI:0") {
            wifiConnected = false
        }

        if (cleanData == "BT:1") {
            btConnected = true
        } else if (cleanData == "BT:0") {
            btConnected = false
        }

        syncStatusIcons()
    }

    function readOneLine(timeoutMs: number): string {
        let endTime = input.runningTime() + timeoutMs
        let line = ""

        while (input.runningTime() < endTime) {
            line = serial.readUntil(serial.delimiters(Delimiters.NewLine))
            line = normalizeLine(line)

            if (line.length > 0) {
                updateConnectionStatus(line)
                lastLine = line
                return line
            }
            basic.pause(10)
        }
        return ""
    }

    /**
     * Initialize UART for ESP32 bridge
     */
    //% block="init ESP32 RX:P8 TX:P12 baudrate:115200"
    //% weight=100
    export function initEsp32(): void {
        serial.redirect(SerialPin.P12, SerialPin.P8, BaudRate.BaudRate115200)
        basic.pause(100)

        wifiConnected = false
        btConnected = false
        lastLine = ""

        resetEsp32()
        basic.pause(100)
    }

    /**
     * Send raw AT command
     */
    //% block="send AT $cmd"
    //% weight=99
    export function sendAT(cmd: string): void {
        serial.writeString(cmd + "\r\n")
        basic.pause(300)
    }

    /**
     * Reset ESP32 module
     */
    //% block="Reset ESP32"
    //% weight=98
     export function resetEsp32(): void {
        sendATWaitOK("AT+RST")
        wifiConnected = false
        btConnected = false
        TFTGraph.drawStatus("Reset ESP32", Color.Red)
        basic.pause(200)
        syncStatusIcons()
    }

    /**
     * OK 응답이 올 때까지 대기하며 AT 명령 전송
     */
    //% block="send AT $cmd and wait for OK"
    //% weight=97
    export function sendATWaitOK(cmd: string): void {
        lastLine = ""
        serial.writeString(cmd + "\r\n")

        let timeout = input.runningTime() + 5000

        while (input.runningTime() < timeout) {
            let rawLine = readOneLine(300)
            if (rawLine.length == 0) {
                basic.pause(10)
                continue
            }

            if (containsText(rawLine, "OK")) return
            if (containsText(rawLine, "ERROR")) return
            if (containsText(rawLine, "SEND OK")) return
            if (containsText(rawLine, "CONNECT")) return

            basic.pause(10)
        }
    }

    /**
     * Wi-Fi 연결
     */
    //% block="connect Wi-Fi ssid $ssid password $password"
    //% weight=90
    export function connectWifi(ssid: string, password: string): void {
        wifiConnected = false

        sendATWaitOK("AT")
        sendATWaitOK("AT+CWMODE=1")
        sendATWaitOK("AT+CWJAP=\"" + ssid + "\",\"" + password + "\"")

        TFTGraph.drawStatus("WIFI CONNECTING...", Color.DarkGreen)

        let timeout = input.runningTime() + 20000

        while (input.runningTime() < timeout) {
            let rawLine = readOneLine(300)

            if (rawLine.length > 0) {
                if (rawLine == "WIFI:1" || rawLine.indexOf("WIFI CONNECTED") >= 0) {
                    wifiConnected = true
                    TFTGraph.drawStatus("WIFI CONNECTED", Color.DarkGreen)
                    syncStatusIcons()
                    return
                }
                if (rawLine.indexOf("ERROR") >= 0) {
                    break
                }
            }

            if (wifiConnected) {
                TFTGraph.drawStatus("WIFI CONNECTED", Color.DarkGreen)
                syncStatusIcons()
                return
            }

            basic.pause(100)
        }

        wifiConnected = false
        TFTGraph.drawStatus("WIFI ERROR: TIMEOUT", Color.Red)
        syncStatusIcons()
    }

    /**
     * Wi-Fi 연결 해제
     */
    //% block="disconnect Wi-Fi"
    //% weight=89
    export function disconnectWifi(): void {
        sendATWaitOK("AT+CWQAP")
        wifiConnected = false
        TFTGraph.drawStatus("WIFI DISCONNECTED", Color.Red)
        basic.pause(200)
        syncStatusIcons()
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
     */
    //% block="check Wi-Fi status"
    //% weight=87
    export function checkWifiStatus(): boolean {
        sendATWaitOK("AT+WIFISTATUS?")

        let timeout = input.runningTime() + 3000
        while (input.runningTime() < timeout) {
            let rawLine = readOneLine(200)

            if (rawLine == "WIFI:1") return true
            if (rawLine == "WIFI:0") return false

            basic.pause(20)
        }
        return false
    }

    /**
     * ThingSpeak로 데이터를 전송합니다
     */
    //% block="ThingSpeak send api key $apiKey field1 $f1 field2 $f2 field3 $f3"
    //% weight=86
    export function thingSpeakSend(apiKey: string, f1: number, f2: number, f3: number): void {
        let body =
            "field1=" + f1 +
            "&field2=" + f2 +
            "&field3=" + f3 +
            "&headers=false"

        let request =
            "POST /update HTTP/1.1\r\n" +
            "Host: api.thingspeak.com\r\n" +
            "User-Agent: JJOMICUBE/1.0\r\n" +
            "Connection: close\r\n" +
            "X-THINGSPEAKAPIKEY: " + apiKey + "\r\n" +
            "Content-Type: application/x-www-form-urlencoded\r\n" +
            "Content-Length: " + body.length + "\r\n" +
            "\r\n" +
            body

        if (!wifiConnected) {
            TFTGraph.drawStatus("WIFI NOT READY", Color.Red)
            return
        }

        lastLine = ""

        sendATWaitOK("AT+CIPCLOSE")
        basic.pause(200)

        sendATWaitOK("AT+CIPSTART=\"TCP\",\"api.thingspeak.com\",80")
        basic.pause(100)

        serial.writeString("AT+CIPSEND=" + request.length + "\r\n")

        if (!waitForPrompt(3000)) {
            serial.writeString("AT+CIPCLOSE\r\n")
            TFTGraph.drawStatus("NO PROMPT", Color.Red)
            return
        }

        serial.writeString(request)

        if (!waitForSendOK(5000)) {
            serial.writeString("AT+CIPCLOSE\r\n")
            TFTGraph.drawStatus("TS SEND FAIL", Color.Red)
            return
        }

        basic.pause(1000)
        serial.writeString("AT+CIPCLOSE\r\n")
        TFTGraph.drawStatus("TS SENT", Color.Green)
    }

    function waitForPrompt(timeoutMs: number): boolean {
        let timeout = input.runningTime() + timeoutMs

        while (input.runningTime() < timeout) {
            let rawLine = readOneLine(200)
            if (rawLine.length == 0) {
                basic.pause(10)
                continue
            }

            if (rawLine == ">") return true
            if (containsText(rawLine, "ERROR")) return false

            basic.pause(10)
        }
        return false
    }

    function waitForSendOK(timeoutMs: number): boolean {
        let timeout = input.runningTime() + timeoutMs

        while (input.runningTime() < timeout) {
            let rawLine = readOneLine(300)
            if (rawLine.length == 0) {
                basic.pause(10)
                continue
            }

            if (containsText(rawLine, "SEND OK")) return true
            if (containsText(rawLine, "ERROR")) return false

            basic.pause(10)
        }
        return false
    }

    /**
     * Connect Bluetooth by device name
     */
    //% block="connect Bluetooth name $name"
    //% weight=80
    export function connectBluetoothByName(name: string): void {
        btConnected = false
        lastLine = ""
        serial.writeString("AT+BTCONNECT=\"" + name + "\"\r\n")

        TFTGraph.drawStatus("BT CONNECTING...", Color.DarkGreen)

        let timeout = input.runningTime() + 20000

        while (input.runningTime() < timeout) {
            let rawLine = readOneLine(300)

            if (rawLine.length > 0) {
                if (rawLine == "BT:1" || rawLine.indexOf("BT CONNECTED") >= 0) {
                    btConnected = true
                    TFTGraph.drawStatus("BT CONNECTED", Color.DarkGreen)
                    syncStatusIcons()
                    return
                }
                if (rawLine.indexOf("ERROR") >= 0) {
                    break
                }
            }

            if (btConnected) {
                TFTGraph.drawStatus("BT CONNECTED", Color.DarkGreen)
                syncStatusIcons()
                return
            }

            basic.pause(100)
        }

        btConnected = false
        TFTGraph.drawStatus("BT ERROR: TIMEOUT", Color.Red)
        syncStatusIcons()
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
     */
    //% block="check Bluetooth status"
    //% weight=77
    export function checkBluetoothStatus(): boolean {
        sendATWaitOK("AT+BTSTATUS?")

        let timeout = input.runningTime() + 3000
        while (input.runningTime() < timeout) {
            let rawLine = readOneLine(200)

            if (rawLine == "BT:1") return true
            if (rawLine == "BT:0") return false

            basic.pause(20)
        }
        return false
    }

    /**
     * Disconnect Bluetooth
     */
    //% block="disconnect Bluetooth"
    //% weight=76
    export function disconnectBluetooth(): void {
        sendATWaitOK("AT+BTDISCONNECT")
        btConnected = false
        TFTGraph.drawStatus("BT DISCONNECTED", Color.Red)
        basic.pause(100)
        syncStatusIcons()
    }

    /**
     * Last received line
     */
    //% block="last received line"
    //% weight=61
    export function getLastLine(): string {
        return lastLine
    }
}