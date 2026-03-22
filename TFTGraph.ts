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
    let _smoothLevel = 2 // 0=없음, 3=강
    let _pauseMs = 30 // 속도 제어
    let _resetMs = 6000 // 현재 코드에서는 유지용

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

    let xPos = 0
    let lastY1 = -1
    let lastY2 = -1

    let f1 = 0
    let f2 = 0
    let fInit = false

    let min1 = 1023
    let max1 = 0
    let min2 = 1023
    let max2 = 0

    let lastReset = 0
    let tick = 0
    const TEXT_EVERY = 6

    // 실제 플롯 영역
    let plotTop1 = 0
    let plotH1 = 0
    let plotTop2 = 0
    let plotH2 = 0

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

        while (msg.indexOf("\r") >= 0) msg = msg.replace("\r", " ")
        while (msg.indexOf("\n") >= 0) msg = msg.replace("\n", " ")
        while (msg.indexOf("\t") >= 0) msg = msg.replace("\t", " ")

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

        if (_thickness < 1) _thickness = 1
        if (_thickness > 3) _thickness = 3

        if (speed == 0) _pauseMs = 20
        else if (speed == 1) _pauseMs = 30
        else _pauseMs = 60
    }

    /**
     * Y축을 고정 범위로 설정합니다.
     */
    //% block="Y축 고정 최소 %vmin 최대 %vmax"
    //% weight=94
    export function setYFixed(vmin: number, vmax: number) {
        _yFixed = true
        _yMinFixed = vmin
        _yMaxFixed = vmax
    }

    /**
     * Y축 자동 스케일로 설정합니다.
     */
    //% block="Y축 자동"
    //% weight=93
    export function setYAuto() {
        _yFixed = false
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

        plotTop1 = gy + 18
        plotH1 = gh - 22

        resetMinMax()
        clearSinglePlotArea()

        xPos = 0
        lastY1 = -1
        lastY2 = -1
        tick = 0
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

        plotTop1 = topY + 18
        plotH1 = sectionH - 22
        plotTop2 = bottomY + 18
        plotH2 = sectionH - 22

        resetMinMax()
        clearSplitPlotArea()

        xPos = 0
        lastY1 = -1
        lastY2 = -1
        tick = 0
    }

    /**
     * 매 루프마다 호출하여 그래프를 갱신합니다.
     */
    //% block="그래프 업데이트"
    //% weight=80
    export function update() {
        if (!_started) return

        let v1 = pins.analogReadPin(_pin1)
        let v2 = (_mode == 2) ? pins.analogReadPin(_pin2) : 0

        // smoothing
        if (!fInit) {
            f1 = v1
            f2 = v2
            fInit = true
        } else {
            let w = (_smoothLevel == 1) ? 2 : (_smoothLevel == 2) ? 4 : (_smoothLevel == 3) ? 6 : 0
            if (w > 0) {
                f1 = (f1 * (10 - w) + v1 * w) / 10
                if (_mode == 2) f2 = (f2 * (10 - w) + v2 * w) / 10
            } else {
                f1 = v1
                if (_mode == 2) f2 = v2
            }
        }

        // min/max 갱신
        if (_yFixed) {
            min1 = _yMinFixed
            max1 = _yMaxFixed
            if (_mode == 2) {
                min2 = _yMinFixed
                max2 = _yMaxFixed
            }
        } else {
            if (xPos == 0) {
                min1 = f1
                max1 = f1
                if (_mode == 2) {
                    min2 = f2
                    max2 = f2
                }
            } else {
                if (f1 < min1) min1 = f1
                if (f1 > max1) max1 = f1

                if (_mode == 2) {
                    if (f2 < min2) min2 = f2
                    if (f2 > max2) max2 = f2
                }
            }
        }

        if (min1 == max1) max1 = min1 + 1
        if (_mode == 2 && min2 == max2) max2 = min2 + 1

        let plotLeft = gx + 2
        let plotRight = gx + gw - _thickness - 2
        let stepX = _thickness
        let currX = plotLeft + xPos * stepX

        // 그래프가 끝까지 찼으면 전체 지우고 다시 시작
        if (currX > plotRight) {
            if (_mode == 1) {
                clearSinglePlotArea()
            } else {
                clearSplitPlotArea()
            }

            xPos = 0
            currX = plotLeft
            lastY1 = -1
            lastY2 = -1

            if (!_yFixed) {
                min1 = f1
                max1 = f1
                if (_mode == 2) {
                    min2 = f2
                    max2 = f2
                }
            }
        }

        // 채널 1
        let y1 = mapToY(
            f1,
            min1,
            max1,
            plotTop1,
            plotH1
        )

        if (lastY1 >= 0) {
            drawPlotLine(currX - stepX, lastY1, currX, y1, Color.Cyan)
        } else {
            drawVLine(currX, y1, y1, Color.Cyan)
        }

        lastY1 = y1

        // 채널 2
        if (_mode == 2) {
            let y2 = mapToY(
                f2,
                min2,
                max2,
                plotTop2,
                plotH2
            )

            if (lastY2 >= 0) {
                drawPlotLine(currX - stepX, lastY2, currX, y2, Color.Yellow)
            } else {
                drawVLine(currX, y2, y2, Color.Yellow)
            }

            lastY2 = y2
        }

        xPos += 1

        if (++tick >= TEXT_EVERY) {
            tick = 0
            if (_mode == 1) drawInfo1()
            else drawInfo2()
        }

        lastReset = input.runningTime()
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

    function drawPlotLine(x0: number, y0: number, x1: number, y1: number, color: Color) {
        if (x1 < x0) {
            let tx = x0
            x0 = x1
            x1 = tx

            let ty = y0
            y0 = y1
            y1 = ty
        }

        if (x0 == x1) {
            drawVLine(x0, y0, y1, color)
            return
        }

        let dx = x1 - x0
        for (let x = x0; x <= x1; x++) {
            let t = (x - x0) / dx
            let y = Math.round(y0 + (y1 - y0) * t)
            drawVLine(x, y, y, color)
        }
    }

    function clearSinglePlotArea() {
        RBTFT20.drawRectangle(gx + 1, gy + 16, gw - 2, gh - 17, Color.Black)
        drawBox(gx, gy, gw, gh, Color.DarkGrey)
        TFTFont.drawText5x7(margin + 6, gy + 6, _label1.toUpperCase(), 2, Color.Cyan, Color.Black)
    }

    function clearSplitPlotArea() {
        RBTFT20.drawRectangle(gx + 1, topY + 16, gw - 2, sectionH - 17, Color.Black)
        RBTFT20.drawRectangle(gx + 1, bottomY + 16, gw - 2, sectionH - 17, Color.Black)

        drawBox(gx, topY, gw, sectionH, Color.DarkGrey)
        drawBox(gx, bottomY, gw, sectionH, Color.DarkGrey)

        TFTFont.drawText5x7(margin + 6, topY + 6, _label1.toUpperCase(), 2, Color.Cyan, Color.Black)
        TFTFont.drawText5x7(margin + 6, bottomY + 6, _label2.toUpperCase(), 2, Color.Yellow, Color.Black)
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
        if (areaH < 2) return areaTop
        if (vmax <= vmin + 2) return areaTop + (areaH >> 1)

        let pad = idiv(vmax - vmin, 10) + 2
        let vmin_p = vmin - pad
        let vmax_p = vmax + pad

        let n = (v - vmin_p) / (vmax_p - vmin_p)
        if (n < 0) n = 0
        if (n > 1) n = 1

        return areaTop + (areaH - 1) - Math.round(n * (areaH - 1))
    }

    function drawInfo1() {
        RBTFT20.drawRectangle(margin + 2, gy + 28, infoW - 6, 80, Color.Black)
        TFTFont.drawText5x7(margin + 6, gy + 28, "V:", 2, Color.Cyan, Color.Black)
        TFTFont.drawNumber7Seg(margin + 26, gy + 24, Math.round(f1), 3, 15, 30, 4, Color.Cyan, Color.Black)
    }

    function drawInfo2() {
        RBTFT20.drawRectangle(margin + 2, topY + 28, infoW - 6, 80, Color.Black)
        TFTFont.drawNumber7Seg(margin + 26, topY + 24, Math.round(f1), 3, 15, 30, 4, Color.Cyan, Color.Black)

        RBTFT20.drawRectangle(margin + 2, bottomY + 28, infoW - 6, 80, Color.Black)
        TFTFont.drawNumber7Seg(margin + 26, bottomY + 24, Math.round(f2), 3, 15, 30, 4, Color.Yellow, Color.Black)
    }
}