/**
 * TFT Graph & Status 통합 패키지 (ST7789 320x240 전용)
 */

//% color=#FFAA00 icon="\uf201" block="TFT Graph" weight=70
namespace TFTGraph {
    // --- 내부 변수 (설정 및 데이터 저장용) ---
    let _started = false
    let _mode = 0 // 1=single, 2=split

    let _pin1: AnalogPin = AnalogPin.P1
    let _pin2: AnalogPin = AnalogPin.P2
    let _label1 = "P1"
    let _label2 = "P2"

    let _thickness = 2
    let _smoothLevel = 2 // 0=없음..3=강
    let _pauseMs = 30 // 속도 제어
    let _resetMs = 6000 // 자동 리셋 주기

    let _yFixed = false
    let _yMinFixed = 0
    let _yMaxFixed = 1023

    // --- 레이아웃 상수 및 변수 ---
    const W = 320
    const H = 240
    export const STATUS_H = 26
    let margin = 8
    let infoW = 92
    let gap = 10

    let gx = 0, gy = 0, gw = 0, gh = 0
    let sectionH = 0, topY = 0, bottomY = 0
    let xPos = 0, lastY1 = -1, lastY2 = -1
    let f1 = 0, f2 = 0, fInit = false
    let min1 = 1023, max1 = 0, min2 = 1023, max2 = 0
    let lastReset = 0, tick = 0
    const TEXT_EVERY = 6

    let dataHistory1: number[] = []
    let dataHistory2: number[] = []
    let maxDataPoints = 150 // 화면 가로폭에 맞춰 조정 (gw / _thickness)

    function idiv(a: number, b: number): number {
        return (a / b) >> 0
    }

    /**
     * 상단 상태 표시줄에 메시지를 출력합니다.
     */
    //% block="상태 표시 $msg 색상 $color"
    //% msg.defl="준비 완료"
    //% weight=100
    export function drawStatus(msg: string, color: Color) {
        if (!msg) msg = ""

        //while (msg.indexOf("\r") >= 0) msg = msg.replace("\r", " ")
        //while (msg.indexOf("\n") >= 0) msg = msg.replace("\n", " ")
        //while (msg.indexOf("\t") >= 0) msg = msg.replace("\t", " ")

        if (msg.length > 20) {
            msg = msg.slice(0, 20)
        }

        RBTFT20.drawRectangle(0, 0, 270, STATUS_H - 3, Color.Black)

        TFTFont.drawText5x7(
            margin,
            6,
            msg,
            2,
            color,
            Color.Black
        )
    }

    /**
     * 그래프의 선 굵기, 부드러움, 그리기 속도를 설정합니다.
     */
    //% block="그래프 설정 선굵기 %thickness 부드러움 %smooth 속도 %speed"
    //% thickness.min=1 thickness.max=3 thickness.defl=2
    //% smooth.min=0 smooth.max=3 smooth.defl=2
    //% speed.min=0 speed.max=2 speed.defl=1
    //% weight=95
    export function config(thickness: number, smooth: number, speed: number) {
        _thickness = thickness
        _smoothLevel = smooth
        if (speed == 0) _pauseMs = 20
        else if (speed == 1) _pauseMs = 30
        else _pauseMs = 60
    }

    /**
     * 1개의 아날로그 핀을 사용하는 단일 그래프를 시작합니다.
     */
    //% block="그래프 시작 1개 핀 %pin 이름 %name"
    //% name.defl="센서"
    //% weight=85
    export function start1(pin: AnalogPin, name: string) {
        _mode = 1
        _pin1 = pin
        _label1 = name
        _started = true

        layoutCommon()
        drawBox(gx, gy, gw, gh, Color.DarkGrey)
        TFTFont.drawText5x7(margin + 6, gy + 6, _label1.toUpperCase(), 2, Color.Cyan, Color.Black)
        resetMinMax()
        xPos = 0
    }

    /**
     * 2개의 아날로그 핀을 사용하는 분할 그래프를 시작합니다.
     */
    //% block="그래프 시작 2개 핀1 %pin1 이름1 %name1 핀2 %pin2 이름2 %name2"
    //% name1.defl="센서A" name2.defl="센서B"
    //% weight=84
    export function start2(pin1: AnalogPin, name1: string, pin2: AnalogPin, name2: string) {
        _mode = 2
        _pin1 = pin1
        _label1 = name1
        _pin2 = pin2
        _label2 = name2
        _started = true

        layoutCommon()
        sectionH = idiv(gh - gap, 2)
        topY = gy
        bottomY = gy + sectionH + gap

        drawBox(gx, topY, gw, sectionH, Color.DarkGrey)
        drawBox(gx, bottomY, gw, sectionH, Color.DarkGrey)

        TFTFont.drawText5x7(margin + 6, topY + 6, _label1.toUpperCase(), 2, Color.Cyan, Color.Black)
        TFTFont.drawText5x7(margin + 6, bottomY + 6, _label2.toUpperCase(), 2, Color.Yellow, Color.Black)

        resetMinMax()
        xPos = 0
    }

    /**
     * 매 루프마다 호출하여 그래프를 갱신합니다.
     */
    //% block="그래프 업데이트"
    //% weight=80
    // 상단에 데이터를 담을 배열 변수 추가 필요 (전역 변수 영역)
    export function update() {
        if (!_started) return

        // 1. 센서 값 읽기 및 필터링 (기존 로직 유지)
        let v1 = pins.analogReadPin(_pin1)
        let v2 = (_mode == 2) ? pins.analogReadPin(_pin2) : 0

        if (!fInit) {
            f1 = v1; f2 = v2; fInit = true
        } else {
            let w = (_smoothLevel == 1) ? 2 : (_smoothLevel == 2) ? 4 : (_smoothLevel == 3) ? 6 : 0
            f1 = (f1 * (10 - w) + v1 * w) / 10
            if (_mode == 2) f2 = (f2 * (10 - w) + v2 * w) / 10
        }

        // 2. 스크롤용 데이터 배열 업데이트
        dataHistory1.push(f1)
        if (_mode == 2) dataHistory2.push(f2)

        // 배열 크기가 화면 폭을 넘어가면 가장 오래된 데이터 삭제
        if (dataHistory1.length > (gw / _thickness)) {
            dataHistory1.shift()
            if (_mode == 2) dataHistory2.shift()
        }

        // 3. 화면 전체 다시 그리기 (스크롤 효과)
        // 그래프 영역 전체를 한 번에 지웁니다.
        RBTFT20.drawRectangle(gx, gy, gw, gh, Color.Black)

        for (let i = 0; i < dataHistory1.length - 1; i++) {
            let currX = gx + (i * _thickness)
            let nextX = gx + ((i + 1) * _thickness)

            if (_mode == 1) {
                let yCurr = mapToY(dataHistory1[i], _yFixed ? _yMinFixed : min1, _yFixed ? _yMaxFixed : max1, gy + 1, gh - 2)
                let yNext = mapToY(dataHistory1[i+1], _yFixed ? _yMinFixed : min1, _yFixed ? _yMaxFixed : max1, gy + 1, gh - 2)
                // 선 연결
                drawVLine(nextX, yCurr, yNext, Color.Cyan)
            } else {
                // 모드 2 (상하 분할) 로직 생략(위와 동일한 방식으로 topY, bottomY 적용)
            }
        }

        // 4. 정보 텍스트 표시
        if (++tick >= TEXT_EVERY) {
            tick = 0
            _mode == 1 ? drawInfo1() : drawInfo2()
        }

        basic.pause(_pauseMs)
    }

    function layoutCommon() {
        RBTFT20.init()
        RBTFT20.drawRectangle(0, 0, W, H, Color.Black)

        gx = margin + infoW
        gy = STATUS_H + margin
        gw = W - gx - margin
        gh = H - gy - margin

        RBTFT20.drawRectangle(0, STATUS_H - 2, W, 1, Color.DarkGrey)

        drawBox(margin - 1, gy - 1, W - (margin - 1) * 2, gh + 2, Color.DarkGrey)
        drawBox(margin, gy, infoW - 2, gh, Color.DarkGrey)
    }

    function drawBox(x: number, y: number, w: number, h: number, c: Color) {
        RBTFT20.drawRectangle(x, y, w, 1, c)
        RBTFT20.drawRectangle(x, y + h - 1, w, 1, c)
        RBTFT20.drawRectangle(x, y, 1, h, c)
        RBTFT20.drawRectangle(x + w - 1, y, 1, h, c)
    }

    function drawVLine(x: number, y0: number, y1: number, color: Color) {
        let yStart = Math.min(y0, y1)
        let h = Math.abs(y0 - y1) + 1
        RBTFT20.drawRectangle(x, yStart, _thickness, h, color)
    }

    function clearColumn(x: number, areaY: number, areaH: number) {
        RBTFT20.drawRectangle(x, areaY + 1, _thickness, areaH - 2, Color.Black)
    }

    function resetMinMax() {
        min1 = 1023
        max1 = 0
        min2 = 1023
        max2 = 0
        lastY1 = -1
        lastY2 = -1
        fInit = false
        lastReset = input.runningTime()
    }

    function mapToY(v: number, vmin: number, vmax: number, areaTop: number, areaH: number): number {
        if (vmax <= vmin + 2) return areaTop + (areaH >> 1)

        let pad = idiv(vmax - vmin, 10) + 2
        let vmin_p = vmin - pad
        let vmax_p = vmax + pad

        let n = (v - vmin_p) / (vmax_p - vmin_p)
        n = n < 0 ? 0 : n > 1 ? 1 : n

        return areaTop + (areaH - 1) - Math.round(n * (areaH - 1))
    }

    function drawInfo1() {
        RBTFT20.drawRectangle(margin + 2, gy + 28, infoW - 6, 80, Color.Black)
        TFTFont.drawText5x7(margin + 6, gy + 28, "V:", 2, Color.Cyan, Color.Black)
        TFTFont.drawNumber7Seg(margin + 26, gy + 24, f1, 3, 15, 30, 4, Color.Cyan, Color.Black)
    }

    function drawInfo2() {
        RBTFT20.drawRectangle(margin + 2, topY + 28, infoW - 6, 80, Color.Black)
        TFTFont.drawNumber7Seg(margin + 26, topY + 24, f1, 3, 15, 30, 4, Color.Cyan, Color.Black)

        RBTFT20.drawRectangle(margin + 2, bottomY + 28, infoW - 6, 80, Color.Black)
        TFTFont.drawNumber7Seg(margin + 26, bottomY + 24, f2, 3, 15, 30, 4, Color.Yellow, Color.Black)
    }
}