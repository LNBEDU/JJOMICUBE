/**
 * JJOMICUBE NeoPixel Blocks
 * Ring 12 NeoPixel extension for micro:bit
 */
//% color="#ff7f24" icon="\uf110" block="JJONeo" weight=50
namespace JJONeo {

    let strip: neopixel.Strip = null
    let colors: number[] = []
    let ledCount = 12

    // --- 내부 유틸리티 함수 (블록 제외) ---
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

    // ==========================================
    // 1. 초기화 및 기본 설정 (Weight 100~95)
    // ==========================================

    /**
     * NeoPixel을 시작합니다 (P0 핀 고정).
     */
    //% block="NeoPixel 시작 LED 수 $num 밝기 $brightness"
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
     * 전체 LED의 밝기를 조절합니다.
     */
    //% blockId=jjo_set_global_brightness
    //% block="전체 밝기 $brightness"
    //% brightness.defl=20 brightness.min=0 brightness.max=255
    //% weight=95
    export function setBrightness(brightness: number): void {
        if (!strip) return
        strip.setBrightness(clamp(brightness, 0, 255))
        strip.show()
    }

    // ==========================================
    // 2. 전체 및 범위 제어 (Weight 94~85)
    // ==========================================

    /**
     * 모든 LED를 RGB 색상으로 켭니다.
     */
    //% blockId=jjo_set_rgb
    //% block="전체 RGB 색 R $r G $g B $b"
    //% r.min=0 r.max=255 g.min=0 g.max=255 b.min=0 b.max=255
    //% weight=94
    export function setRGB(r: number, g: number, b: number): void {
        if (!strip) return
        let c = packColor(r, g, b)
        fillStored(c)
        showAllStored()
    }

    /**
     * 모든 LED를 HUE 색상으로 켭니다.
     */
    //% blockId=jjo_set_hue
    //% block="전체 HUE 색상 $hue 채도 $sat 밝기 $lum"
    //% hue.min=0 hue.max=360 sat.min=0 sat.max=100 lum.min=0 lum.max=100
    //% weight=93
    export function setHUE(hue: number, sat: number, lum: number): void {
        if (!strip) return
        let c = neopixel.hsl(clamp(hue, 0, 360), clamp(sat, 0, 100), clamp(lum, 0, 100))
        let packed = packColor(unpackR(c), unpackG(c), unpackB(c))
        fillStored(packed)
        showAllStored()
    }

    /**
     * 지정한 범위의 LED 색상을 변경합니다.
     */
    //% blockId=jjo_set_range_rgb
    //% block="LED $start 번부터 $end 번까지 RGB R $r G $g B $b"
    //% r.min=0 r.max=255 g.min=0 g.max=255 b.min=0 b.max=255
    //% weight=85
    export function setRangeRGB(start: number, end: number, r: number, g: number, b: number): void {
        if (!strip) return
        start = clamp(start, 0, ledCount - 1)
        end = clamp(end, 0, ledCount - 1)
        if (start > end) { let t = start; start = end; end = t }
        let c = packColor(r, g, b)
        for (let i = start; i <= end; i++) { setStoredPixel(i, c) }
        strip.show()
    }

    // ==========================================
    // 3. 개별 LED 제어 (Weight 84~75)
    // ==========================================

    /**
     * 특정 번호의 LED만 RGB 색상으로 켭니다.
     */
    //% blockId=jjo_set_pixel_rgb
    //% block="LED $index 번 RGB R $r G $g B $b"
    //% weight=84
    export function setPixelRGB(index: number, r: number, g: number, b: number): void {
        if (!strip) return
        index = clamp(index, 0, ledCount - 1)
        setStoredPixel(index, packColor(r, g, b))
        strip.show()
    }

    /**
     * 특정 번호의 LED 하나만 켜고 나머지는 모두 끕니다.
     */
    //% blockId=jjo_show_one_rgb
    //% block="LED $index 번만 RGB R $r G $g B $b"
    //% weight=80
    export function showOneRGB(index: number, r: number, g: number, b: number): void {
        if (!strip) return
        index = clamp(index, 0, ledCount - 1)
        fillStored(packColor(0, 0, 0))
        colors[index] = packColor(r, g, b)
        showAllStored()
    }

    /**
     * 특정 번호의 LED를 끕니다.
     */
    //% blockId=jjo_clear_pixel
    //% block="LED $index 번 끄기"
    //% weight=75
    export function clearPixel(index: number): void {
        if (!strip) return
        index = clamp(index, 0, ledCount - 1)
        setStoredPixel(index, packColor(0, 0, 0))
        strip.show()
    }

    // ==========================================
    // 4. 특수 효과 및 애니메이션 (Weight 74~60)
    // ==========================================

    /**
     * 시계 방향으로 한 칸씩 회전시킵니다.
     */
    //% blockId=jjo_rotate_cw
    //% block="시계 방향 회전"
    //% weight=74
    export function rotateClockwise(): void {
        if (!strip || ledCount <= 1) return
        let last = colors[ledCount - 1]
        for (let i = ledCount - 1; i > 0; i--) { colors[i] = colors[i - 1] }
        colors[0] = last
        showAllStored()
    }


    /**
     * 시계 방향으로 한 칸씩 회전시킵니다.
     */
    //% blockId=jjo_rotate_ccw
    //% block="반시계 방향 회전"
    //% weight=73
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
     * 원형 무지개 효과를 보여줍니다.
     */
    //% blockId=jjo_rainbow
    //% block="원형 무지개"
    //% weight=70
    export function rainbow(): void {
        if (!strip) return
        for (let i = 0; i < ledCount; i++) {
            let h = Math.floor((360 * i) / ledCount)
            let c = neopixel.hsl(h, 100, 50)
            colors[i] = packColor(unpackR(c), unpackG(c), unpackB(c))
        }
        showAllStored()
    }

    /**
     * 지정한 범위에 시작색~끝색 그라데이션을 표시합니다.
     */
    //% blockId=jjo_rainbow_range_hue
    //% block="원형무지개 LED $start 번부터 $end 번까지 HUE $startHue 에서 $endHue 까지"
    //% start.min=0 start.max=63
    //% end.min=0 end.max=63
    //% startHue.min=0 startHue.max=360
    //% endHue.min=0 endHue.max=360
    //% weight=69
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
            let c1 = neopixel.hsl(startHue, 100, 50)
            colors[start] = packColor(unpackR(c1), unpackG(c1), unpackB(c1))
            showAllStored()
            return
        }

        for (let i = 0; i < count; i++) {
            let h = startHue + ((endHue - startHue) * i) / (count - 1)
            let c = neopixel.hsl(Math.floor(h), 100, 50)
            colors[start + i] = packColor(unpackR(c), unpackG(c), unpackB(c))
        }

        showAllStored()
    } 

    /**
     * 모든 LED를 끕니다.
     */
    //% blockId=jjo_clear
    //% block="전체 끄기"
    //% weight=60
    export function clear(): void {
        if (!strip) return
        fillStored(packColor(0, 0, 0))
        strip.clear()
        strip.show()
    }

    

}


/**
 * 이 부분은 원본 Neopixel 카테고리를 툴박스에서 숨깁니다.
 */
//% color="#0078d7" icon="\uf0eb" blockHidden=true weight=40
namespace neopixel {
}
