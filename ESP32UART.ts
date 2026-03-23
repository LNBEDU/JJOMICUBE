/**
 * ESP32 UART bridge blocks for micro:bit
 */
//% color=#1E88E5 icon="\uf1eb" weight=90 block="ESP32 UART"
namespace ESP32UART {
    let lastLine = ""
    export let btConnected = false
    export let wifiConnected = false



    //WI-Fi와 Bluetooth 상태 아이콘을 TFTFont 네임스페이스의 drawStatusIcons 함수로 동기화하는 내부 함수
    function syncStatusIcons(): void {
        TFTFont.drawStatusIcons()
    }

    function containsText(src: string, key: string): boolean {
        TFTGraph.drawStatus(src, Color.DarkGreen)
        return src.indexOf(key) >= 0
    }


    // 메시지 수신 시 처리 함수 
    export function updateConnectionStatus(data: string) {
        let cleanData = data.trim()

        // WIFI 상태 체크
        if (cleanData == "WIFI:1") {
            wifiConnected = true
        } else if (cleanData == "WIFI:0") {
            wifiConnected = false
        }

        // BT 상태 체크
        if (cleanData == "BT:1") {
            btConnected = true
        } else if (cleanData == "BT:0") {
            btConnected = false
        }

        // 상태가 바뀌었으므로 화면 아이콘 업데이트 요청
        // TFTFont 네임스페이스의 함수를 호출합니다.
        syncStatusIcons()
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
        

        disconnectWifi()
        basic.pause(100);
        disconnectBluetooth()
        basic.pause(100);
    }




    /**
     * Send raw AT command
     */
    //% block="send AT $cmd"
    //% weight=98
    export function sendAT(cmd: string): void {
        serial.writeString(cmd + "\r\n")
        basic.pause(500)
    }

    /**
     * OK 응답이 올 때까지 대기하며 AT 명령 전송
     */
    //% block="send AT $cmd and wait for OK"
    //% weight=97
    export function sendATWaitOK(cmd: string): void {
        lastLine = ""
        
        //basic.pause(500)

        let timeout = input.runningTime() + 5000

        while (input.runningTime() < timeout) {
            serial.writeString(cmd + "\r\n")
            let rawLine = serial.readUntil(serial.delimiters(Delimiters.NewLine))
                updateConnectionStatus(rawLine)
                lastLine = rawLine
            if (containsText(lastLine, "OK")) {
                return }
            if (containsText(lastLine, "ERROR")) return
            basic.pause(500)
            serial.writeString(cmd + "\r\n")
        }
    }

    /**
     * Wi-Fi 연결
     */
    //% block="connect Wi-Fi ssid $ssid password $password"
    //% weight=90
    export function connectWifi(ssid: string, password: string): void {
        // 1. 초기 상태 설정
        wifiConnected = false

        // 2. AT 명령 전송
        sendATWaitOK("AT")
        sendATWaitOK("AT+CWMODE=1")
        sendATWaitOK("AT+CWJAP=\"" + ssid + "\",\"" + password + "\"")

        TFTGraph.drawStatus("WIFI CONNECTING...", Color.DarkGreen)

        // 3. 타임아웃 설정 (20초)
        let timeout = input.runningTime() + 20000

        // 4. 연결될 때까지 대기 루프
        while (input.runningTime() < timeout) {

            // 비교 연산자 '='를 사용해야 합니다!
            if (wifiConnected = true) {
                TFTGraph.drawStatus("WIFI CONNECTED", Color.DarkGreen)
                return // 연결 성공 시 함수 종료
            } else {wifiConnected = false}

            basic.pause(500) // 너무 자주 체크하기보다 0.5초 정도 여유를 줍니다.
        }

        // 5. 루프를 빠져나왔다는 것은 20초 동안 성공하지 못했다는 뜻 (타임아웃)
        wifiConnected = false // 최종적으로 실패 처리
        TFTGraph.drawStatus("WIFI ERROR: TIMEOUT", Color.Red)
    }

    /**
     * Wi-Fi 연결 해제
     */
    //% block="disconnect Wi-Fi"
    //% weight=89
    export function disconnectWifi(): void {
         sendATWaitOK("AT+CWQAP\r\n")
         wifiConnected = false
         TFTGraph.drawStatus("WIFI DISCONNECTED", Color.Red)
         basic.pause(500)
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

        let timeout = input.runningTime() + 5000

        while (input.runningTime() < timeout) {
            // 2. 응답 내용에 따라 즉시 true/false 반환
            if (containsText(lastLine, "WIFI:1")) {
                return true
            }
            if (containsText(lastLine, "WIFI:0")) {
                return false
            }
            basic.pause(50)
        }

        // 3. 5초 동안 응답이 없으면 기본값으로 false 반환
        return false 
    }
    

    /**
     * ThingSpeak로 데이터를 전송합니다
     */
    //% block="ThingSpeak send api key $apiKey field1 $f1 field2 $f2 field3 $f3"
    //% weight=86
    export function thingSpeakSend(apiKey: string, f1: number, f2: number, f3: number): void {
    // 1. 요청 메시지를 더 단순하고 명확하게 구성 (HTTP 1.0은 Host 헤더 없이도 동작하는 경우가 많아 더 안정적임)
    let request = "GET /update?api_key=" + apiKey + 
                  "&field1=" + f1 + 
                  "&field2=" + f2 + 
                  "&field3=" + f3 + 
                  " HTTP/1.0\r\n\r\n" // 마지막에 빈 줄(\r\n\r\n) 필수!

    lastLine = ""
    serial.writeString("AT+CIPCLOSE\r\n")
    basic.pause(300)

    // 2. TCP 연결
    serial.writeString("AT+CIPSTART=\"TCP\",\"api.thingspeak.com\",80\r\n")
    if (!waitForConnectOrOK(5000)) {
        TFTGraph.drawStatus("TS TCP FAIL", Color.Red)
        return
    }

    // 3. 전송 길이 확인 (매우 중요)
    // request 문자열의 정확한 길이를 전송
    serial.writeString("AT+CIPSEND=" + request.length + "\r\n")

    if (!waitForPrompt(3000)) {
        serial.writeString("AT+CIPCLOSE\r\n")
        TFTGraph.drawStatus("TS READY FAIL", Color.Red)
        return
    }

    // 4. 데이터 전송
    serial.writeString(request)

    if (!waitForSendOK(5000)) {
        serial.writeString("AT+CIPCLOSE\r\n")
        TFTGraph.drawStatus("TS SEND FAIL", Color.Red)
        return
    }

    // 서버가 처리할 시간을 충분히 줌
    basic.pause(2000)
    serial.writeString("AT+CIPCLOSE\r\n")
    TFTGraph.drawStatus("TS SENT", Color.Green)
}

function waitForConnectOrOK(timeoutMs: number): boolean {

    let timeout = input.runningTime() + timeoutMs

    while (input.runningTime() < timeout) {
        lastLine = serial.readUntil(serial.delimiters(Delimiters.NewLine))
        if (containsText(lastLine, "CONNECT")) return true
        if (containsText(lastLine, "OK")) return true
        if (containsText(lastLine, "ERROR")) return false
        basic.pause(50)
    }
    return false
}

function waitForPrompt(timeoutMs: number): boolean {
    let timeout = input.runningTime() + timeoutMs

    while (input.runningTime() < timeout) {
        lastLine = serial.readUntil(serial.delimiters(Delimiters.NewLine))
        if (containsText(lastLine, ">")) return true
        if (containsText(lastLine, "ERROR")) return false
        basic.pause(50)
    }
    return false
}

function waitForSendOK(timeoutMs: number): boolean {
    let timeout = input.runningTime() + timeoutMs

    while (input.runningTime() < timeout) {
        lastLine = serial.readUntil(serial.delimiters(Delimiters.NewLine))
        if (containsText(lastLine, "SEND OK")) return true
        if (containsText(lastLine, "ERROR")) return false
        basic.pause(50)
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

        // 4. 연결될 때까지 대기 루프
        while (input.runningTime() < timeout) {

            // 비교 연산자 '='를 사용해야 합니다!
            if (btConnected = true) {
                TFTGraph.drawStatus("BT CONNECTED", Color.DarkGreen)
                return // 연결 성공 시 함수 종료
            } else {btConnected = false}

            basic.pause(500) // 너무 자주 체크하기보다 0.5초 정도 여유를 줍니다.
        }




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
     * Bluetooth 상태 확인 요청 (연결됨: true, 연결 안 됨: false)
     */
    //% block="check Bluetooth status"
    //% weight=77
    export function checkBluetoothStatus(): boolean { // 1. 반환 타입을 boolean으로 변경
        sendATWaitOK("AT+BTSTATUS?")

        let timeout = input.runningTime() + 5000

        while (input.runningTime() < timeout) {
            // 2. 응답 내용에 따라 즉시 true/false 반환
            if (containsText(lastLine, "BT:1")) {
                return true
            }
            if (containsText(lastLine, "BT:0")) {
                return false
            }
            basic.pause(50)
        }

        // 3. 5초 동안 응답이 없으면 기본값으로 false 반환
        return false 
    }

    /**
     * Disconnect Bluetooth
     */
    //% block="disconnect Bluetooth"
    //% weight=76
    export function disconnectBluetooth(): void {
        sendATWaitOK("AT+BTDISCONNECT\r\n")

        let timeout = input.runningTime() + 5000

        while (input.runningTime() < timeout) {
            if (containsText(lastLine, "OK")) {
                btConnected = false
                TFTGraph.drawStatus("BT DISCONNECTED", Color.Red)
                return
            }
            basic.pause(50)
        } 

        TFTGraph.drawStatus("BT DISCONNECTED FAILED", Color.Red)
 
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