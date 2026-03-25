/**
 * JJOMICUBE NeoPixel Blocks
 * Ring 12 NeoPixel extension for micro:bit
 */
//% color="#ff7f24" icon="\uf110" block="JJONeo" weight=50
namespace JJONeo {

    let strip: neopixel.Strip = null
    let colors: number[] = []
    let ledCount = 12

    function clamp(v: number, min: number, max: number): number {
        if (v < min) return min
        if (v > max) return max
        return v
    }

    function packColor(r: number, g: number, b: number): number {
        r = clamp(Math.floor(r), 0, 255)
        g = clamp(Math.floor(g), 0, 255)
        b = clamp(Math.floor(b), 0, 255)
        return (r << 16) | (g << 8) | b
    }

    function unpackR(c: number): number { return (c >> 16) & 0xff }
    function unpackG(c: number): number { return (c >> 8) & 0xff }
    function unpackB(c: number): number { return c & 0xff }

    function applyStoredColor(index: number): void {
        if (!strip) return
        if (index < 0 || index >= ledCount) return

        let c = colors[index]
        strip.setPixelColor(index, neopixel.rgb(unpackR(c), unpackG(c), unpackB(c)))
    }

    function setStoredPixel(index: number, color: number): void {
        if (!strip) return
        if (index < 0 || index >= ledCount) return
        colors[index] = color
        applyStoredColor(index)
    }

    function fillStored(color: number): void {
        for (let i = 0; i < ledCount; i++) {
            colors[i] = color
        }
    }

    function showAllStored(): void {
        if (!strip) return
        for (let i = 0; i < ledCount; i++) {
            applyStoredColor(i)
        }
        strip.show()
    }

    /**
     * 네오픽셀 시작
     */
    //% block="네오픽셀 시작 LED 수 $num 밝기 $brightness"
    //% weight=100
    export function init(num: number, brightness: number): void {
        ledCount = clamp(num, 1, 64)
        strip = neopixel.create(DigitalPin.P0, ledCount, NeoPixelMode.RGB)
        strip.setBrightness(clamp(brightness, 0, 255))

        colors = []
        for (let i = 0; i < ledCount; i++) {
            colors.push(packColor(0, 0, 0))
        }

        strip.clear()
        strip.show()
    }

    /**
     * 전체 밝기
     */
    //% block="전체 밝기 $brightness"
    //% brightness.defl=20 brightness.min=0 brightness.max=255
    //% weight=95
    export function setBrightness(brightness: number): void {
        if (!strip) return
        strip.setBrightness(clamp(brightness, 0, 255))
        strip.show()
    }

    /**
     * 색상 만들기
     */
    //% block="색상 만들기 R $r G $g B $b"
    //% r.min=0 r.max=255
    //% g.min=0 g.max=255
    //% b.min=0 b.max=255
    //% weight=94
    export function rgb(r: number, g: number, b: number): number {
        return packColor(r, g, b)
    }

    /**
     * 기본색 빨강
     */
    //% block="기본색 빨강"
    //% weight=93
    export function red(): number {
        return packColor(255, 0, 0)
    }

    /**
     * 기본색 초록
     */
    //% block="기본색 초록"
    //% weight=92
    export function green(): number {
        return packColor(0, 255, 0)
    }

    /**
     * 기본색 파랑
     */
    //% block="기본색 파랑"
    //% weight=91
    export function blue(): number {
        return packColor(0, 0, 255)
    }

    /**
     * 기본색 노랑
     */
    //% block="기본색 노랑"
    //% weight=90
    export function yellow(): number {
        return packColor(255, 255, 0)
    }

    /**
     * 기본색 흰색
     */
    //% block="기본색 흰색"
    //% weight=89
    export function white(): number {
        return packColor(255, 255, 255)
    }

    /**
     * 기본색 검정
     */
    //% block="기본색 검정"
    //% weight=88
    export function black(): number {
        return packColor(0, 0, 0)
    }

    /**
    * 기본색 보라
    */
    //% block="기본색 보라"
    //% weight=87
    export function purple(): number {
        return packColor(128, 0, 128)
    }

    /**
     * 기본색 청녹 (Cyan 계열)
     */
    //% block="기본색 청녹"
    //% weight=86
    export function cyan(): number {
        return packColor(0, 255, 255)
    }

    /**
     * 기본색 자홍 (Magenta)
     */
    //% block="기본색 자홍"
    //% weight=85
    export function magenta(): number {
        return packColor(255, 0, 255)
    }

    /**
     * 기본색 남색 (Indigo)
     */
    //% block="기본색 남색"
    //% weight=84
    export function indigo(): number {
        return packColor(0, 0, 128)
    }

    /**
     * 전체 색상
     */
    //% block="전체 색상 $color"
    //% weight=80
    export function setColor(color: number): void {
        if (!strip) return
        fillStored(color)
        showAllStored()
    }

    /**
     * LED 범위 색상
     */
    //% block="LED $start 번부터 $end 번까지 색상 $color"
    //% weight=69
    export function setRangeColor(start: number, end: number, color: number): void {
        if (!strip) return

        start = clamp(start, 0, ledCount - 1)
        end = clamp(end, 0, ledCount - 1)

        if (start > end) {
            let t = start
            start = end
            end = t
        }

        for (let i = start; i <= end; i++) {
            setStoredPixel(i, color)
        }

        strip.show()
    }

    /**
     * LED 한 개 색상
     */
    //% block="LED $index 번 색상 $color"
    //% weight=68
    export function setPixelColor(index: number, color: number): void {
        if (!strip) return
        index = clamp(index, 0, ledCount - 1)
        setStoredPixel(index, color)
        strip.show()
    }

    /**
     * LED 한 개만 색상 켜기
     */
    //% block="LED $index 번만 색상 $color"
    //% weight=66
    export function showOneColor(index: number, color: number): void {
        if (!strip) return
        index = clamp(index, 0, ledCount - 1)
        fillStored(packColor(0, 0, 0))
        colors[index] = color
        showAllStored()
    }

    /**
     * LED 끄기
     */
    //% block="LED $index 번 끄기"
    //% weight=63
    export function clearPixel(index: number): void {
        if (!strip) return
        index = clamp(index, 0, ledCount - 1)
        setStoredPixel(index, packColor(0, 0, 0))
        strip.show()
    }

    /**
     * 시계 방향 회전
     */
    //% block="시계 방향 회전"
    //% weight=60
    export function rotateClockwise(): void {
        if (!strip || ledCount <= 1) return

        let last = colors[ledCount - 1]
        for (let i = ledCount - 1; i > 0; i--) {
            colors[i] = colors[i - 1]
        }
        colors[0] = last
        showAllStored()
    }

    /**
     * 반시계 방향 회전
     */
    //% block="반시계 방향 회전"
    //% weight=59
    export function rotateCounterClockwise(): void {
        if (!strip || ledCount <= 1) return

        let first = colors[0]
        for (let i = 0; i < ledCount - 1; i++) {
            colors[i] = colors[i + 1]
        }
        colors[ledCount - 1] = first
        showAllStored()
    }

    /**
     * 원형 무지개
     */
    //% block="원형 무지개"
    //% weight=58
    export function rainbow(): void {
        if (!strip) return

        for (let i = 0; i < ledCount; i++) {
            let h = Math.floor((360 * i) / ledCount)
            let c = neopixel.hsl(h, 100, 50)
            colors[i] = c
        }

        showAllStored()
    }

    /**
     * 범위 무지개
     */
    //% block="원형무지개 LED $start 번부터 $end 번까지 HUE $startHue 에서 $endHue 까지"
    //% start.min=0 start.max=63
    //% end.min=0 end.max=63
    //% startHue.min=0 startHue.max=360
    //% endHue.min=0 endHue.max=360
    //% weight=57
    export function rainbowRangeHue(start: number, end: number, startHue: number, endHue: number): void {
        if (!strip) return

        start = clamp(start, 0, ledCount - 1)
        end = clamp(end, 0, ledCount - 1)
        startHue = clamp(startHue, 0, 360)
        endHue = clamp(endHue, 0, 360)

        if (start > end) {
            let t = start
            start = end
            end = t
        }

        let count = end - start + 1
        if (count <= 0) return

        if (count == 1) {
            colors[start] = neopixel.hsl(startHue, 100, 50)
            showAllStored()
            return
        }

        for (let i = 0; i < count; i++) {
            let h = startHue + ((endHue - startHue) * i) / (count - 1)
            colors[start + i] = neopixel.hsl(Math.floor(h), 100, 50)
        }

        showAllStored()
    }

    /**
     * 전체 끄기
     */
    //% block="전체 끄기"
    //% weight=50
    export function clear(): void {
        if (!strip) return
        fillStored(packColor(0, 0, 0))
        strip.clear()
        strip.show()
    }
}

/**
 * 원본 neopixel 카테고리 숨기기
 */
//% color="#0078d7" icon="\uf0eb" blockHidden=true weight=40
namespace neopixel {
}