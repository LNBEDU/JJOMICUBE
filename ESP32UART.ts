/**
 * micro:bit용 ESP32 UART 브리지 블록
 */
//% color=#1E88E5 icon="\uf1eb" weight=90 block="ESP32 UART"
namespace ESP32UART {
    let lastLine = ""
    export let btConnected = false
    export let wifiConnected = false

    function syncStatusIcons(): void {
        TFTFont.drawStatusIcons()
    }

    function normalizeLine(s: string): string {
        if (!s) return ""
        while (s.indexOf("\r") >= 0) s = s.replace("\r", "")
        while (s.indexOf("\n") >= 0) s = s.replace("\n", "")
        return s.trim()
    }

    function containsText(src: string, key: string): boolean {
        if (!src) return false
        return src.indexOf(key) >= 0
    }

    function showLine(line: string): void {
        if (line && line.length > 0) {
            TFTGraph.drawStatus(line, Color.DarkGreen)
        }
    }

    export function updateConnectionStatus(data: string): void {
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

        while (input.runningTime() < endTime) {
            let raw = serial.readUntil(serial.delimiters(Delimiters.NewLine))
            raw = normalizeLine(raw)

            if (raw.length > 0) {
                lastLine = raw
                updateConnectionStatus(raw)
                showLine(raw)
                return raw
            }

            basic.pause(10)
        }

        return ""
    }

    function waitForAny(timeoutMs: number, key1: string, key2: string): string {
        let endTime = input.runningTime() + timeoutMs

        while (input.runningTime() < endTime) {
            let line = readOneLine(200)
            if (line.length == 0) {
                basic.pause(10)
                continue
            }

            if (key1.length > 0 && containsText(line, key1)) return key1
            if (key2.length > 0 && containsText(line, key2)) return key2
        }

        return ""
    }

    /**
     * ESP32용 UART 초기화
     */
    //% block="ESP32 초기화 RX:P8 TX:P12 보드레이트:115200"
    //% weight=100
    export function initEsp32(): void {
        serial.redirect(SerialPin.P12, SerialPin.P8, BaudRate.BaudRate115200)
        basic.pause(100)

        wifiConnected = false
        btConnected = false
        lastLine = ""

        syncStatusIcons()

        // ESP8266 호환형 부팅 메시지 정리용
        basic.pause(300)

        disconnectWifi()
        basic.pause(100)
        disconnectBluetooth()
        basic.pause(100)
    }

    /**
     * AT 명령 보내기
     */
    //% block="AT 명령 보내기 $cmd"
    //% weight=98
    export function sendAT(cmd: string): void {
        lastLine = ""
        serial.writeString(cmd + "\r\n")
        basic.pause(200)
    }

    /**
     * OK 또는 ERROR 응답 대기
     */
    //% block="AT 명령 $cmd 보내고 OK 기다리기"
    //% weight=97
    export function sendATWaitOK(cmd: string): boolean {
        lastLine = ""
        serial.writeString(cmd + "\r\n")

        let endTime = input.runningTime() + 5000

        while (input.runningTime() < endTime) {
            let line = readOneLine(250)

            if (line.length == 0) {
                basic.pause(10)
                continue
            }

            if (containsText(line, "OK")) return true
            if (containsText(line, "ERROR")) return false
            if (containsText(line, "FAIL")) return false

            basic.pause(10)
        }

        return false
    }

    /**
     * CONNECT 또는 OK 응답 대기
     */
    function waitForConnectOrOK(timeoutMs: number): boolean {
        let endTime = input.runningTime() + timeoutMs

        while (input.runningTime() < endTime) {
            let line = readOneLine(250)

            if (line.length == 0) {
                basic.pause(10)
                continue
            }

            if (containsText(line, "CONNECT")) return true
            if (containsText(line, "OK")) return true
            if (containsText(line, "ALREADY CONNECTED")) return true
            if (containsText(line, "ERROR")) return false
            if (containsText(line, "FAIL")) return false
        }

        return false
    }

    /**
     * > 프롬프트 대기
     */
    function waitForPrompt(timeoutMs: number): boolean {
        let endTime = input.runningTime() + timeoutMs

        while (input.runningTime() < endTime) {
            let line = readOneLine(250)

            if (line.length == 0) {
                basic.pause(10)
                continue
            }

            if (line == ">") return true
            if (containsText(line, "ERROR")) return false
            if (containsText(line, "FAIL")) return false
        }

        return false
    }

    /**
     * SEND OK 응답 대기
     */
    function waitForSendOK(timeoutMs: number): boolean {
        let endTime = input.runningTime() + timeoutMs

        while (input.runningTime() < endTime) {
            let line = readOneLine(250)

            if (line.length == 0) {
                basic.pause(10)
                continue
            }

            if (containsText(line, "SEND OK")) return true
            if (containsText(line, "ERROR")) return false
            if (containsText(line, "FAIL")) return false
        }

        return false
    }

    /**
     * 와이파이 연결
     */
    //% block="와이파이 연결 SSID $ssid 비밀번호 $password"
    //% weight=90
    export function connectWifi(ssid: string, password: string): void {
        wifiConnected = false
        syncStatusIcons()

        TFTGraph.drawStatus("와이파이 연결중...", Color.DarkGreen)

        if (!sendATWaitOK("AT")) {
            TFTGraph.drawStatus("ESP 준비 안됨", Color.Red)
            return
        }

        if (!sendATWaitOK("AT+CWMODE=1")) {
            TFTGraph.drawStatus("와이파이 모드 실패", Color.Red)
            return
        }

        lastLine = ""
        serial.writeString("AT+CWJAP=\"" + ssid + "\",\"" + password + "\"\r\n")

        let endTime = input.runningTime() + 25000

        while (input.runningTime() < endTime) {
            let line = readOneLine(300)

            if (line.length == 0) {
                basic.pause(20)
                continue
            }

            if (line == "WIFI:1") {
                wifiConnected = true
                TFTGraph.drawStatus("와이파이 연결됨", Color.Green)
                syncStatusIcons()
                return
            }

            if (containsText(line, "WIFI CONNECTED")) {
                wifiConnected = true
            }

            if (containsText(line, "OK") && wifiConnected) {
                TFTGraph.drawStatus("와이파이 연결됨", Color.Green)
                syncStatusIcons()
                return
            }

            if (containsText(line, "FAIL") || containsText(line, "ERROR")) {
                wifiConnected = false
                TFTGraph.drawStatus("와이파이 연결 실패", Color.Red)
                syncStatusIcons()
                return
            }
        }

        wifiConnected = false
        TFTGraph.drawStatus("와이파이 시간초과", Color.Red)
        syncStatusIcons()
    }

    /**
     * 와이파이 연결 해제
     */
    //% block="와이파이 연결 해제"
    //% weight=89
    export function disconnectWifi(): void {
        sendATWaitOK("AT+CWQAP")
        wifiConnected = false
        TFTGraph.drawStatus("와이파이 해제됨", Color.Red)
        syncStatusIcons()
    }

    /**
     * 와이파이 연결 여부
     */
    //% block="와이파이 연결됨?"
    //% weight=88
    export function isWifiConnected(): boolean {
        return wifiConnected
    }

    /**
     * 와이파이 상태 확인 요청
     */
    //% block="와이파이 상태 확인"
    //% weight=87
    export function checkWifiStatus(): boolean {
        lastLine = ""
        serial.writeString("AT+WIFISTATUS?\r\n")

        let endTime = input.runningTime() + 3000

        while (input.runningTime() < endTime) {
            let line = readOneLine(250)

            if (line.length == 0) {
                basic.pause(10)
                continue
            }

            if (line == "WIFI:1") {
                wifiConnected = true
                syncStatusIcons()
                return true
            }

            if (line == "WIFI:0") {
                wifiConnected = false
                syncStatusIcons()
                return false
            }
        }

        return wifiConnected
    }

    /**
     * ThingSpeak로 데이터 전송
     */
    //% block="ThingSpeak 보내기 API키 $apiKey field1 $f1 field2 $f2 field3 $f3"
    //% weight=86
    export function thingSpeakSend(apiKey: string, f1: number, f2: number, f3: number): void {
        if (!wifiConnected) {
            TFTGraph.drawStatus("와이파이 준비 안됨", Color.Red)
            return
        }

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

        TFTGraph.drawStatus("TS TCP 시작", Color.DarkGreen)

        sendATWaitOK("AT+CIPCLOSE")
        basic.pause(100)

        lastLine = ""
        serial.writeString("AT+CIPSTART=\"TCP\",\"api.thingspeak.com\",80\r\n")

        if (!waitForConnectOrOK(5000)) {
            serial.writeString("AT+CIPCLOSE\r\n")
            TFTGraph.drawStatus("TCP 연결 실패", Color.Red)
            return
        }

        basic.pause(50)

        lastLine = ""
        serial.writeString("AT+CIPSEND=" + request.length + "\r\n")

        if (!waitForPrompt(3000)) {
            serial.writeString("AT+CIPCLOSE\r\n")
            TFTGraph.drawStatus("프롬프트 없음", Color.Red)
            return
        }

        serial.writeString(request)

        if (!waitForSendOK(6000)) {
            serial.writeString("AT+CIPCLOSE\r\n")
            TFTGraph.drawStatus("TS 전송 실패", Color.Red)
            return
        }

        basic.pause(500)
        serial.writeString("AT+CIPCLOSE\r\n")
        TFTGraph.drawStatus("TS 전송 완료", Color.Green)
    }

    /**
     * 이름으로 블루투스 연결
     */
    //% block="블루투스 이름으로 연결 $name"
    //% weight=80
    export function connectBluetoothByName(name: string): void {
        btConnected = false
        syncStatusIcons()

        TFTGraph.drawStatus("블루투스 연결중...", Color.DarkGreen)

        lastLine = ""
        serial.writeString("AT+BTCONNECT=\"" + name + "\"\r\n")

        let endTime = input.runningTime() + 20000

        while (input.runningTime() < endTime) {
            let line = readOneLine(300)

            if (line.length == 0) {
                basic.pause(20)
                continue
            }

            if (line == "BT:1") {
                btConnected = true
                TFTGraph.drawStatus("블루투스 연결됨", Color.Green)
                syncStatusIcons()
                return
            }

            if (containsText(line, "BT CONNECTED")) {
                btConnected = true
            }

            if (containsText(line, "OK") && btConnected) {
                TFTGraph.drawStatus("블루투스 연결됨", Color.Green)
                syncStatusIcons()
                return
            }

            if (containsText(line, "ERROR") || containsText(line, "FAIL")) {
                btConnected = false
                TFTGraph.drawStatus("블루투스 연결 실패", Color.Red)
                syncStatusIcons()
                return
            }
        }

        btConnected = false
        TFTGraph.drawStatus("블루투스 시간초과", Color.Red)
        syncStatusIcons()
    }

    /**
     * 블루투스로 문자열 전송
     */
    //% block="블루투스로 텍스트 보내기 $text"
    //% weight=79
    export function btSend(text: string): void {
        serial.writeString("AT+BTSEND=\"" + text + "\"\r\n")
    }

    /**
     * 블루투스 연결 여부
     */
    //% block="블루투스 연결됨?"
    //% weight=78
    export function isBluetoothConnected(): boolean {
        return btConnected
    }

    /**
     * 블루투스 상태 확인 요청
     */
    //% block="블루투스 상태 확인"
    //% weight=77
    export function checkBluetoothStatus(): boolean {
        lastLine = ""
        serial.writeString("AT+BTSTATUS?\r\n")

        let endTime = input.runningTime() + 3000

        while (input.runningTime() < endTime) {
            let line = readOneLine(250)

            if (line.length == 0) {
                basic.pause(10)
                continue
            }

            if (line == "BT:1") {
                btConnected = true
                syncStatusIcons()
                return true
            }

            if (line == "BT:0") {
                btConnected = false
                syncStatusIcons()
                return false
            }
        }

        return btConnected
    }

    /**
     * 블루투스 연결 해제
     */
    //% block="블루투스 연결 해제"
    //% weight=76
    export function disconnectBluetooth(): void {
        sendATWaitOK("AT+BTDISCONNECT")
        btConnected = false
        TFTGraph.drawStatus("블루투스 해제됨", Color.Red)
        syncStatusIcons()
    }

    /**
     * 마지막으로 받은 한 줄
     */
    //% block="마지막으로 받은 줄"
    //% weight=61
    export function getLastLine(): string {
        return lastLine
    }
}