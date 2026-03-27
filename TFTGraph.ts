/**
 * TFT 그래프 + 상태 표시 패키지
 * ST7789 320x240 전용
 */

//% color=#FFAA00 icon="\uf201" block="TFT 그래프" weight=70
namespace TFTGraph {
    // -----------------------------
    // 내부 상태
    // -----------------------------
    let _started = false
    let _mode = 0 // 1=단일, 2=2분할

    let _pin1: AnalogPin = AnalogPin.P1
    let _pin2: AnalogPin = AnalogPin.P2
    let _label1 = "P1"
    let _label2 = "P2"

    let _thickness = 2
    let _smoothLevel = 2 // 0=없음, 1~3
    let _pauseMs = 30

    // 그래프 범위 고정용
    let _yFixed = false
    let _yMinFixed = 0
    let _yMaxFixed = 1023

    let _windowSec = 6
    let _useWindowSec = false

    // 초기 자동 범위 여유값
    let _autoRangePadding = 5

    // -----------------------------
    // 레이아웃
    // -----------------------------
    const W = 320
    const H = 240
    export const STATUS_H = 26

    let margin = 8
    let infoW = 92
    let gap = 10

    let gx = 0
    let gy = 0
    let gw = 0
    let gh = 0

    let sectionH = 0
    let topY = 0
    let bottomY = 0

    let plotTop1 = 0
    let plotH1 = 0
    let plotTop2 = 0
    let plotH2 = 0

    // -----------------------------
    // 그래프 상태
    // -----------------------------
    let xPos = 0
    let lastY1 = -1
    let lastY2 = -1

    let f1 = 0
    let f2 = 0
    let fInit = false

    // 실제 측정값 최소/최대
    let realMin1 = 1023
    let realMax1 = 0
    let realMin2 = 1023
    let realMax2 = 0

    function idiv(a: number, b: number): number {
        return (a / b) >> 0
    }

    function clamp(v: number, lo: number, hi: number): number {
        if (v < lo) return lo
        if (v > hi) return hi
        return v
    }

    function getPlotLeft(): number {
        return gx + 2
    }

    function getPlotRight(): number {
        return gx + gw - _thickness - 2
    }

    function getPlotPixelCount(): number {
        let cnt = getPlotRight() - getPlotLeft() + 1
        if (cnt < 1) cnt = 1
        return cnt
    }

    function updatePauseFromWindow(): void {
        if (!_useWindowSec) return

        let points = getPlotPixelCount()
        let ms = idiv(_windowSec * 1000, points)
        ms = clamp(ms, 5, 1000)
        _pauseMs = ms
    }

    /**
     * 상단 상태 메시지 표시
     */
    //% block="상태 표시 메시지 %msg 색 %color"
    //% msg.defl="준비 완료"
    //% weight=100
    export function drawStatus(msg: string, color: number) {
        if (!msg) msg = ""

        while (msg.indexOf("\r") >= 0) msg = msg.replace("\r", " ")
        while (msg.indexOf("\n") >= 0) msg = msg.replace("\n", " ")
        while (msg.indexOf("\t") >= 0) msg = msg.replace("\t", " ")

        if (msg.length > 20) {
            msg = msg.slice(0, 20)
        }

        TFT20.drawRectangle(0, 0, 270, STATUS_H - 3, TFT20.black())
        TFTFont.drawText5x7(margin, 6, msg, 2, color, TFT20.black())
    }

    /**
     * 그래프 설정
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

        if (_smoothLevel < 0) _smoothLevel = 0
        if (_smoothLevel > 3) _smoothLevel = 3

        if (!_useWindowSec) {
            if (speed == 0) _pauseMs = 20
            else if (speed == 1) _pauseMs = 30
            else _pauseMs = 60
        } else {
            updatePauseFromWindow()
        }
    }

    /**
     * 그래프에 보이는 시간 설정
     */
    //% block="그래프 보이는 시간 %sec 초"
    //% sec.min=1 sec.max=60 sec.defl=6
    //% weight=94
    export function setWindowSeconds(sec: number) {
        _windowSec = clamp(sec, 1, 60)
        _useWindowSec = true
        updatePauseFromWindow()
    }

    /**
     * 그래프 시간 자동
     */
    //% block="그래프 시간 자동"
    //% weight=93
    export function setWindowAuto() {
        _useWindowSec = false
    }

    /**
     * Y축 고정 범위
     */
    //% block="그래프 범위 최소 %vmin 최대 %vmax"
    //% weight=92
    export function setYFixed(vmin: number, vmax: number) {
        if (vmax <= vmin) vmax = vmin + 1
        _yFixed = true
        _yMinFixed = vmin
        _yMaxFixed = vmax
    }

    /**
     * 그래프 Min Max 설정
     */
    //% block="그래프 Min %vmin Max %vmax"
    //% weight=91
    export function setMinMax(vmin: number, vmax: number) {
        setYFixed(vmin, vmax)
    }

    /**
     * Y축 자동 범위
     */
    //% block="Y축 자동"
    //% weight=90
    export function setYAuto() {
        _yFixed = false
    }

    /**
     * 자동 범위 여유 설정
     */
    //% block="자동 범위 여유 %padding"
    //% padding.min=1 padding.max=100 padding.defl=5
    //% weight=89
    export function setAutoRangePadding(padding: number) {
        _autoRangePadding = clamp(padding, 1, 100)
    }

    /**
     * 단일 그래프 시작
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

        drawBox(gx, gy, gw, gh, TFT20.rgb(120, 120, 120))
        TFTFont.drawText5x7(margin + 6, gy + 6, _label1.toUpperCase(), 2, TFT20.cyan(), TFT20.black())

        plotTop1 = gy + 18
        plotH1 = gh - 22

        updatePauseFromWindow()
        resetGraphState()
        clearSinglePlotArea()
        drawInfo1Labels()
        drawInfo1Values()
    }

    /**
     * 2분할 그래프 시작
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

        drawBox(gx, topY, gw, sectionH, TFT20.rgb(120, 120, 120))
        drawBox(gx, bottomY, gw, sectionH, TFT20.rgb(120, 120, 120))

        TFTFont.drawText5x7(margin + 6, topY + 6, _label1.toUpperCase(), 2, TFT20.cyan(), TFT20.black())
        TFTFont.drawText5x7(margin + 6, bottomY + 6, _label2.toUpperCase(), 2, TFT20.yellow(), TFT20.black())

        plotTop1 = topY + 18
        plotH1 = sectionH - 22
        plotTop2 = bottomY + 18
        plotH2 = sectionH - 22

        updatePauseFromWindow()
        resetGraphState()
        clearSplitPlotArea()
        drawInfo2Labels()
        drawInfo2Values()
    }

    /**
     * 그래프 업데이트
     */
    //% block="그래프 업데이트"
    //% weight=80
    export function update() {
        if (!_started) return

        let v1 = pins.analogReadPin(_pin1)
        let v2 = (_mode == 2) ? pins.analogReadPin(_pin2) : 0

        if (!fInit) {
            f1 = v1
            f2 = v2
            fInit = true
        } else {
            let w = (_smoothLevel == 1) ? 2 : (_smoothLevel == 2) ? 4 : (_smoothLevel == 3) ? 6 : 0
            if (w > 0) {
                f1 = (f1 * (10 - w) + v1 * w) / 10
                if (_mode == 2) {
                    f2 = (f2 * (10 - w) + v2 * w) / 10
                }
            } else {
                f1 = v1
                if (_mode == 2) f2 = v2
            }
        }

        if (xPos == 0) {
            realMin1 = f1
            realMax1 = f1
            if (_mode == 2) {
                realMin2 = f2
                realMax2 = f2
            }
        } else {
            if (f1 < realMin1) realMin1 = f1
            if (f1 > realMax1) realMax1 = f1

            if (_mode == 2) {
                if (f2 < realMin2) realMin2 = f2
                if (f2 > realMax2) realMax2 = f2
            }
        }

        let plotMin1 = 0
        let plotMax1 = 0
        let plotMin2 = 0
        let plotMax2 = 0

        if (_yFixed) {
            plotMin1 = _yMinFixed
            plotMax1 = _yMaxFixed
            plotMin2 = _yMinFixed
            plotMax2 = _yMaxFixed
        } else {
            plotMin1 = realMin1
            plotMax1 = realMax1
            plotMin2 = realMin2
            plotMax2 = realMax2

            if (plotMin1 == plotMax1) {
                plotMin1 -= _autoRangePadding
                plotMax1 += _autoRangePadding
            }
            if (_mode == 2 && plotMin2 == plotMax2) {
                plotMin2 -= _autoRangePadding
                plotMax2 += _autoRangePadding
            }
        }

        if (plotMin1 == plotMax1) plotMax1 = plotMin1 + 1
        if (_mode == 2 && plotMin2 == plotMax2) plotMax2 = plotMin2 + 1

        let plotLeft = getPlotLeft()
        let plotRight = getPlotRight()
        let stepX = 1
        let currX = plotLeft + xPos

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

            realMin1 = f1
            realMax1 = f1
            if (_mode == 2) {
                realMin2 = f2
                realMax2 = f2
            }
        }

        let y1 = mapToYForPlot(f1, plotMin1, plotMax1, plotTop1, plotH1)

        if (lastY1 >= 0) {
            drawPlotLine(currX - stepX, lastY1, currX, y1, TFT20.cyan())
        } else {
            drawDot(currX, y1, TFT20.cyan())
        }
        lastY1 = y1

        if (_mode == 2) {
            let y2 = mapToYForPlot(f2, plotMin2, plotMax2, plotTop2, plotH2)

            if (lastY2 >= 0) {
                drawPlotLine(currX - stepX, lastY2, currX, y2, TFT20.yellow())
            } else {
                drawDot(currX, y2, TFT20.yellow())
            }
            lastY2 = y2
        }

        xPos += 1

        if (_mode == 1) drawInfo1Values()
        else drawInfo2Values()

        basic.pause(_pauseMs)
    }

    function resetGraphState() {
        xPos = 0
        lastY1 = -1
        lastY2 = -1
        f1 = 0
        f2 = 0
        fInit = false
        realMin1 = 1023
        realMax1 = 0
        realMin2 = 1023
        realMax2 = 0
    }

    function layoutCommon() {
        TFT20.init()
        TFT20.drawRectangle(0, 0, W, H, TFT20.black())

        gx = margin + infoW
        gy = STATUS_H + margin
        gw = W - gx - margin
        gh = H - gy - margin

        TFT20.drawRectangle(0, STATUS_H - 2, W, 1, TFT20.rgb(120, 120, 120))

        drawBox(margin - 1, gy - 1, W - (margin - 1) * 2, gh + 2, TFT20.rgb(120, 120, 120))
        drawBox(margin, gy, infoW - 2, gh, TFT20.rgb(120, 120, 120))
    }

    function drawBox(x: number, y: number, w: number, h: number, c: number) {
        TFT20.drawRectangle(x, y, w, 1, c)
        TFT20.drawRectangle(x, y + h - 1, w, 1, c)
        TFT20.drawRectangle(x, y, 1, h, c)
        TFT20.drawRectangle(x + w - 1, y, 1, h, c)
    }

    function drawDot(x: number, y: number, color: number) {
        let half = idiv(_thickness - 1, 2)
        TFT20.drawRectangle(x - half, y - half, _thickness, _thickness, color)
    }

    function drawPlotLine(x0: number, y0: number, x1: number, y1: number, color: number) {
        let dx = Math.abs(x1 - x0)
        let sx = x0 < x1 ? 1 : -1
        let dy = -Math.abs(y1 - y0)
        let sy = y0 < y1 ? 1 : -1
        let err = dx + dy

        while (true) {
            drawDot(x0, y0, color)

            if (x0 == x1 && y0 == y1) break

            let e2 = err * 2

            if (e2 >= dy) {
                err += dy
                x0 += sx
            }

            if (e2 <= dx) {
                err += dx
                y0 += sy
            }
        }
    }

    function clearSinglePlotArea() {
        TFT20.drawRectangle(gx + 1, gy + 16, gw - 2, gh - 17, TFT20.black())
        drawBox(gx, gy, gw, gh, TFT20.rgb(120, 120, 120))
        TFTFont.drawText5x7(margin + 6, gy + 6, _label1.toUpperCase(), 2, TFT20.cyan(), TFT20.black())
    }

    function clearSplitPlotArea() {
        TFT20.drawRectangle(gx + 1, topY + 16, gw - 2, sectionH - 17, TFT20.black())
        TFT20.drawRectangle(gx + 1, bottomY + 16, gw - 2, sectionH - 17, TFT20.black())

        drawBox(gx, topY, gw, sectionH, TFT20.rgb(120, 120, 120))
        drawBox(gx, bottomY, gw, sectionH, TFT20.rgb(120, 120, 120))

        TFTFont.drawText5x7(margin + 6, topY + 6, _label1.toUpperCase(), 2, TFT20.cyan(), TFT20.black())
        TFTFont.drawText5x7(margin + 6, bottomY + 6, _label2.toUpperCase(), 2, TFT20.yellow(), TFT20.black())
    }

    function mapToYForPlot(v: number, vmin: number, vmax: number, areaTop: number, areaH: number): number {
        if (areaH < 2) return areaTop
        if (vmax <= vmin) return areaTop + (areaH >> 1)

        let n = (v - vmin) / (vmax - vmin)

        if (n < 0) n = 0
        if (n > 1) n = 1

        return areaTop + (areaH - 1) - Math.round(n * (areaH - 1))
    }

    function drawInfo1Labels() {
        TFT20.drawRectangle(margin + 2, gy + 24, infoW - 6, gh - 28, TFT20.black())

        TFTFont.drawText5x7(margin + 6, gy + 26, "Val", 2, TFT20.cyan(), TFT20.black())
        TFTFont.drawText5x7(margin + 6, gy + 76, "Min", 2, TFT20.yellow(), TFT20.black())
        TFTFont.drawText5x7(margin + 6, gy + 126, "Max", 2, TFT20.yellow(), TFT20.black())
    }

    function drawInfo1Values() {
        TFT20.drawRectangle(margin + 46, gy + 48, infoW - 54, 18, TFT20.black())
        TFTFont.drawText5x7(margin + 46, gy + 48, "" + Math.round(f1), 2, TFT20.white(), TFT20.black())

        TFT20.drawRectangle(margin + 46, gy + 98, infoW - 54, 18, TFT20.black())
        TFTFont.drawText5x7(margin + 46, gy + 98, "" + Math.round(realMin1), 2, TFT20.white(), TFT20.black())

        TFT20.drawRectangle(margin + 46, gy + 148, infoW - 54, 18, TFT20.black())
        TFTFont.drawText5x7(margin + 46, gy + 148, "" + Math.round(realMax1), 2, TFT20.white(), TFT20.black())
    }

    function drawInfo2Labels() {
        TFT20.drawRectangle(margin + 2, topY + 22, infoW - 6, 74, TFT20.black())
        TFTFont.drawText5x7(margin + 6, topY + 24, "Val", 2, TFT20.cyan(), TFT20.black())
        TFTFont.drawText5x7(margin + 6, topY + 46, "Min", 2, TFT20.yellow(), TFT20.black())
        TFTFont.drawText5x7(margin + 6, topY + 68, "Max", 2, TFT20.yellow(), TFT20.black())

        TFT20.drawRectangle(margin + 2, bottomY + 22, infoW - 6, 74, TFT20.black())
        TFTFont.drawText5x7(margin + 6, bottomY + 24, "Val", 2, TFT20.cyan(), TFT20.black())
        TFTFont.drawText5x7(margin + 6, bottomY + 46, "Min", 2, TFT20.yellow(), TFT20.black())
        TFTFont.drawText5x7(margin + 6, bottomY + 68, "Max", 2, TFT20.yellow(), TFT20.black())
    }

    function drawInfo2Values() {
        TFT20.drawRectangle(margin + 46, topY + 24, infoW - 54, 14, TFT20.black())
        TFTFont.drawText5x7(margin + 46, topY + 24, "" + Math.round(f1), 2, TFT20.white(), TFT20.black())

        TFT20.drawRectangle(margin + 46, topY + 46, infoW - 54, 14, TFT20.black())
        TFTFont.drawText5x7(margin + 46, topY + 46, "" + Math.round(realMin1), 2, TFT20.white(), TFT20.black())

        TFT20.drawRectangle(margin + 46, topY + 68, infoW - 54, 14, TFT20.black())
        TFTFont.drawText5x7(margin + 46, topY + 68, "" + Math.round(realMax1), 2, TFT20.white(), TFT20.black())

        TFT20.drawRectangle(margin + 46, bottomY + 24, infoW - 54, 14, TFT20.black())
        TFTFont.drawText5x7(margin + 46, bottomY + 24, "" + Math.round(f2), 2, TFT20.white(), TFT20.black())

        TFT20.drawRectangle(margin + 46, bottomY + 46, infoW - 54, 14, TFT20.black())
        TFTFont.drawText5x7(margin + 46, bottomY + 46, "" + Math.round(realMin2), 2, TFT20.white(), TFT20.black())

        TFT20.drawRectangle(margin + 46, bottomY + 68, infoW - 54, 14, TFT20.black())
        TFTFont.drawText5x7(margin + 46, bottomY + 68, "" + Math.round(realMax2), 2, TFT20.white(), TFT20.black())
    }
}