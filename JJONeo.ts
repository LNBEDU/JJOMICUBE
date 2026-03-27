/**
 * JJOMICUBE NeoPixel Blocks
 * Ring 12 NeoPixel extension for micro:bit
 */

// 네오픽셀용 RGB 색상 enum
enum NeoColor {
    //% block="검정"
    Black = 0x000000,
    //% block="남색"
    Navy = 0x000080,
    //% block="진초록"
    DarkGreen = 0x008000,
    //% block="진청록"
    DarkCyan = 0x008080,
    //% block="고동"
    Maroon = 0x800000,
    //% block="보라"
    Purple = 0x800080,
    //% block="올리브"
    Olive = 0x808000,
    //% block="연회색"
    LightGrey = 0xC0C0C0,
    //% block="진회색"
    DarkGrey = 0x808080,
    //% block="파랑"
    Blue = 0x0000FF,
    //% block="초록"
    Green = 0x00FF00,
    //% block="청록"
    Cyan = 0x00FFFF,
    //% block="빨강"
    Red = 0xFF0000,
    //% block="자홍"
    Magenta = 0xFF00FF,
    //% block="노랑"
    Yellow = 0xFFFF00,
    //% block="흰색"
    White = 0xFFFFFF,
    //% block="주황"
    Orange = 0xFFA500,
    //% block="분홍"
    Pink = 0xFFC0CB,
    //% block="하늘색"
    SkyBlue = 0x87CEEB,
    //% block="민트"
    Mint = 0x98FF98,
    //% block="라임"
    Lime = 0x32CD32,
    //% block="금색"
    Gold = 0xFFD700,
    //% block="은색"
    Silver = 0xC0C0C0,
    //% block="인디고"
    Indigo = 0x4B0082,
    //% block="청보라"
    Violet = 0x8A2BE2,
    //% block="청녹"
    Aqua = 0x00FFFF
}

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
     * 드롭다운 색상 선택
     */
    //% block="색상 $color"
    //% weight=93
    export function color(color: NeoColor): number {
        return color as number
    }

    /**
     * 기본색 빨강
     */
    export function red(): number {
        return packColor(255, 0, 0)
    }

    /**
     * 기본색 초록
     */
    export function green(): number {
        return packColor(0, 255, 0)
    }

    /**
     * 기본색 파랑
     */
    export function blue(): number {
        return packColor(0, 0, 255)
    }

    /**
     * 기본색 노랑
     */
    export function yellow(): number {
        return packColor(255, 255, 0)
    }

    /**
     * 기본색 흰색
     */
    export function white(): number {
        return packColor(255, 255, 255)
    }

    /**
     * 기본색 검정
     */
    export function black(): number {
        return packColor(0, 0, 0)
    }

    /**
     * 기본색 보라
     */
    export function purple(): number {
        return packColor(128, 0, 128)
    }

    /**
     * 기본색 청녹
     */
    export function cyan(): number {
        return packColor(0, 255, 255)
    }

    /**
     * 기본색 자홍
     */
    export function magenta(): number {
        return packColor(255, 0, 255)
    }

    /**
     * 기본색 남색
     */
    export function indigo(): number {
        return packColor(0, 0, 128)
    }

    /**
     * 기본색 주황
     */
    export function orange(): number {
        return packColor(255, 165, 0)
    }

    /**
     * 기본색 분홍
     */
    export function pink(): number {
        return packColor(255, 192, 203)
    }

    /**
     * 기본색 하늘색
     */
    export function skyBlue(): number {
        return packColor(135, 206, 235)
    }

    /**
     * 기본색 민트
     */
    export function mint(): number {
        return packColor(152, 255, 152)
    }

    /**
     * 기본색 라임
     */
    export function lime(): number {
        return packColor(50, 205, 50)
    }

    /**
     * 기본색 금색
     */
    export function gold(): number {
        return packColor(255, 215, 0)
    }

    /**
     * 기본색 은색
     */
    export function silver(): number {
        return packColor(192, 192, 192)
    }

    /**
     * 전체 색상
     */
    //% block="전체 색상 $color"
    //% weight=70
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